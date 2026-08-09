const supabase = require('./config/supabase');

async function checkProfiles() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log("Profiles:", data);
  console.log("Error:", error);
  process.exit(0);
}
checkProfiles();
