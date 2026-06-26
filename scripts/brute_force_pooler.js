const postgres = require('postgres');

const regions = [
  'aws-0-us-east-1',
  'aws-0-us-west-1',
  'aws-0-eu-central-1',
  'aws-0-eu-west-1',
  'aws-0-eu-west-2',
  'aws-0-ap-southeast-1',
  'aws-0-ap-northeast-1',
  'aws-0-sa-east-1',
  'aws-0-ca-central-1',
  'aws-0-ap-south-1'
];

async function tryConnect(region) {
  return new Promise((resolve) => {
    const sql = postgres(`postgresql://postgres.vwvqrzhpzpetsdrkslse:GjESmkGBZP4h8DkL@${region}.pooler.supabase.com:6543/postgres`, {
      ssl: 'require',
      connect_timeout: 5
    });
    sql`SELECT 1`.then(() => {
      console.log(`SUCCESS: ${region}`);
      resolve(sql);
    }).catch(err => {
      resolve(null);
    });
  });
}

async function run() {
  for (const region of regions) {
    console.log(`Trying ${region}...`);
    const sql = await tryConnect(region);
    if (sql) {
      console.log('Connected! Creating policy...');
      try {
        await sql`CREATE POLICY "Allow individual insert" ON patients FOR INSERT WITH CHECK (auth.uid() = user_id);`;
        console.log('Policy created successfully!');
      } catch (err) {
        console.log('Error creating policy:', err.message);
      }
      sql.end();
      return;
    }
  }
  console.log('Failed to connect to any region.');
}
run();
