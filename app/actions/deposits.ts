"use server"

import { createClient } from "@supabase/supabase-js"
import { db } from "@/lib/database"
import type { Deposit } from "@/lib/database"

// Create admin client with service role to bypass RLS
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

export interface DepositWithDetails extends Deposit {
    customer_name?: string
    customer_email?: string
    vehicle_name?: string
    vehicle_registration?: string
}

/**
 * Fetch all deposits with joined customer and vehicle information
 */
export async function getDepositsAction(): Promise<{
    success: boolean
    data: DepositWithDetails[]
    error?: string
}> {
    try {
        const supabase = createAdminSupabase()

        // Query deposits and join related data
        // Inner join agreements to get vehicle_id, then join cars
        // Join user_profiles for customer data
        const { data, error } = await supabase
            .from("deposits")
            .select(`
        *,
        agreements:agreement_id (
          vehicle_id,
          vehicle_registration,
          cars:vehicle_id (
            name,
            brand,
            registration_number
          )
        ),
        customer:customer_id (
          full_name,
          username
        ),
        bookings:booking_id (
          customer_name,
          customer_email
        )
      `)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("[Deposits Action] Error fetching deposits:", error)
            return { success: false, data: [], error: error.message }
        }

        // Map the complex join result to a flat interface
        const formattedData: DepositWithDetails[] = (data || []).map((item: any) => {
            // Use helper to map base deposit fields
            const baseDeposit = (db as any).mapDepositFromDb(item)

            const agreement = item.agreements
            const car = agreement?.cars
            const customerProfile = item.customer
            const booking = item.bookings

            return {
                ...baseDeposit,
                customer_name: customerProfile?.full_name || booking?.customer_name || "Unknown Customer",
                customer_email: booking?.customer_email || "N/A",
                vehicle_name: car ? `${car.brand} ${car.name}` : "Unknown Vehicle",
                vehicle_registration: car?.registration_number || agreement?.vehicle_registration || "N/A",
            }
        })

        return { success: true, data: formattedData }
    } catch (error) {
        console.error("[Deposits Action] Exception in getDepositsAction:", error)
        return {
            success: false,
            data: [],
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Handle refunding a deposit
 */
export async function refundDepositAction(
    id: string,
    refundAmount: number,
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createAdminSupabase()

        // 1. Get the current deposit to verify amount
        const { data: deposit, error: fetchError } = await supabase
            .from("deposits")
            .select("amount, status")
            .eq("id", id)
            .single()

        if (fetchError || !deposit) {
            return { success: false, error: "Deposit not found" }
        }

        if (refundAmount > deposit.amount) {
            return { success: false, error: "Refund amount exceeds original deposit" }
        }

        // 2. Perform the update
        const isPartial = refundAmount < deposit.amount
        const { error: updateError } = await supabase
            .from("deposits")
            .update({
                status: isPartial ? "partially_refunded" : "refunded",
                refund_amount: refundAmount,
                refunded_at: new Date().toISOString(),
                notes: notes ? notes : (deposit as any).notes,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)

        if (updateError) {
            return { success: false, error: updateError.message }
        }

        return { success: true }
    } catch (error) {
        console.error("[Deposits Action] Exception in refundDepositAction:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

/**
 * Handle a deduction from a deposit (e.g. for damage or PCN)
 */
export async function deductDepositAction(
    id: string,
    deductAmount: number,
    reason: string,
    notes?: string,
    proofUrl?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createAdminSupabase()

        // 1. Get current deposit
        const { data: deposit, error: fetchError } = await supabase
            .from("deposits")
            .select("amount, status")
            .eq("id", id)
            .single()

        if (fetchError || !deposit) {
            return { success: false, error: "Deposit not found" }
        }

        if (deductAmount > deposit.amount) {
            return { success: false, error: "Deduction amount exceeds deposit balance" }
        }

        // 2. Process deduction
        // We update status to 'deducted' and record the deduction details
        const { error: updateError } = await supabase
            .from("deposits")
            .update({
                status: "deducted",
                deduction_amount: deductAmount,
                deduction_reason: reason,
                deduction_proof_url: proofUrl,
                notes: notes ? notes : (deposit as any).notes,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)

        if (updateError) {
            return { success: false, error: updateError.message }
        }

        return { success: true }
    } catch (error) {
        console.error("[Deposits Action] Exception in deductDepositAction:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

/**
 * Create a new deposit entry
 */
export async function createDepositAction(data: {
    agreementId: string
    bookingId: string
    customerId: string
    amount: number
    paymentMethod: "card" | "cash" | "bank_transfer"
    transactionId?: string
    notes?: string
}): Promise<{ success: boolean; error?: string }> {
    try {
        const result = await db.createDeposit({
            ...data,
            status: "held",
        })

        if (!result) {
            return { success: false, error: "Failed to create deposit record" }
        }

        return { success: true }
    } catch (error) {
        console.error("[Deposits Action] Exception in createDepositAction:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}
