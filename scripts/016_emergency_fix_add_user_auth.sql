-- EMERGENCY FIX: Add user_id column to bookings table and enable proper RLS
-- This ensures each user can ONLY see their own bookings

-- Step 1: Add user_id column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);

-- Step 3: Drop old public policies (these were allowing data leaks)
DROP POLICY IF EXISTS "bookings_insert_public" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_admin" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_admin" ON public.bookings;
DROP POLICY IF EXISTS "bookings_delete_admin" ON public.bookings;

-- Step 4: Create secure RLS policies - Users can ONLY see/modify their own bookings
CREATE POLICY "users_select_own_bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_bookings"
  ON public.bookings FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Admin policies (for service role only)
CREATE POLICY "admin_full_access"
  ON public.bookings
  USING (auth.role() = 'service_role');

-- Step 6: Enable RLS if not already enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.bookings.user_id IS 'Links booking to authenticated user - REQUIRED for RLS security';
