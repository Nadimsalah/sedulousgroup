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

export interface BookingSettings {
  min_booking_days: number
  max_booking_days: number
  advance_booking_days: number
  buffer_hours: number
  auto_approval: boolean
  require_documents: boolean
  require_deposit: boolean
  allow_modification: boolean
  modification_deadline_hours: number
  cancellation_deadline_hours: number
}

export interface PaymentSettings {
  stripe_enabled: boolean
  stripe_public_key?: string
  stripe_secret_key?: string
  currency: string
  tax_rate: number
  deposit_percentage: number
  late_fee_per_day: number
  cancellation_fee: number
}

export interface GeneralSettings {
  site_name: string
  site_url: string
  currency: string
  timezone: string
  date_format: string
  time_format: string
  maintenance_mode: boolean
  registration_enabled: boolean
}

// Booking Settings
export async function getBookingSettings(): Promise<BookingSettings> {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "booking")
      .single()

    if (error || !data) {
      return {
        min_booking_days: 1,
        max_booking_days: 30,
        advance_booking_days: 90,
        buffer_hours: 2,
        auto_approval: false,
        require_documents: true,
        require_deposit: true,
        allow_modification: true,
        modification_deadline_hours: 24,
        cancellation_deadline_hours: 48,
      }
    }

    return data.value as BookingSettings
  } catch (error) {
    console.error("Error fetching booking settings:", error)
    // Return default settings on error
    return {
      min_booking_days: 1,
      max_booking_days: 30,
      advance_booking_days: 90,
      buffer_hours: 2,
      auto_approval: false,
      require_documents: true,
      require_deposit: true,
      allow_modification: true,
      modification_deadline_hours: 24,
      cancellation_deadline_hours: 48,
    }
  }
}

export async function updateBookingSettings(settings: BookingSettings) {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from("settings")
      .upsert(
        {
          key: "booking",
          value: settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "key",
        }
      )
      .select()
      .single()

    if (error) {
      console.error("[Settings] Error updating booking settings:", error)
      console.error("[Settings] Error code:", error.code)
      console.error("[Settings] Error message:", error.message)
      
      // If table doesn't exist, provide helpful error message
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("schema cache")) {
        return {
          success: false,
          error: "Settings table does not exist. Go to /admin/settings/setup to create the required tables.",
        }
      }
      
      throw new Error(`Failed to update booking settings: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error updating booking settings:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Payment Settings
export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "payment")
      .single()

    if (error || !data) {
      // Return default settings if not found
      return {
        stripe_enabled: false,
        currency: "GBP",
        tax_rate: 20,
        deposit_percentage: 20,
        late_fee_per_day: 50,
        cancellation_fee: 25,
      }
    }

    return data.value as PaymentSettings
  } catch (error) {
    console.error("Error fetching payment settings:", error)
    // Return default settings on error
    return {
      stripe_enabled: false,
      currency: "GBP",
      tax_rate: 20,
      deposit_percentage: 20,
      late_fee_per_day: 50,
      cancellation_fee: 25,
    }
  }
}

export async function updatePaymentSettings(settings: PaymentSettings) {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from("settings")
      .upsert(
        {
          key: "payment",
          value: settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "key",
        }
      )
      .select()
      .single()

    if (error) {
      console.error("[Settings] Error updating payment settings:", error)
      console.error("[Settings] Error code:", error.code)
      console.error("[Settings] Error message:", error.message)
      
      // If table doesn't exist, provide helpful error message
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("schema cache")) {
        return {
          success: false,
          error: "Settings table does not exist. Go to /admin/settings/setup to create the required tables.",
        }
      }
      
      throw new Error(`Failed to update payment settings: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error updating payment settings:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// General Settings
export async function getGeneralSettings(): Promise<GeneralSettings> {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "general")
      .single()

    if (error || !data) {
      // Return default settings if not found
      return {
        site_name: "Sedulous Group Ltd",
        site_url: "https://sedulousgroup.net",
        currency: "GBP",
        timezone: "Europe/London",
        date_format: "DD/MM/YYYY",
        time_format: "24h",
        maintenance_mode: false,
        registration_enabled: true,
      }
    }

    return data.value as GeneralSettings
  } catch (error) {
    console.error("Error fetching general settings:", error)
    // Return default settings on error
    return {
      site_name: "Sedulous Group Ltd",
      site_url: "https://sedulousgroup.net",
      currency: "GBP",
      timezone: "Europe/London",
      date_format: "DD/MM/YYYY",
      time_format: "24h",
      maintenance_mode: false,
      registration_enabled: true,
    }
  }
}

export async function updateGeneralSettings(settings: GeneralSettings) {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from("settings")
      .upsert(
        {
          key: "general",
          value: settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "key",
        }
      )
      .select()
      .single()

    if (error) {
      console.error("[Settings] Error updating general settings:", error)
      console.error("[Settings] Error code:", error.code)
      console.error("[Settings] Error message:", error.message)
      
      // If table doesn't exist, provide helpful error message
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("schema cache")) {
        return {
          success: false,
          error: "Settings table does not exist. Go to /admin/settings/setup to create the required tables.",
        }
      }
      
      throw new Error(`Failed to update general settings: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error updating general settings:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

