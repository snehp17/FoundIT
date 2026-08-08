require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://fnspjghibqohshfulnah.supabase.co';
// We use the service key in the backend to bypass RLS for admin operations and secure data access
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || 'sb_publishable_nFgYIjMr4IZIhtUODt8vVw_Lwtx1yoj'; 

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn("Notice: Using fallback SUPABASE_URL / SUPABASE_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
