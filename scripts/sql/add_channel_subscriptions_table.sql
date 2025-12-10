-- Create channel_subscriptions table for user-channel subscriptions
CREATE TABLE IF NOT EXISTS channel_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_name, channel_id)
);

-- Enable RLS on channel_subscriptions table
ALTER TABLE channel_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for channel_subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'channel_subscriptions' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON channel_subscriptions FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'channel_subscriptions' AND policyname = 'Allow public insert') THEN
    CREATE POLICY "Allow public insert" ON channel_subscriptions FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'channel_subscriptions' AND policyname = 'Allow public delete') THEN
    CREATE POLICY "Allow public delete" ON channel_subscriptions FOR DELETE USING (true);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_channel_subscriptions_user_name ON channel_subscriptions(user_name);
CREATE INDEX IF NOT EXISTS idx_channel_subscriptions_channel_id ON channel_subscriptions(channel_id);



