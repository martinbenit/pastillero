const postgres = require('postgres');
const sql = postgres('postgresql://postgres.vwvqrzhpzpetsdrkslse:GjESmkGBZP4h8DkL@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?options=project%3Dvwvqrzhpzpetsdrkslse', { ssl: 'require' });

async function run() {
  try {
    const policies = await sql`SELECT * FROM pg_policies WHERE tablename = 'patients'`;
    console.log('Policies for patients:', policies);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
run();
