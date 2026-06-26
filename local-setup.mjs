import postgres from 'postgres';

const connectionString = 'postgresql://postgres:GjESmkGBZP4h8DkL@db.vwvqrzhpzpetsdrkslse.supabase.co:5432/postgres';

const sql = postgres(connectionString, { ssl: 'require' });

async function main() {
  console.log('Executing query...');
  try {
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
    console.log('Query executed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

main();
