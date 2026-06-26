const postgres = require('postgres');
const url = 'postgresql://postgres.vwvqrzhpzpetsdrkslse:GjESmkGBZP4h8DkL@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';
const sql = postgres(url, { ssl: 'require' });
async function run() {
  try {
    const res = await sql`SELECT 1 as val`;
    console.log('Success:', res);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sql.end();
  }
}
run();
