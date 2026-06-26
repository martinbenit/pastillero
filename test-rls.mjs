import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRLS() {
  const { data: meds, error: err1 } = await supabase.from('medications').select('*');
  const { data: subs, error: err2 } = await supabase.from('push_subscriptions').select('*');
  console.log('Medications count:', meds?.length, 'Error:', err1);
  console.log('Subscriptions count:', subs?.length, 'Error:', err2);
}

checkRLS();
