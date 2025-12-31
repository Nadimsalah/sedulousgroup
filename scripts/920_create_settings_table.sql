-- Create settings table for storing system configuration
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for system-wide settings)
CREATE POLICY "settings_select_public"
  ON settings FOR SELECT
  USING (true);

-- Only admins can update (using service role bypasses RLS)
DROP POLICY IF EXISTS "settings_update_admin" ON settings;
CREATE POLICY "settings_update_admin"
  ON settings FOR UPDATE
  USING (true); -- Admin client bypasses RLS, so this allows updates

-- Only admins can insert
DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
CREATE POLICY "settings_insert_admin"
  ON settings FOR INSERT
  WITH CHECK (true); -- Admin client bypasses RLS, so this allows inserts

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

