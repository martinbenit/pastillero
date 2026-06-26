const fetch = require('node-fetch');

const sql = `
CREATE POLICY "Public Read Access Patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Public Read Access Medications" ON public.medications FOR SELECT USING (true);
CREATE POLICY "Public Read Access Schedules" ON public.schedules FOR SELECT USING (true);
`;

async function executeSql() {
  console.log('Sending SQL to Vercel API...');
  const res = await fetch('https://pastillero.vercel.app/api/setup-db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: 'antigravity_secret_123',
      sqlQuery: sql
    })
  });
  
  const data = await res.json();
  console.log('Response:', data);
}

executeSql();
