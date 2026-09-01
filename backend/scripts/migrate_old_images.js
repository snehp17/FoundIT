require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateImages() {
  console.log("Starting migration of old images to Supabase...");
  
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log("No uploads directory found. Nothing to migrate.");
    return;
  }

  const files = fs.readdirSync(uploadsDir);
  
  if (files.length === 0) {
    console.log("No files in uploads directory.");
    return;
  }

  console.log(`Found ${files.length} files. Uploading to Supabase...`);

  for (const filename of files) {
    // Skip if it's not an image (like .gitkeep)
    if (filename.startsWith('.')) continue;

    const filePath = path.join(uploadsDir, filename);
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine basic mimetype
    const ext = path.extname(filename).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    if (ext === '.webp') mimeType = 'image/webp';
    if (ext === '.gif') mimeType = 'image/gif';

    console.log(`Uploading ${filename}...`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filename, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error(`❌ Failed to upload ${filename}:`, uploadError.message);
      continue;
    }

    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filename);
    const publicUrl = publicUrlData.publicUrl;

    console.log(`✅ Uploaded. URL: ${publicUrl}`);

    // Now update the database: find any items that reference this filename and update them
    // Note: Items table stores images as an array of strings e.g. ["172123-image.jpg"]
    // We will pull all items, check if they contain this filename, and update them.
    const { data: items, error: fetchError } = await supabase
      .from('items')
      .select('id, images')
      .contains('images', [filename]);

    if (fetchError) {
      console.error(`❌ Error fetching items for ${filename}:`, fetchError.message);
      continue;
    }

    if (items && items.length > 0) {
      for (const item of items) {
        // Replace the local filename with the public URL
        const updatedImages = item.images.map(img => img === filename ? publicUrl : img);
        
        const { error: updateError } = await supabase
          .from('items')
          .update({ images: updatedImages })
          .eq('id', item.id);

        if (updateError) {
          console.error(`❌ Error updating DB for item ${item.id}:`, updateError.message);
        } else {
          console.log(`✅ Updated database record for item ${item.id}`);
        }
      }
    }
  }

  console.log("🎉 Migration complete! Old images are now on Supabase.");
}

migrateImages();
