-- Add click_count column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Create index on click_count for faster sorting
CREATE INDEX IF NOT EXISTS idx_categories_click_count ON categories(click_count DESC);

-- Update existing categories to have click_count = 0 if NULL
UPDATE categories SET click_count = 0 WHERE click_count IS NULL;



