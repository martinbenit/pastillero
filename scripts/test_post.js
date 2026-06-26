const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vwvqrzhpzpetsdrkslse.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3dnFyemhwenBldHNkcmtzbHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzA4NjgsImV4cCI6MjA5NzkwNjg2OH0.lEbzDj757OkCpO4sC-4OHoFOwGHIvq27JN8sUy1fddQ');

async function test() {
  const { data, error } = await supabase.from('patients').insert([{ user_id: '123e4567-e89b-12d3-a456-426614174000' }]);
  console.log('Error:', error);
}

test();
