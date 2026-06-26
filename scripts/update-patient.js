const postgres = require('postgres');
const connectionString = 'postgresql://postgres.vwvqrzhpzpetsdrkslse:GjESmkGBZP4h8DkL@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';
const sql = postgres(connectionString, { ssl: 'require' });

async function main() {
  try {
    const res = await sql`
      UPDATE patients 
      SET user_id = '4483ae77-568c-47a3-8616-8600ed00b9b9', email = 'betubela1946@gmail.com' 
      WHERE name = 'Héctor Raúl Maderna'
      RETURNING *;
    `;
    console.log('Updated patient:', res);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}
main();
