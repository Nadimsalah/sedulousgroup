-- Add admin policy to allow admins to access all bookings
-- This policy checks if the user's email ends with @admin.com or @sedulousgroupltd.co.uk

-- First, enable RLS if not already enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create admin policy for SELECT
CREATE POLICY IF NOT EXISTS "admins_select_all_bookings"
ON public.bookings
FOR SELECT
USING (
  auth.jwt() ->> 'email' LIKE '%@admin.com' OR
  auth.jwt() ->> 'email' LIKE '%@sedulousgroupltd.co.uk' OR
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email LIKE '%@admin.com' OR email LIKE '%@sedulousgroupltd.co.uk'
  )
);

-- Create admin policy for UPDATE
CREATE POLICY IF NOT EXISTS "admins_update_all_bookings"
ON public.bookings
FOR UPDATE
USING (
  auth.jwt() ->> 'email' LIKE '%@admin.com' OR
  auth.jwt() ->> 'email' LIKE '%@sedulousgroupltd.co.uk' OR
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email LIKE '%@admin.com' OR email LIKE '%@sedulousgroupltd.co.uk'
  )
);

-- Create admin policy for INSERT
CREATE POLICY IF NOT EXISTS "admins_insert_all_bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'email' LIKE '%@admin.com' OR
  auth.jwt() ->> 'email' LIKE '%@sedulousgroupltd.co.uk' OR
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email LIKE '%@admin.com' OR email LIKE '%@sedulousgroupltd.co.uk'
  )
);

-- Create admin policy for DELETE  
CREATE POLICY IF NOT EXISTS "admins_delete_all_bookings"
ON public.bookings
FOR DELETE
USING (
  auth.jwt() ->> 'email' LIKE '%@admin.com' OR
  auth.jwt() ->> 'email' LIKE '%@sedulousgroupltd.co.uk' OR
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email LIKE '%@admin.com' OR email LIKE '%@sedulousgroupltd.co.uk'
  )
);
