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
  agreement_id?: string | null
  booking_id: string | null
  customer_id?: string | null
  customer_name?: string
  customer_email?: string
  vehicle_name?: string | null
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

    console.log("[Deposits Action] Creating deposit with data:", {
      booking_id: deposit.booking_id,
      customer_name: deposit.customer_name,
      customer_email: deposit.customer_email,
      amount: deposit.amount,
    })

    // Build insert data based on the schema in 900_create_agreements_workflow_schema.sql
    // This schema requires: agreement_id, customer_id, booking_id, amount, status
    // It does NOT have: customer_email, customer_name, vehicle_name
    
    if (!deposit.agreement_id) {
      console.error("[Deposits Action] agreement_id is required but not provided")
      return { 
        success: false, 
        error: "Agreement ID is required. Please create an agreement for this booking first." 
      }
    }

    if (!deposit.customer_id) {
      console.error("[Deposits Action] customer_id is required but not provided")
      return { 
        success: false, 
        error: "Customer ID is required. The booking must have a user_id." 
      }
    }

    const insertData: any = {
      agreement_id: deposit.agreement_id,
      booking_id: deposit.booking_id,
      customer_id: deposit.customer_id,
      amount: deposit.amount,
      status: deposit.status || "held",
    }

    // Add optional fields that exist in this schema
    if (deposit.payment_method) insertData.payment_method = deposit.payment_method
    if (deposit.transaction_id) insertData.transaction_id = deposit.transaction_id
    if (deposit.notes) insertData.notes = deposit.notes

    // Note: customer_email, customer_name, and vehicle_name are NOT in this schema

    const { data, error } = await supabase
      .from("deposits")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[Deposits Action] Error creating deposit:", error)
      console.error("[Deposits Action] Error code:", error.code)
      console.error("[Deposits Action] Error message:", error.message)
      console.error("[Deposits Action] Error details:", error.details)
      console.error("[Deposits Action] Error hint:", error.hint)
      return { success: false, error: error.message }
    }

    console.log("[Deposits Action] Deposit created successfully:", data.id)
    return { success: true, data }
  } catch (error) {
    console.error("[Deposits Action] Exception creating deposit:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function refundDeposit(id: string, refundAmount: number, notes?: string) {
  try {
    const supabase = createAdminSupabase()

    const updateData: any = {
        status: "refunded",
        refund_amount: refundAmount,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }

    if (notes) {
      updateData.notes = notes
    }

    const { data, error } = await supabase
      .from("deposits")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Deposits Action] Error refunding deposit:", error)
      return { success: false, error: error.message }
    }

    console.log("[Deposits Action] Deposit refunded successfully:", id)
    return { success: true, data }
  } catch (error) {
    console.error("[Deposits Action] Error refunding deposit:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function deductFromDeposit(id: string, deductAmount: number, reason: string, notes?: string) {
  try {
    const supabase = createAdminSupabase()

    // Get the deposit first to calculate refund amount
    const { data: depositData } = await supabase.from("deposits").select("amount").eq("id", id).single()
    const refundAmt = depositData ? Math.max(0, depositData.amount - deductAmount) : 0

    const updateData: any = {
      status: "deducted",
      deduction_amount: deductAmount,
      deduction_reason: reason,
      refund_amount: refundAmt > 0 ? refundAmt : null,
      refunded_at: refundAmt > 0 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    if (notes) {
      updateData.notes = notes
    }

    const { data, error } = await supabase
      .from("deposits")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Deposits Action] Error deducting from deposit:", error)
      return { success: false, error: error.message }
    }

    console.log("[Deposits Action] Deposit deduction processed successfully:", id)
    return { success: true, data }
  } catch (error) {
    console.error("[Deposits Action] Error deducting from deposit:", error)
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
