-- ============================================
-- QUICK SETUP: Create Settings Tables
-- Copy and paste this entire script into Supabase SQL Editor
-- ============================================

-- 1. Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL DEFAULT 'Sedulous Group LTD',
  company_address TEXT NOT NULL DEFAULT '200 Burnt Oak Broadway, Edgware, HA8 0AP, United Kingdom',
  company_phone TEXT NOT NULL DEFAULT '020 8952 6908',
  company_email TEXT NOT NULL DEFAULT 'info@sedulousgroupltd.co.uk',
  logo_url TEXT DEFAULT '/sed.jpg',
  vat_number TEXT,
  company_number TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO company_settings (id) 
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for company_settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Policies for company_settings
DROP POLICY IF EXISTS "company_settings_select_public" ON company_settings;
CREATE POLICY "company_settings_select_public"
  ON company_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "company_settings_update_admin" ON company_settings;
CREATE POLICY "company_settings_update_admin"
  ON company_settings FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "company_settings_insert_admin" ON company_settings;
CREATE POLICY "company_settings_insert_admin"
  ON company_settings FOR INSERT
  WITH CHECK (true);

-- 2. Create settings table (for booking, payment, general settings)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies for settings
DROP POLICY IF EXISTS "settings_select_public" ON settings;
CREATE POLICY "settings_select_public"
  ON settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "settings_update_admin" ON settings;
CREATE POLICY "settings_update_admin"
  ON settings FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
CREATE POLICY "settings_insert_admin"
  ON settings FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================
-- Done! Both tables are now created.
-- You can now use all Settings pages.
-- ============================================

