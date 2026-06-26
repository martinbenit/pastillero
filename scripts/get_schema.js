const postgres = require('postgres');
const sql = postgres('postgresql://postgres.vwvqrzhpzpetsdrkslse:GjESmkGBZP4h8DkL@aws-0-sa-east-1.pooler.supabase.com:6543/postgres', { ssl: 'require' });

async function run() {
  try {
    const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'patients'`;
    console.log(res);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
run();
