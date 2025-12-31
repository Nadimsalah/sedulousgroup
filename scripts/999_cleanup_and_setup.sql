-- =====================================================
-- FINAL CLEANUP AND SETUP SCRIPT
-- Run this script ONLY to set up the entire environment
-- =====================================================

-- 1. Ensure bookings table has all required columns
DO $$ 
BEGIN
  -- Add user_id for auth
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'user_id') THEN
    ALTER TABLE public.bookings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add verification columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'pickup_verified_at') THEN
    ALTER TABLE bookings ADD COLUMN pickup_verified_at timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'verification_photos') THEN
    ALTER TABLE bookings ADD COLUMN verification_photos jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'verified_by') THEN
    ALTER TABLE bookings ADD COLUMN verified_by text;
  END IF;
END $$;

-- 2. Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 3. Clean up ALL old policies to prevent conflicts
DROP POLICY IF EXISTS "bookings_select_by_email" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_public_by_email" ON public.bookings;
DROP POLICY IF EXISTS "users_select_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "users_insert_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "users_update_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "users_delete_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "admin_full_access" ON public.bookings;

-- 4. Create FRESH, correct policies using auth.uid()
CREATE POLICY "users_select_own_bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Setup User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Profile Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.user_profiles;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.user_profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.user_profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.user_profiles FOR UPDATE
  USING ( auth.uid() = id );

-- 7. Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, phone, username)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'phone',
    new.email
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
