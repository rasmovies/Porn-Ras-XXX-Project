-- Fix user_gifs table to make gif_url nullable
ALTER TABLE user_gifs ALTER COLUMN gif_url DROP NOT NULL;

-- Drop ALL existing policies (including the correct one if it exists)
DROP POLICY IF EXISTS "Allow public read approved" ON user_gifs;
DROP POLICY IF EXISTS "Allow public read access" ON user_gifs;
DROP POLICY IF EXISTS "Allow public insert" ON user_gifs;
DROP POLICY IF EXISTS "Allow admin update" ON user_gifs;
DROP POLICY IF EXISTS "Allow admin delete" ON user_gifs;
DROP POLICY IF EXISTS "Allow public update" ON user_gifs;
DROP POLICY IF EXISTS "Allow public delete" ON user_gifs;

-- Recreate correct policies
CREATE POLICY "Allow public read access" ON user_gifs FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON user_gifs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON user_gifs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON user_gifs FOR DELETE USING (true);

