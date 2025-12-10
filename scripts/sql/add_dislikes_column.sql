-- Add dislikes column to comments table
ALTER TABLE comments ADD COLUMN dislikes INTEGER DEFAULT 0;

-- Update existing comments to have 0 dislikes
UPDATE comments SET dislikes = 0 WHERE dislikes IS NULL;
