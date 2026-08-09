const supabase = require('./config/supabase');

async function testGet() {
  const req_user_id = '2fba72c8-2302-4d16-aaab-bce55c92b19c'; // Jimit's ID
  const { data, error } = await supabase
      .from('messages')
      .select(`*, sender:profiles!sender_id(name), receiver:profiles!receiver_id(name), item:items(title, status)`)
      .or(`sender_id.eq.${req_user_id},receiver_id.eq.${req_user_id}`)
      .order('created_at', { ascending: true });
      
  console.log("Data:", data);
  console.log("Error:", error);
  process.exit(0);
}

testGet();
