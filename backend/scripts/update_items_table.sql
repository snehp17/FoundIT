-- Add missing columns to items table for Brand, Color, and Secret Detail
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS primary_color text,
ADD COLUMN IF NOT EXISTS secret_detail text;

-- Refresh the schema cache if necessary (Supabase usually handles this automatically for the JS client, 
-- but you can reload your backend server to be safe)
