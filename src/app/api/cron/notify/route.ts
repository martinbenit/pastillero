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
  const expectedSecret = process.env.CRON_SECRET || 'pastillero_cron_secret_2026';
  
  if (authHeader !== `Bearer ${expectedSecret}`) {
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

    // Filter by frequency and build notifications map
    const medsByUser = new Map<string, string[]>();

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

        if (userId) {
          if (!medsByUser.has(userId)) medsByUser.set(userId, []);
          medsByUser.get(userId)!.push(`${medName} (${medDose})`);
        }
      }
    }

    console.log(`Sending notifications to ${medsByUser.size} users`);

    // Send push notifications
    let sent = 0;
    let failed = 0;

    for (const [userId, meds] of medsByUser.entries()) {
      // Fetch user's name from auth metadata
      let userName = 'Usuario';
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userData?.user?.user_metadata) {
          const meta = userData.user.user_metadata;
          userName = meta.name || meta.full_name || meta.preferred_username || 'Usuario';
          // If name has multiple words, get the first name
          userName = userName.split(' ')[0];
        }
      } catch (e) {
        console.error('Error fetching user for name:', e);
      }

      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (!subscriptions || subscriptions.length === 0) continue;

      const medList = meds.join(', ');
      const bodyText = `Hola ${userName}!, te recuerdo que tenes que tomar a las ${currentHHMM}, las siguientes pastillas: ${medList}`;

      for (const sub of subscriptions) {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const payload = JSON.stringify({
          title: '💊 Recordatorio de Pastillas',
          body: bodyText,
          tag: `meds-${currentHHMM}`,
          url: '/',
        });

        try {
          await webpush.sendNotification(subscription, payload);
          sent++;
        } catch (err: any) {
          console.error(`Push failed for ${sub.endpoint.substring(0, 50)}:`, err.statusCode || err.message);
          failed++;

          // Clean up expired subscriptions (410 Gone)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            console.log('Removed expired subscription');
          }
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
