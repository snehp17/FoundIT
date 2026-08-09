const supabase = require('./config/supabase');

async function check() {
  const { data, error } = await supabase.rpc('get_notifications_schema'); // This won't exist unless defined.
  
  // Actually, I can just insert a blank notification to see what happens
  const { error: err1 } = await supabase.from('notifications').insert([{ user_id: '11111111-1111-1111-1111-111111111111', message: 'test' }]);
  console.log("Insert without type error:", err1);
  
  const { error: err2 } = await supabase.from('notifications').insert([{ user_id: '11111111-1111-1111-1111-111111111111', message: 'test', type: 'match' }]);
  console.log("Insert with type error:", err2);
}
check();
