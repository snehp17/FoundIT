require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://fnspjghibqohshfulnah.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || 'sb_publishable_nFgYIjMr4IZIhtUODt8vVw_Lwtx1yoj';
const anonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_nFgYIjMr4IZIhtUODt8vVw_Lwtx1yoj';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn("Notice: SUPABASE_URL or SUPABASE_SERVICE_KEY not set in process.env, using default publishable key fallback.");
}

// Admin client — use for DB queries, user management, profile operations
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Auth client — use for email auth flows (forgot-password, OAuth redirects)
const supabaseAuth = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
module.exports.supabaseAuth = supabaseAuth;
