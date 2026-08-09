const supabase = require('./config/supabase');

async function run() {
  const { data, error } = await supabase.rpc('enable_extension', { name: 'vector' });
  console.log("Enabled pgvector:", data, error);
}
run();
