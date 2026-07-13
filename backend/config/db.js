const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://fnspjghibqohshfulnah.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_nFgYIjMr4IZIhtUODt8vVw_Lwtx1yoj';

const supabase = createClient(supabaseUrl, supabaseKey);

const connectDB = async () => {
  // Supabase uses a REST API under the hood, so there isn't a persistent 
  // connection to "authenticate" in the same way Sequelize does.
  // We can just log that it's initialized.
  console.log('Supabase Client Initialized.');
};

module.exports = { supabase, connectDB };