-- Add rental_type column to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS rental_type TEXT DEFAULT 'Rent';

-- Update existing stories to have 'Rent' as default
UPDATE stories 
SET rental_type = 'Rent' 
WHERE rental_type IS NULL;

-- Add comment
COMMENT ON COLUMN stories.rental_type IS 'Type of rental: Rent, Flexi Hire, PCO Hire, or Sales';
