import { NextResponse } from 'next/server';
import webpush from 'web-push';
import postgres from 'postgres';

// VAPID configuration
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = 'mailto:pastillero@pastilleros.vercel.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Map predefined slots to approximate hours (24h format)
const SLOT_HOURS: Record<string, number> = {
  '07:00 AM (Ayunas)': 7,
  '08:00 AM (Mañana)': 8,
  'ALMUERZO (Mediodía)': 12,
  '16:00 PM (Tarde)': 16,
  '20:00 PM (Noche)': 20,
  '22:00 PM (Al dormir)': 22,
};

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const connectionString = process.env.DATABASE_URL!;
    const sql = postgres(connectionString, { ssl: 'require' });

    // Get current hour in Argentina timezone (UTC-3)
    const now = new Date();
    const argentinaOffset = -3;
    const utcHours = now.getUTCHours();
    const argHour = (utcHours + argentinaOffset + 24) % 24;
    const today = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    const dayOfWeek = today.getDay(); // 0=Sunday

    console.log(`Cron running at Argentina hour: ${argHour}, day: ${dayOfWeek}`);

    // Find which time slots match the current hour
    const matchingSlots = Object.entries(SLOT_HOURS)
      .filter(([_, hour]) => hour === argHour)
      .map(([slot]) => slot);

    if (matchingSlots.length === 0) {
      await sql.end();
      return NextResponse.json({ message: `No medication slots at hour ${argHour}` });
    }

    console.log(`Matching slots: ${matchingSlots.join(', ')}`);

    // Query: Get all schedules that match the current time slot, 
    // along with their medication info and the user's push subscriptions
    const results = await sql`
      SELECT 
        m.name AS med_name,
        m.dose AS med_dose,
        s.time_slot,
        s.frequency,
        s.specific_days,
        s.start_date,
        p.user_id,
        ps.endpoint,
        ps.p256dh,
        ps.auth
      FROM schedules s
      JOIN medications m ON m.id = s.medication_id
      JOIN patients p ON p.id = m.patient_id
      JOIN push_subscriptions ps ON ps.user_id = p.user_id
      WHERE s.time_slot = ANY(${matchingSlots})
    `;

    // Filter by frequency
    const toNotify: Map<string, { endpoint: string; p256dh: string; auth: string; meds: string[] }> = new Map();

    for (const row of results) {
      let shouldNotify = false;

      if (row.frequency === 'diario') {
        shouldNotify = true;
      } else if (row.frequency === 'dias_especificos') {
        const days = row.specific_days || [];
        shouldNotify = days.includes(dayOfWeek);
      } else if (row.frequency === 'dia_por_medio') {
        if (row.start_date) {
          const start = new Date(row.start_date);
          start.setHours(0, 0, 0, 0);
          const todayClean = new Date(today);
          todayClean.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((todayClean.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          shouldNotify = diffDays >= 0 && diffDays % 2 === 0;
        } else {
          shouldNotify = true;
        }
      }

      if (shouldNotify) {
        const key = row.endpoint;
        if (!toNotify.has(key)) {
          toNotify.set(key, { endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth, meds: [] });
        }
        toNotify.get(key)!.meds.push(`${row.med_name} (${row.med_dose})`);
      }
    }

    console.log(`Sending notifications to ${toNotify.size} subscriptions`);

    // Send push notifications
    let sent = 0;
    let failed = 0;

    for (const [endpoint, data] of toNotify) {
      const subscription = {
        endpoint: data.endpoint,
        keys: { p256dh: data.p256dh, auth: data.auth },
      };

      const medList = data.meds.join('\n• ');
      const payload = JSON.stringify({
        title: '💊 Hora de tus medicamentos',
        body: `• ${medList}`,
        tag: `meds-${argHour}`,
        url: '/',
      });

      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err: any) {
        console.error(`Push failed for ${endpoint.substring(0, 50)}:`, err.statusCode || err.message);
        failed++;

        // Clean up expired subscriptions (410 Gone)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
          console.log('Removed expired subscription');
        }
      }
    }

    await sql.end();

    return NextResponse.json({
      success: true,
      hour: argHour,
      slots: matchingSlots,
      sent,
      failed,
    });
  } catch (err: any) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
