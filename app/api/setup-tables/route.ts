"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET() {
  try {
    const supabase = createAdminSupabase()

    // Create company_settings table
    const companySettingsSQL = `
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
    `

    // Create settings table
    const settingsSQL = `
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
    `

    // Note: Supabase JS client doesn't support executing raw SQL directly
    // This endpoint provides the SQL scripts for manual execution
    return NextResponse.json({
      success: true,
      message: "Use the SQL scripts below in Supabase SQL Editor",
      scripts: {
        company_settings: companySettingsSQL,
        settings: settingsSQL,
        combined: companySettingsSQL + "\n\n" + settingsSQL,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

