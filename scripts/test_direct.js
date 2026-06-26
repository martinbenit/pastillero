const postgres = require('postgres');
const url = 'postgresql://postgres:GjESmkGBZP4h8DkL@db.vwvqrzhpzpetsdrkslse.supabase.co:5432/postgres';
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
