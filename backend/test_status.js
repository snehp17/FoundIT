const supabase = require('./config/supabase');
async function check() {
  const { data, error } = await supabase.from('items').select('*').limit(1);
  console.log(data);
}
check();
