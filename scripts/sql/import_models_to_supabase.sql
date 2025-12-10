-- Import existing models from localStorage to Supabase
-- This script adds dummy data to the models table
-- You can modify these models with actual data

-- First, check if models already exist, if so, you can skip this
-- Or you can manually add your models here

INSERT INTO models (name, image) VALUES
('Emma Stone', 'https://via.placeholder.com/200x250/ff6b6b/ffffff?text=Emma'),
('John Doe', 'https://via.placeholder.com/200x250/4ecdc4/ffffff?text=John'),
('Jane Smith', 'https://via.placeholder.com/200x250/45b7d1/ffffff?text=Jane'),
('Mike Johnson', 'https://via.placeholder.com/200x250/96ceb4/ffffff?text=Mike'),
('Sarah Williams', 'https://via.placeholder.com/200x250/ff6b6b/ffffff?text=Sarah')
ON CONFLICT (name) DO NOTHING;

-- Note: This will insert models but if you have specific model names in localStorage,
-- you should replace the above with your actual model data





