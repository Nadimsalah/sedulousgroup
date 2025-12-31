-- Add booking_type column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'Rent';

-- Add constraint to only allow valid booking types
ALTER TABLE bookings ADD CONSTRAINT booking_type_check 
CHECK (booking_type IN ('Rent', 'Flexi Hire', 'PCO Hire', 'Sales'));

-- Update existing bookings to have a default type
UPDATE bookings SET booking_type = 'Rent' WHERE booking_type IS NULL;
