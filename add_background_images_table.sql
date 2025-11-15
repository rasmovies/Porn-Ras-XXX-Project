-- Create background_images table for storing library images
CREATE TABLE IF NOT EXISTS background_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  image_data TEXT NOT NULL, -- base64 encoded image
  file_size INTEGER NOT NULL, -- in bytes
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on background_images table
ALTER TABLE background_images ENABLE ROW LEVEL SECURITY;

-- Create policies for background_images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'background_images' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON background_images FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'background_images' AND policyname = 'Allow authenticated users to insert') THEN
    CREATE POLICY "Allow authenticated users to insert" ON background_images FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'background_images' AND policyname = 'Allow authenticated users to update') THEN
    CREATE POLICY "Allow authenticated users to update" ON background_images FOR UPDATE USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'background_images' AND policyname = 'Allow authenticated users to delete') THEN
    CREATE POLICY "Allow authenticated users to delete" ON background_images FOR DELETE USING (true);
  END IF;
END $$;

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_background_images_created_at ON background_images(created_at DESC);



