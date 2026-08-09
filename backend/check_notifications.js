const supabase = require('./config/supabase');

async function check() {
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}
check();
