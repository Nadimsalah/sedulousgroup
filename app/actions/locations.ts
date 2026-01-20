"use server"

import { createAdminSupabase } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export interface Location {
    id: string
    name: string
    address?: string
    is_active: boolean
    created_at: string
}

export async function getLocations() {
    try {
        const supabase = createAdminSupabase()
        const { data, error } = await supabase
            .from("locations")
            .select("*")
            .order("name", { ascending: true })

        if (error) throw error
        return data as Location[]
    } catch (error) {
        console.error("Error fetching locations:", error)
        return []
    }
}

export async function getActiveLocations() {
    try {
        const supabase = createAdminSupabase()
        const { data, error } = await supabase
            .from("locations")
            .select("*")
            .eq("is_active", true)
            .order("name", { ascending: true })

        if (error) throw error
        return data as Location[]
    } catch (error) {
        console.error("Error fetching active locations:", error)
        return []
    }
}

export async function createLocation(name: string, address?: string): Promise<{ success: boolean; data?: Location; error?: string }> {
    try {
        const supabase = createAdminSupabase()
        const { data, error } = await supabase
            .from("locations")
            .insert([{ name, address, is_active: true }])
            .select()
            .single()

        if (error) throw error

        revalidatePath("/admin/settings/locations")
        return { success: true, data }
    } catch (error) {
        console.error("Error creating location:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

export async function updateLocation(id: string, updates: Partial<Location>): Promise<{ success: boolean; data?: Location; error?: string }> {
    try {
        const supabase = createAdminSupabase()
        const { data, error } = await supabase
            .from("locations")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        revalidatePath("/admin/settings/locations")
        return { success: true, data }
    } catch (error) {
        console.error("Error updating location:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

export async function deleteLocation(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createAdminSupabase()
        const { error } = await supabase
            .from("locations")
            .delete()
            .eq("id", id)

        if (error) {
            // If delete fails due to foreign key constraints, just deactivate it
            if (error.code === '23503') {
                const result = await updateLocation(id, { is_active: false })
                return { success: result.success, error: result.error }
            }
            throw error
        }

        revalidatePath("/admin/settings/locations")
        return { success: true }
    } catch (error) {
        console.error("Error deleting location:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

export async function toggleLocationStatus(id: string, currentStatus: boolean) {
    return await updateLocation(id, { is_active: !currentStatus })
}
