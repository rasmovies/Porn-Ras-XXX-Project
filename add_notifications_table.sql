-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ban', 'message', 'comment', 'like', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow public read" ON notifications;
CREATE POLICY "Allow public read" ON notifications
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON notifications;
CREATE POLICY "Allow public insert" ON notifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON notifications;
CREATE POLICY "Allow public update" ON notifications
    FOR UPDATE USING (true);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);




