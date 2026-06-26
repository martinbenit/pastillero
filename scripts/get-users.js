const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vwvqrzhpzpetsdrkslse.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'TU_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(data.users.map(u => ({ id: u.id, email: u.email })));
  }
}

getUsers();
