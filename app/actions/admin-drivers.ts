"use server"

import { createClient } from "@supabase/supabase-js"

function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export interface Driver {
  id: string
  full_name: string
  email: string
  phone: string | null
  address: string | null
  license_number: string | null
  license_expiry: string | null
  status: string
  total_trips: number
  rating: number
  profile_image: string | null
  notes: string | null
  joined_at: string
  created_at: string
  updated_at: string
}

export async function getDrivers(): Promise<{ success: boolean; data: Driver[]; error?: string }> {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase.from("drivers").select("*").order("created_at", { ascending: false })

    if (error) {
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function createDriver(driver: Omit<Driver, "id" | "created_at" | "updated_at">) {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase
      .from("drivers")
      .insert({
        full_name: driver.full_name,
        email: driver.email,
        phone: driver.phone,
        address: driver.address,
        license_number: driver.license_number,
        license_expiry: driver.license_expiry,
        status: driver.status || "pending",
        profile_image: driver.profile_image,
        notes: driver.notes,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function updateDriver(id: string, updates: Partial<Driver>) {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase
      .from("drivers")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function deleteDriver(id: string) {
  try {
    const supabase = createAdminSupabase()

    const { error } = await supabase.from("drivers").delete().eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
