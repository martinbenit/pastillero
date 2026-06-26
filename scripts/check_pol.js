const postgres = require('postgres');
const fs = require('fs');
const envStr = fs.readFileSync('.env', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});
const sql = postgres(env.DATABASE_URL, { ssl: 'require' });
async function run() {
  const policies = await sql.unsafe("SELECT * FROM pg_policies WHERE tablename = 'push_subscriptions'");
  console.log(policies);
  await sql.end();
}
run();
