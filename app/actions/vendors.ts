"use server"

import { createClient } from "@/lib/supabase/server"
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
    const supabase = await createClient()

    const { data: vendor, error } = await supabase
      .from("vendors")
      .insert({
        name: data.name,
        vendor_type: data.vendorType,
        contact_person: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, vendor }
  } catch (error) {
    console.error("[v0] Error creating vendor:", error)
    return { success: false, error }
  }
}

export async function getVendors(): Promise<Vendor[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("vendors").select("*").order("name", { ascending: true })

    if (error) throw error

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
    console.error("[v0] Error getting vendors:", error)
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
    const supabase = await createClient()

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

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating vendor:", error)
    return { success: false, error }
  }
}

export async function deleteVendor(vendorId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("vendors").delete().eq("id", vendorId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting vendor:", error)
    return { success: false, error }
  }
}
