-- Add rental_type column to cars table
ALTER TABLE cars ADD COLUMN IF NOT EXISTS rental_type TEXT DEFAULT 'Rent';

-- Update existing cars to have 'Rent' as rental_type
UPDATE cars SET rental_type = 'Rent' WHERE rental_type IS NULL;
