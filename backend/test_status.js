const supabase = require('./config/supabase');
async function check() {
  const statuses = [
    'Accept', 'accept', 'ACCEPT',
  ];

  for (const st of statuses) {
    let { error } = await supabase.from('university_requests').update({status: st}).eq('id', 'd15d8da0-1b7f-4b01-92e2-904903648337');
    if (!error) {
      console.log(`SUCCESS: ${st}`);
    } else {
      console.log(`Failed: ${st} - ${error.message}`);
    }
  }
}
check();
