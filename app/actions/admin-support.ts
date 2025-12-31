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

export interface SupportTicket {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  subject: string
  message: string
  status: string
  priority: string
  category: string | null
  admin_response: string | null
  booking_id: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export async function getSupportTickets(): Promise<{ success: boolean; data: SupportTicket[]; error?: string }> {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false })

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

export async function createSupportTicket(
  ticket: Omit<SupportTicket, "id" | "created_at" | "updated_at" | "admin_response" | "resolved_at">,
) {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        customer_name: ticket.customer_name,
        customer_email: ticket.customer_email,
        customer_phone: ticket.customer_phone,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status || "open",
        priority: ticket.priority || "medium",
        category: ticket.category,
        booking_id: ticket.booking_id,
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

export async function updateSupportTicket(
  id: string,
  updates: { status?: string; priority?: string; admin_response?: string },
) {
  try {
    const supabase = createAdminSupabase()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.status) updateData.status = updates.status
    if (updates.priority) updateData.priority = updates.priority
    if (updates.admin_response) updateData.admin_response = updates.admin_response

    if (updates.status === "resolved") {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabase.from("support_tickets").update(updateData).eq("id", id).select().single()

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

export async function deleteSupportTicket(id: string) {
  try {
    const supabase = createAdminSupabase()

    const { error } = await supabase.from("support_tickets").delete().eq("id", id)

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
