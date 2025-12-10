-- Check if channels table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'channels'
ORDER BY ordinal_position;

-- Check channels data
SELECT * FROM channels LIMIT 10;




