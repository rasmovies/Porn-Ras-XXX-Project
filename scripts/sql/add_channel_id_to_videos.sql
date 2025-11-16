-- Add channel_id column to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);



