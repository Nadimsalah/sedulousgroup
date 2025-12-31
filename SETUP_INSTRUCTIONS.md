# 🔧 Quick Setup: Create Settings Tables in Supabase

## ⚠️ IMPORTANT: You need to run SQL scripts in Supabase to create the tables

The Settings pages require two database tables. Follow these steps:

---

## 📋 Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your project

### 2. Open SQL Editor
- Click **"SQL Editor"** in the left sidebar
- Click **"New query"** button

### 3. Copy and Paste This SQL Script

Copy the **ENTIRE** SQL script below and paste it into the SQL Editor:

```sql
-- ============================================
-- CREATE COMPANY_SETTINGS TABLE
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

INSERT INTO company_settings (id) 
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- CREATE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
```

### 4. Run the Script
- Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
- Wait for the success message: "Success. No rows returned"

### 5. Verify Tables Created
- Go to **"Table Editor"** in Supabase
- You should see two new tables:
  - ✅ `company_settings`
  - ✅ `settings`

---

## ✅ After Setup

Once both tables are created:
- ✅ **Company Settings** page will work
- ✅ **Booking Settings** page will work  
- ✅ **Payment Settings** page will work
- ✅ **General Settings** page will work

All settings will be saved to the database and persist across sessions.

---

## 🆘 Troubleshooting

### Error: "relation already exists"
- This means the table already exists - that's fine! The script uses `CREATE TABLE IF NOT EXISTS` so it's safe to run again.

### Error: "permission denied"
- Make sure you're logged into Supabase as the project owner/admin
- The SQL Editor should have full permissions

### Still having issues?
- Check that you're in the correct Supabase project
- Make sure you copied the ENTIRE SQL script (both table creation sections)
- Try running each table creation separately if needed

---

## 📁 Alternative: Use Migration Files

You can also use the migration files in the `scripts/` folder:
- `scripts/910_create_company_settings.sql` - Company settings table
- `scripts/920_create_settings_table.sql` - Settings table

Just copy their contents into Supabase SQL Editor and run them.

