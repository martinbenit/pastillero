fetch('https://pastilleros.vercel.app/api/setup-db', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    secret: 'antigravity_secret_123',
    sqlQuery: "UPDATE patients SET user_id = '4483ae77-568c-47a3-8616-8600ed00b9b9', email = 'betubela1946@gmail.com' WHERE name = 'Héctor Raúl Maderna'"
  })
}).then(r => r.text()).then(console.log).catch(console.error);
