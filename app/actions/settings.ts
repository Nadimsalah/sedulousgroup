import { NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/admin"

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
  // Rent service settings
  rent_enabled?: boolean
  rent_min_days?: number
  rent_max_days?: number
  rent_advance_days?: number
  rent_buffer_hours?: number
  // Flexi Hire service settings
  flexi_enabled?: boolean
  flexi_min_days?: number
  flexi_max_days?: number
  flexi_advance_days?: number
  flexi_buffer_hours?: number
  // PCO service settings
  pco_enabled?: boolean
  pco_min_days?: number
  pco_max_days?: number
  pco_advance_days?: number
  pco_buffer_hours?: number
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

export interface EmailSettings {
  from_email: string
  from_name: string
  reply_to?: string
  resend_api_key?: string
  enabled?: boolean
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_password?: string
  send_booking_confirmation: boolean
  send_booking_reminder: boolean
  send_document_notification: boolean
}

export interface ContentSettings {
  // Static page content
  about_us_content: string
  privacy_policy_content: string
  gdpr_content: string
  rental_agreement_content: string
  terms_conditions_content: string
  // Footer contact information
  company_name: string
  address_line1: string
  address_line2: string
  city: string
  postcode: string
  phone: string
  email: string
  // Opening hours
  hours_weekday: string
  hours_saturday: string
  hours_sunday: string
  // Regulatory information
  company_number: string
  fca_number: string
  ico_registered: boolean
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
        rent_enabled: true,
        rent_min_days: 1,
        rent_max_days: 30,
        rent_advance_days: 90,
        rent_buffer_hours: 2,
        flexi_enabled: true,
        flexi_min_days: 7,
        flexi_max_days: 90,
        flexi_advance_days: 30,
        flexi_buffer_hours: 4,
        pco_enabled: true,
        pco_min_days: 28,
        pco_max_days: 365,
        pco_advance_days: 14,
        pco_buffer_hours: 6,
      }
    }

    return data.value as BookingSettings
  } catch (error) {
    console.error("Error fetching booking settings:", error)
    // Return defaults on error instead of throwing
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
      rent_enabled: true,
      rent_min_days: 1,
      rent_max_days: 30,
      rent_advance_days: 90,
      rent_buffer_hours: 2,
      flexi_enabled: true,
      flexi_min_days: 7,
      flexi_max_days: 90,
      flexi_advance_days: 30,
      flexi_buffer_hours: 4,
      pco_enabled: true,
      pco_min_days: 28,
      pco_max_days: 365,
      pco_advance_days: 14,
      pco_buffer_hours: 6,
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
      return {
        stripe_enabled: false,
        currency: "GBP",
        tax_rate: 20,
        deposit_percentage: 20,
        late_fee_per_day: 50,
        cancellation_fee: 100,
      }
    }

    return data.value as PaymentSettings
  } catch (error) {
    console.error("Error fetching payment settings:", error)
    // Return defaults on error instead of throwing
    return {
      stripe_enabled: false,
      currency: "GBP",
      tax_rate: 20,
      deposit_percentage: 20,
      late_fee_per_day: 50,
      cancellation_fee: 100,
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

      if (error.code === "42P01" || error.message?.includes("does not exist")) {
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
    // Return defaults on error instead of throwing
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

      if (error.code === "42P01" || error.message?.includes("does not exist")) {
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

// Email Settings
export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "email")
      .single()

    if (error || !data) {
      return {
        from_email: "noreply@sedulousgroup.net",
        from_name: "Sedulous Group Ltd",
        send_booking_confirmation: true,
        send_booking_reminder: true,
        send_document_notification: true,
      }
    }

    return data.value as EmailSettings
  } catch (error) {
    console.error("Error fetching email settings:", error)
    throw error
  }
}

export async function updateEmailSettings(settings: EmailSettings) {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from("settings")
      .upsert(
        {
          key: "email",
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
      console.error("[Settings] Error updating email settings:", error)

      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return {
          success: false,
          error: "Settings table does not exist. Go to /admin/settings/setup to create the required tables.",
        }
      }

      throw new Error(`Failed to update email settings: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error updating email settings:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Content Settings
export async function getContentSettings(): Promise<ContentSettings> {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "content")
      .single()

    if (error || !data) {
      return {
        about_us_content: "Welcome to Sedulous Group Ltd. We provide premium car rental services.",
        privacy_policy_content: "Your privacy is important to us.",
        gdpr_content: "We comply with GDPR regulations.",
        rental_agreement_content: "Standard rental agreement terms.",
        terms_conditions_content: "Terms and conditions of service.",
        company_name: "Sedulous Group LTD",
        address_line1: "Unit 5, 100 Colindeep Lane",
        address_line2: "",
        city: "London",
        postcode: "NW9 6HB",
        phone: "020 3355 2561",
        email: "info@sedulousgroupltd.co.uk",
        hours_weekday: "10:00 – 17:30",
        hours_saturday: "10:00 – 14:00",
        hours_sunday: "Closed",
        company_number: "13272612",
        fca_number: "964621",
        ico_registered: true,
      }
    }

    return data.value as ContentSettings
  } catch (error) {
    console.error("Error fetching content settings:", error)
    // Return defaults on error instead of throwing
    return {
      about_us_content: "Welcome to Sedulous Group Ltd. We provide premium car rental services.",
      privacy_policy_content: "Your privacy is important to us.",
      gdpr_content: "We comply with GDPR regulations.",
      rental_agreement_content: "Standard rental agreement terms.",
      terms_conditions_content: "Terms and conditions of service.",
      company_name: "Sedulous Group LTD",
      address_line1: "Unit 5, 100 Colindeep Lane",
      address_line2: "",
      city: "London",
      postcode: "NW9 6HB",
      phone: "020 3355 2561",
      email: "info@sedulousgroupltd.co.uk",
      hours_weekday: "10:00 – 17:30",
      hours_saturday: "10:00 – 14:00",
      hours_sunday: "Closed",
      company_number: "13272612",
      fca_number: "964621",
      ico_registered: true,
    }
  }
}

export async function updateContentSettings(settings: ContentSettings) {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from("settings")
      .upsert(
        {
          key: "content",
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
      console.error("[Settings] Error updating content settings:", error)

      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return {
          success: false,
          error: "Settings table does not exist. Go to /admin/settings/setup to create the required tables.",
        }
      }

      throw new Error(`Failed to update content settings: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error updating content settings:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}