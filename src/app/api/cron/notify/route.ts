import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// VAPID configuration
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = 'mailto:pastillero@pastilleros.vercel.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current time in Argentina timezone (UTC-3)
    const now = new Date();
    const today = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    const dayOfWeek = today.getDay(); // 0=Sunday
    
    const argHourStr = today.getHours().toString().padStart(2, '0');
    const argMinuteStr = today.getMinutes().toString().padStart(2, '0');
    const currentHHMM = `${argHourStr}:${argMinuteStr}`;

    console.log(`Cron running at Argentina time: ${currentHHMM}, day: ${dayOfWeek}`);

    // Query 1: Get schedules, medications, and patients that match the current HH:MM
    const { data: schedulesData, error: schedulesError } = await supabaseAdmin
      .from('schedules')
      .select(`
        time_slot,
        frequency,
        specific_days,
        start_date,
        medications (
          name,
          dose,
          patients (
            user_id
          )
        )
      `)
      .ilike('time_slot', `${currentHHMM}%`);

    if (schedulesError) throw schedulesError;
    if (!schedulesData || schedulesData.length === 0) {
      return NextResponse.json({ message: `No schedules found for time ${currentHHMM}` });
    }

    // Collect user_ids to fetch push subscriptions
    const userIds = new Set<string>();
    schedulesData.forEach((s: any) => {
      const userId = s.medications?.patients?.user_id;
      if (userId) userIds.add(userId);
    });

    if (userIds.size === 0) {
      return NextResponse.json({ message: 'No users to notify' });
    }

    // Query 2: Get push subscriptions
    const { data: subsData, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .in('user_id', Array.from(userIds));

    if (subsError) throw subsError;

    // Create a map of user_id -> push subscriptions
    const userSubsMap = new Map<string, any[]>();
    (subsData || []).forEach(sub => {
      if (!userSubsMap.has(sub.user_id)) {
        userSubsMap.set(sub.user_id, []);
      }
      userSubsMap.get(sub.user_id)!.push(sub);
    });

    // Filter by frequency and build notifications map
    const toNotify: Map<string, { endpoint: string; p256dh: string; auth: string; meds: string[] }> = new Map();

    for (const row of schedulesData) {
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
        const userId = (row as any).medications?.patients?.user_id;
        const medName = (row as any).medications?.name;
        const medDose = (row as any).medications?.dose;

        if (userId && userSubsMap.has(userId)) {
          const userSubs = userSubsMap.get(userId)!;
          for (const sub of userSubs) {
            const key = sub.endpoint;
            if (!toNotify.has(key)) {
              toNotify.set(key, { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, meds: [] });
            }
            toNotify.get(key)!.meds.push(`${medName} (${medDose})`);
          }
        }
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
        tag: `meds-${currentHHMM}`,
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
          await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint);
          console.log('Removed expired subscription');
        }
      }
    }

    return NextResponse.json({
      success: true,
      time: currentHHMM,
      sent,
      failed,
    });
  } catch (err: any) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
