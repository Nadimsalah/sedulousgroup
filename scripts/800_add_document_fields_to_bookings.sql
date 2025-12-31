-- Add document upload fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS driving_license_front_url text,
ADD COLUMN IF NOT EXISTS driving_license_back_url text,
ADD COLUMN IF NOT EXISTS proof_of_address_url text,
ADD COLUMN IF NOT EXISTS driving_license_number text,
ADD COLUMN IF NOT EXISTS documents_submitted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- Add comment for clarity
COMMENT ON COLUMN public.bookings.driving_license_front_url IS 'URL to uploaded front of driving license';
COMMENT ON COLUMN public.bookings.driving_license_back_url IS 'URL to uploaded back of driving license';
COMMENT ON COLUMN public.bookings.proof_of_address_url IS 'URL to uploaded proof of address document';
COMMENT ON COLUMN public.bookings.driving_license_number IS 'Customer driving license number';
COMMENT ON COLUMN public.bookings.documents_submitted_at IS 'Timestamp when customer submitted documents';
COMMENT ON COLUMN public.bookings.stripe_payment_intent_id IS 'Stripe payment intent ID for tracking';
COMMENT ON COLUMN public.bookings.stripe_session_id IS 'Stripe checkout session ID';
