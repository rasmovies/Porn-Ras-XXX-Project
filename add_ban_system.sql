-- Create ban table
CREATE TABLE IF NOT EXISTS ban_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    reason TEXT,
    ban_type VARCHAR(50) NOT NULL CHECK (ban_type IN ('5_days', '10_days', '1_month', '3_months', '6_months', 'lifetime')),
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE ban_users ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow public read" ON ban_users;
CREATE POLICY "Allow public read" ON ban_users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON ban_users;
CREATE POLICY "Allow public insert" ON ban_users
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON ban_users;
CREATE POLICY "Allow public update" ON ban_users
    FOR UPDATE USING (true);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_ban_users_user_id ON ban_users(user_id);

-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned(user_name_param VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM ban_users 
        WHERE user_id = user_name_param 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get ban info
CREATE OR REPLACE FUNCTION get_user_ban_info(user_name_param VARCHAR(255))
RETURNS TABLE (
    ban_type VARCHAR(50),
    expires_at TIMESTAMP WITH TIME ZONE,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bu.ban_type,
        bu.expires_at,
        bu.reason
    FROM ban_users bu
    WHERE bu.user_id = user_name_param 
    AND bu.is_active = true 
    AND (bu.expires_at IS NULL OR bu.expires_at > NOW())
    ORDER BY bu.banned_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
