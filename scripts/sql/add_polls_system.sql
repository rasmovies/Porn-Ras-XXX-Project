-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'best_model', 'best_video', 'content_preference', 'satisfaction'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_options table
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text VARCHAR(255) NOT NULL,
  option_value VARCHAR(255), -- For model_id, video_id, etc.
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_responses table
CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_ip VARCHAR(45), -- For anonymous tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_name) -- One vote per user per poll
);

-- Enable RLS on polls tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for polls
DO $$ 
BEGIN
  -- Polls policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'polls' AND policyname = 'Allow public read active polls') THEN
    CREATE POLICY "Allow public read active polls" ON polls FOR SELECT USING (is_active = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'polls' AND policyname = 'Allow public read all polls') THEN
    CREATE POLICY "Allow public read all polls" ON polls FOR SELECT USING (true);
  END IF;
  
  -- Allow public insert/update/delete for polls (admin operations)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'polls' AND policyname = 'Allow public insert polls') THEN
    CREATE POLICY "Allow public insert polls" ON polls FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'polls' AND policyname = 'Allow public update polls') THEN
    CREATE POLICY "Allow public update polls" ON polls FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'polls' AND policyname = 'Allow public delete polls') THEN
    CREATE POLICY "Allow public delete polls" ON polls FOR DELETE USING (true);
  END IF;
  
  -- Poll options policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'poll_options' AND policyname = 'Allow public read poll options') THEN
    CREATE POLICY "Allow public read poll options" ON poll_options FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'poll_options' AND policyname = 'Allow public insert poll options') THEN
    CREATE POLICY "Allow public insert poll options" ON poll_options FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'poll_options' AND policyname = 'Allow public update poll options') THEN
    CREATE POLICY "Allow public update poll options" ON poll_options FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'poll_options' AND policyname = 'Allow public delete poll options') THEN
    CREATE POLICY "Allow public delete poll options" ON poll_options FOR DELETE USING (true);
  END IF;
  
  -- Poll responses policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'poll_responses' AND policyname = 'Allow public insert responses') THEN
    CREATE POLICY "Allow public insert responses" ON poll_responses FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'poll_responses' AND policyname = 'Allow public read responses') THEN
    CREATE POLICY "Allow public read responses" ON poll_responses FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'poll_responses' AND policyname = 'Allow public update responses') THEN
    CREATE POLICY "Allow public update responses" ON poll_responses FOR UPDATE USING (true);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_type ON polls(type);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_user_name ON poll_responses(user_name);
CREATE INDEX IF NOT EXISTS idx_poll_responses_option_id ON poll_responses(option_id);

