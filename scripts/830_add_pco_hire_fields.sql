-- Add private hire license fields to bookings table for PCO Hire
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS private_hire_license_front_url TEXT,
ADD COLUMN IF NOT EXISTS private_hire_license_back_url TEXT,
ADD COLUMN IF NOT EXISTS ni_number TEXT,
ADD COLUMN IF NOT EXISTS bank_statement_url TEXT;

-- Add same fields to user_profiles for saving customer information
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS private_hire_license_front_url TEXT,
ADD COLUMN IF NOT EXISTS private_hire_license_back_url TEXT,
ADD COLUMN IF NOT EXISTS ni_number TEXT,
ADD COLUMN IF NOT EXISTS bank_statement_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON bookings(booking_type);
