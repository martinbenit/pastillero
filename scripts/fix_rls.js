const https = require('https');

const data = JSON.stringify({
  secret: 'antigravity_secret_123',
  sqlQuery: 'CREATE POLICY "Allow individual insert" ON patients FOR INSERT WITH CHECK (auth.uid() = user_id);'
});

const options = {
  hostname: 'pastilleros.vercel.app',
  port: 443,
  path: '/api/setup-db',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => {
    body += d;
  });
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
