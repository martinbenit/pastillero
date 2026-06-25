const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-east-1', 'ap-south-1', 'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'ca-central-1',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-south-1', 'eu-west-3', 'eu-north-1',
  'me-south-1',
  'sa-east-1'
];

async function tryConnectAndExecute(region) {
  const connectionString = `postgresql://postgres.vwvqrzhpzpetsdrkslse:GjESmkGBZP4h8DkL@aws-0-${region}.pooler.supabase.com:6543/postgres`;
  const sql = postgres(connectionString, { ssl: 'require', connect_timeout: 3 });

  try {
    await sql`SELECT 1`;
    console.log(`Connected successfully to region ${region}!`);
    
    const schemaFile = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaFile, 'utf8');

    console.log('Executing schema.sql...');
    await sql.unsafe(schemaSql);
    console.log('Schema executed successfully!');
    return true;
  } catch (error) {
    return false;
  } finally {
    await sql.end();
  }
}

async function main() {
  console.log('Trying to find the correct Supabase region pooler...');
  for (const region of regions) {
    process.stdout.write(`Trying ${region}... `);
    const success = await tryConnectAndExecute(region);
    if (success) {
      console.log('Setup finished successfully.');
      return;
    }
    console.log('Failed.');
  }
  console.error('\nFailed to connect to any pooler region.');
  process.exit(1);
}

main();
