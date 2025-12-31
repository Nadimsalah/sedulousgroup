-- =====================================================
-- CREATE TEST USERS WITH BOOKINGS
-- =====================================================
-- This script creates test data for development

-- Note: You cannot directly insert into auth.users via SQL
-- Users must be created through Supabase Auth (signup form)
-- This script will insert bookings for existing users

-- =====================================================
-- INSERT TEST BOOKINGS FOR NADIM (if user exists)
-- =====================================================
-- First, let's get the user_id for nadim@mail.com
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID after signup

-- Example bookings (update user_id after creating the user):
/*
INSERT INTO public.bookings (
  id,
  user_id,
  customer_name,
  customer_email,
  customer_phone,
  car_id,
  pickup_location,
  dropoff_location,
  pickup_date,
  pickup_time,
  dropoff_date,
  dropoff_time,
  total_amount,
  status,
  booking_type,
  created_at,
  updated_at
) VALUES
(
  'booking-' || gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- Replace with actual user_id
  'Nadim Karim',
  'nadim@mail.com',
  '+44 7878 123456',
  'mercedes-s-class',
  'Heathrow Airport, Terminal 5, Longford TW6 2GA',
  'Mayfair Hotel, Stratton St, London W1J 8LT',
  '2025-11-15',
  '14:00:00',
  '2026-05-15',
  '14:00:00',
  850.00,
  'Completed',
  'Flexi Hire',
  NOW(),
  NOW()
);
*/

-- Instructions:
-- 1. Sign up a user through the app (e.g., nadim@mail.com)
-- 2. Get the user_id from Supabase Dashboard > Authentication > Users
-- 3. Replace 'YOUR_USER_ID_HERE' with the actual UUID
-- 4. Run this script to create test bookings
