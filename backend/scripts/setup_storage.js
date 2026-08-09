require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log("Setting up Supabase Storage...");
  
  // Create bucket
  const { data, error } = await supabase.storage.createBucket('uploads', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
    fileSizeLimit: 5242880 // 5MB
  });

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
      console.log("✅ Bucket 'uploads' already exists.");
    } else {
      console.error("❌ Error creating bucket:", error.message);
    }
  } else {
    console.log("✅ Bucket 'uploads' created successfully.");
  }
}

setupStorage();
