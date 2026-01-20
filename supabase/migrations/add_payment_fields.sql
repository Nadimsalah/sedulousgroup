-- Add payment-related fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session 
ON bookings(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status 
ON bookings(payment_status);

-- Add comment for documentation
COMMENT ON COLUMN bookings.payment_status IS 'Payment status: pending, paid, failed, refunded';
COMMENT ON COLUMN bookings.stripe_session_id IS 'Stripe checkout session ID';
COMMENT ON COLUMN bookings.stripe_payment_intent IS 'Stripe payment intent ID';
