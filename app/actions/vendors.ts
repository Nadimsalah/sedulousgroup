"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { db } from "@/lib/database"
import type { Vendor } from "@/lib/database"

export async function createVendor(data: {
  name: string
  vendorType: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}) {
  try {
    console.log("[Vendors] Creating vendor with data:", {
        name: data.name,
      vendorType: data.vendorType,
        email: data.email,
    })

    // Use database method which uses admin client
    const vendor = await db.createVendor({
      name: data.name,
      vendorType: data.vendorType,
      contactPerson: data.contactPerson || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      rating: undefined,
      notes: data.notes || undefined,
      isActive: true,
      })

    if (!vendor) {
      console.error("[Vendors] Failed to create vendor - no data returned")
      return { success: false, error: "Failed to create vendor: No data returned from database" }
    }

    console.log("[Vendors] Vendor created successfully:", vendor.id)
    return { success: true, vendor }
  } catch (error) {
    console.error("[Vendors] Error creating vendor:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}

export async function getVendors(): Promise<Vendor[]> {
  try {
    // Use admin client to bypass RLS
    const supabase = await createAdminClient()
    if (!supabase) {
      console.error("[Vendors] No admin client available")
      return []
    }

    console.log("[Vendors] Fetching all vendors...")

    const { data, error } = await supabase.from("vendors").select("*").order("name", { ascending: true })

    if (error) {
      console.error("[Vendors] Error fetching vendors:", error)
      throw error
    }

    console.log(`[Vendors] Found ${data?.length || 0} vendors`)

    return (data || []).map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      vendorType: vendor.vendor_type,
      contactPerson: vendor.contact_person,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      rating: vendor.rating,
      notes: vendor.notes,
      isActive: vendor.is_active,
      createdAt: vendor.created_at,
      updatedAt: vendor.updated_at,
    }))
  } catch (error) {
    console.error("[Vendors] Error getting vendors:", error)
    return []
  }
}

export async function updateVendor(
  vendorId: string,
  updates: {
    name?: string
    contactPerson?: string
    email?: string
    phone?: string
    address?: string
    rating?: number
    notes?: string
    isActive?: boolean
  },
) {
  try {
    // Use admin client to bypass RLS
    const supabase = await createAdminClient()
    if (!supabase) {
      console.error("[Vendors] No admin client available for updating vendor")
      return { success: false, error: "No admin client available" }
    }

    const updateData: any = {}
    if (updates.name) updateData.name = updates.name
    if (updates.contactPerson) updateData.contact_person = updates.contactPerson
    if (updates.email) updateData.email = updates.email
    if (updates.phone) updateData.phone = updates.phone
    if (updates.address) updateData.address = updates.address
    if (updates.rating !== undefined) updateData.rating = updates.rating
    if (updates.notes) updateData.notes = updates.notes
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    const { error } = await supabase.from("vendors").update(updateData).eq("id", vendorId)

    if (error) {
      console.error("[Vendors] Error updating vendor:", error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("[Vendors] Error updating vendor:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}

export async function deleteVendor(vendorId: string) {
  try {
    // Use admin client to bypass RLS
    const supabase = await createAdminClient()
    if (!supabase) {
      console.error("[Vendors] No admin client available for deleting vendor")
      return { success: false, error: "No admin client available" }
    }

    const { error } = await supabase.from("vendors").delete().eq("id", vendorId)

    if (error) {
      console.error("[Vendors] Error deleting vendor:", error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("[Vendors] Error deleting vendor:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}
