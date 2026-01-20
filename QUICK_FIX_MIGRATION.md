# Quick Fix: Apply Database Migration

## The Error
You're seeing "Failed to create booking" because the database is missing the new payment fields.

## Solution: Apply Migration in 2 Minutes

### Step 1: Copy the SQL
Copy this entire SQL code:

```sql
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
```

### Step 2: Run in Supabase
1. Go to https://supabase.com/dashboard
2. Select your project: **rethvzigzoqxuedihdiu**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste the SQL code above
6. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify
You should see a success message. The migration adds:
- `stripe_session_id` column
- `stripe_payment_intent` column  
- `payment_status` column (default: 'pending')
- Two indexes for performance

### Step 4: Test Again
1. Refresh your checkout page
2. Fill in personal info
3. Click "Continue to Payment"
4. Should now work! ✅

---

## Alternative: Use Supabase CLI (if installed)

```bash
cd /home/micro/Downloads/v01/sedulousgroup-net\(1\)
supabase db push
```

---

## What This Does

The migration adds three new columns to your `bookings` table:
- **stripe_session_id**: Stores Stripe checkout session ID
- **stripe_payment_intent**: Stores Stripe payment intent ID
- **payment_status**: Tracks payment status (pending/paid/failed/refunded)

These fields are required for the payment-before-documents flow to work.

---

## After Migration

Once applied, the checkout will:
1. ✅ Create booking with `payment_status: 'pending'`
2. ✅ Generate Stripe payment session
3. ✅ Show payment form
4. ✅ Update to `payment_status: 'paid'` after successful payment
5. ✅ Allow document upload

---

## Need Help?

If you encounter any errors:
1. Check the error message in Supabase SQL Editor
2. Verify you're connected to the correct project
3. Make sure you have permission to alter tables
4. Try running each ALTER TABLE statement separately
