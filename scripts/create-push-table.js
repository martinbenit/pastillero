const postgres = require('postgres');
const sql = postgres('postgresql://postgres:GjESmkGBZP4h8DkL@db.vwvqrzhpzpetsdrkslse.supabase.co:5432/postgres', { ssl: 'require' });

async function setup() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Table created');

  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);`);
  console.log('Index created');

  await sql.unsafe(`ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;`);
  console.log('RLS enabled');

  await sql.unsafe(`DROP POLICY IF EXISTS push_subscriptions_select ON push_subscriptions;`);
  await sql.unsafe(`CREATE POLICY push_subscriptions_select ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);`);

  await sql.unsafe(`DROP POLICY IF EXISTS push_subscriptions_insert ON push_subscriptions;`);
  await sql.unsafe(`CREATE POLICY push_subscriptions_insert ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);`);

  await sql.unsafe(`DROP POLICY IF EXISTS push_subscriptions_update ON push_subscriptions;`);
  await sql.unsafe(`CREATE POLICY push_subscriptions_update ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);`);

  await sql.unsafe(`DROP POLICY IF EXISTS push_subscriptions_delete ON push_subscriptions;`);
  await sql.unsafe(`CREATE POLICY push_subscriptions_delete ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);`);

  console.log('All RLS policies created');
  await sql.end();
}

setup().catch(e => { console.error(e); process.exit(1); });
