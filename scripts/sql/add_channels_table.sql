-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  thumbnail TEXT,
  banner TEXT,
  subscriber_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant access to authenticated users
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Create policies for channels
DROP POLICY IF EXISTS "Anyone can view channels" ON channels;
CREATE POLICY "Anyone can view channels" ON channels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert channels" ON channels;
CREATE POLICY "Anyone can insert channels" ON channels FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update channels" ON channels;
CREATE POLICY "Anyone can update channels" ON channels FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete channels" ON channels;
CREATE POLICY "Anyone can delete channels" ON channels FOR DELETE USING (true);

