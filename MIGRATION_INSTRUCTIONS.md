# Database Migration Instructions

## ⚠️ IMPORTANT: Run These SQL Scripts First

Before using the Settings pages, you need to create the required database tables in your Supabase database.

### Steps to Create the Tables:

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run the SQL scripts below (one at a time or all together)

---

## 1. Company Settings Table

The `company_settings` table stores company information (name, address, phone, email, logo, etc.)

### SQL Script:

```sql
-- Create company_settings table for storing company configuration
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

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for PDF generation)
DROP POLICY IF EXISTS "company_settings_select_public" ON company_settings;
CREATE POLICY "company_settings_select_public"
  ON company_settings FOR SELECT
  USING (true);

-- Only admins can update (using service role bypasses RLS)
DROP POLICY IF EXISTS "company_settings_update_admin" ON company_settings;
CREATE POLICY "company_settings_update_admin"
  ON company_settings FOR UPDATE
  USING (true);

-- Only admins can insert
DROP POLICY IF EXISTS "company_settings_insert_admin" ON company_settings;
CREATE POLICY "company_settings_insert_admin"
  ON company_settings FOR INSERT
  WITH CHECK (true);
```

4. Click **Run** to execute the script
5. The table will be created and you can now save company settings

---

## 2. Settings Table (REQUIRED for Booking, Payment, General Settings)

The `settings` table stores all system configuration settings (booking rules, payment settings, general preferences).

### SQL Script:

```sql
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
DROP POLICY IF EXISTS "settings_select_public" ON settings;
CREATE POLICY "settings_select_public"
  ON settings FOR SELECT
  USING (true);

-- Only admins can update (using service role bypasses RLS)
DROP POLICY IF EXISTS "settings_update_admin" ON settings;
CREATE POLICY "settings_update_admin"
  ON settings FOR UPDATE
  USING (true);

-- Only admins can insert
DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
CREATE POLICY "settings_insert_admin"
  ON settings FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
```

---

## Quick Setup (Run Both Scripts Together)

You can copy and run both scripts together in the Supabase SQL Editor:

```sql
-- ============================================
-- Script 1: Company Settings Table
-- ============================================
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

INSERT INTO company_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_settings_select_public" ON company_settings;
CREATE POLICY "company_settings_select_public" ON company_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "company_settings_update_admin" ON company_settings;
CREATE POLICY "company_settings_update_admin" ON company_settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "company_settings_insert_admin" ON company_settings;
CREATE POLICY "company_settings_insert_admin" ON company_settings FOR INSERT WITH CHECK (true);

-- ============================================
-- Script 2: Settings Table
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_public" ON settings;
CREATE POLICY "settings_select_public" ON settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_update_admin" ON settings;
CREATE POLICY "settings_update_admin" ON settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
CREATE POLICY "settings_insert_admin" ON settings FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
```

---

## After Running the Scripts

Once both tables are created:
- ✅ Company Settings page will work
- ✅ Booking Settings page will work
- ✅ Payment Settings page will work
- ✅ General Settings page will work

All settings will be saved to the database and persist across sessions.

---

## Alternative: Run Migration Files

You can also copy the contents from these files in the `scripts/` folder:
- `scripts/910_create_company_settings.sql` - Company settings table
- `scripts/920_create_settings_table.sql` - Settings table for other settings
