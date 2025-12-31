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

export interface Deposit {
  id: string
  booking_id: string | null
  customer_name: string
  customer_email: string
  vehicle_name: string | null
  amount: number
  status: string
  payment_method: string | null
  transaction_id: string | null
  refund_amount: number | null
  refunded_at: string | null
  deduction_amount: number | null
  deduction_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function getDeposits(): Promise<{ success: boolean; data: Deposit[]; error?: string }> {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase.from("deposits").select("*").order("created_at", { ascending: false })

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

export async function createDeposit(deposit: Omit<Deposit, "id" | "created_at" | "updated_at">) {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase
      .from("deposits")
      .insert({
        booking_id: deposit.booking_id,
        customer_name: deposit.customer_name,
        customer_email: deposit.customer_email,
        vehicle_name: deposit.vehicle_name,
        amount: deposit.amount,
        status: deposit.status || "held",
        payment_method: deposit.payment_method,
        transaction_id: deposit.transaction_id,
        notes: deposit.notes,
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

export async function refundDeposit(id: string, refundAmount: number) {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase
      .from("deposits")
      .update({
        status: "refunded",
        refund_amount: refundAmount,
        refunded_at: new Date().toISOString(),
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

export async function deductFromDeposit(id: string, deductAmount: number, reason: string) {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase
      .from("deposits")
      .update({
        status: "deducted",
        deduction_amount: deductAmount,
        deduction_reason: reason,
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

export async function updateDeposit(id: string, updates: Partial<Deposit>) {
  try {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase
      .from("deposits")
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

export async function deleteDeposit(id: string) {
  try {
    const supabase = createAdminSupabase()

    const { error } = await supabase.from("deposits").delete().eq("id", id)

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
