require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey || !anonKey) {
  console.warn("Warning: SUPABASE_URL, SUPABASE_SERVICE_KEY, or SUPABASE_ANON_KEY is missing from environment variables.");
}

// Admin client — use for DB queries, user management, profile operations
const supabase = createClient(supabaseUrl || '', serviceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Auth client — use ONLY for email auth flows (forgot-password, OAuth redirects)
// Must use anon key so Supabase can send emails properly
const supabaseAuth = createClient(supabaseUrl || '', anonKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
module.exports.supabaseAuth = supabaseAuth;
