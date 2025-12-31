"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

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

export interface CompanySettings {
  id: string
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  logo_url: string
  vat_number?: string
  company_number?: string
  description?: string
}

export async function getCompanySettings(): Promise<CompanySettings | null> {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .eq("id", "default")
      .single()

    if (error) {
      console.error("[v0] Error fetching company settings:", error)
      // Return default settings if table doesn't exist yet
      return {
        id: "default",
        company_name: "Sedulous Group LTD",
        company_address: "200 Burnt Oak Broadway, Edgware, HA8 0AP, United Kingdom",
        company_phone: "020 8952 6908",
        company_email: "info@sedulousgroupltd.co.uk",
        logo_url: "/sed.jpg",
      }
    }

    return data
  } catch (error) {
    console.error("[v0] Error in getCompanySettings:", error)
    // Return default settings on error
    return {
      id: "default",
      company_name: "Sedulous Group LTD",
      company_address: "200 Burnt Oak Broadway, Edgware, HA8 0AP, United Kingdom",
      company_phone: "020 8952 6908",
      company_email: "info@sedulousgroupltd.co.uk",
      logo_url: "/sed.jpg",
    }
  }
}

export async function updateCompanySettings(settings: Partial<CompanySettings>) {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase
      .from("company_settings")
      .upsert(
        {
          id: "default",
          ...settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      )
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating company settings:", error)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error details:", error.details)
      console.error("[v0] Error hint:", error.hint)
      
      // If table doesn't exist, provide helpful error message
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("schema cache")) {
        return {
          success: false,
          error: "Company settings table does not exist. Go to /admin/settings/setup to create the required tables.",
        }
      }
      
      throw new Error(`Failed to update company settings: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in updateCompanySettings:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

