-- Add additional fields for Flexi Hire bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ni_number TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bank_statement_url TEXT;

-- Add additional fields to user_profiles for future bookings
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ni_number TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bank_statement_url TEXT;

-- Add comments for clarity
COMMENT ON COLUMN bookings.ni_number IS 'National Insurance number (required for Flexi Hire)';
COMMENT ON COLUMN bookings.bank_statement_url IS 'Bank statement URL for proof of affordability (required for Flexi Hire, max 3 months old)';
COMMENT ON COLUMN user_profiles.ni_number IS 'National Insurance number saved for future bookings';
COMMENT ON COLUMN user_profiles.bank_statement_url IS 'Bank statement URL saved for future bookings';
