-- Create company_settings table for storing company configuration
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL DEFAULT 'Sedulous Group LTD',
  company_address TEXT NOT NULL DEFAULT '200 Burnt Oak Broadway, Edgware, HA8 0AP, United Kingdom',
  company_phone TEXT NOT NULL DEFAULT '020 8952 6908',
  company_email TEXT NOT NULL DEFAULT 'info@sedulousgroupltd.co.uk',
  logo_url TEXT DEFAULT '/images/dna-group-logo.png',
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

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for PDF generation)
CREATE POLICY "company_settings_select_public"
  ON company_settings FOR SELECT
  USING (true);

-- Only admins can update (using service role bypasses RLS)
-- Note: The updateCompanySettings function uses admin client which bypasses RLS
DROP POLICY IF EXISTS "company_settings_update_admin" ON company_settings;
CREATE POLICY "company_settings_update_admin"
  ON company_settings FOR UPDATE
  USING (true); -- Admin client bypasses RLS, so this allows updates

-- Only admins can insert
DROP POLICY IF EXISTS "company_settings_insert_admin" ON company_settings;
CREATE POLICY "company_settings_insert_admin"
  ON company_settings FOR INSERT
  WITH CHECK (true); -- Admin client bypasses RLS, so this allows inserts


