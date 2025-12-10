-- Add 'video' type to notifications table
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('ban', 'message', 'comment', 'like', 'system', 'video'));



