-- Fix RLS policies to allow customers to view their agreements and inspections

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "customers_view_own_agreements" ON public.agreements;
DROP POLICY IF EXISTS "customers_view_own_inspections" ON public.vehicle_inspections;

-- Create policy for customers to view their own agreements
CREATE POLICY "customers_view_own_agreements"
ON public.agreements
FOR SELECT
USING (
  -- Check if the user owns the booking associated with this agreement
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Create policy for customers to view their own inspections
CREATE POLICY "customers_view_own_inspections"
ON public.vehicle_inspections
FOR SELECT
USING (
  -- Check if the user owns the booking associated with this inspection
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Also ensure existing policies allow proper access
-- Update admins policies to ensure they can still access everything
DROP POLICY IF EXISTS "admins_manage_agreements" ON public.agreements;
DROP POLICY IF EXISTS "admins_manage_inspections" ON public.vehicle_inspections;

CREATE POLICY "admins_manage_agreements"
ON public.agreements
FOR ALL
USING (
  auth.jwt() ->> 'email' LIKE '%@admin.com' OR
  auth.jwt() ->> 'email' LIKE '%@sedulousgroupltd.co.uk'
);

CREATE POLICY "admins_manage_inspections"
ON public.vehicle_inspections
FOR ALL
USING (
  auth.jwt() ->> 'email' LIKE '%@admin.com' OR
  auth.jwt() ->> 'email' LIKE '%@sedulousgroupltd.co.uk'
);
