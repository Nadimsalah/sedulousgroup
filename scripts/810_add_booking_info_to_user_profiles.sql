-- Add booking information fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS driving_license_number TEXT,
ADD COLUMN IF NOT EXISTS driving_license_front_url TEXT,
ADD COLUMN IF NOT EXISTS driving_license_back_url TEXT,
ADD COLUMN IF NOT EXISTS proof_of_address_url TEXT,
ADD COLUMN IF NOT EXISTS documents_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
