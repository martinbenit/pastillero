import postgres from 'postgres';

const regions = [
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1'
];

async function tryRegion(region) {
  const connectionString = `postgresql://postgres.vwvqrzhpzpetsdrkslse:GjESmkGBZP4h8DkL@aws-0-${region}.pooler.supabase.com:6543/postgres`;
  const sql = postgres(connectionString, { ssl: 'require', connect_timeout: 5 });
  try {
    await sql`SELECT 1`;
    console.log(`\n\nSUCCESS! Region is ${region}\n\n`);
    
    // Create the table since we found the working connection
    console.log('Creating table...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(endpoint)
      );
    `);
    console.log('Table created.');
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.log(`Region ${region} failed: ${err.message}`);
    await sql.end().catch(() => {});
  }
}

async function main() {
  for (const region of regions) {
    await tryRegion(region);
  }
}

main();
