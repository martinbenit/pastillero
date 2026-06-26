fetch('https://pastilleros.vercel.app/api/setup-db', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    secret: 'antigravity_secret_123',
    sqlQuery: "UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'betubela1946@gmail.com'"
  })
}).then(r => r.text()).then(console.log).catch(console.error);
