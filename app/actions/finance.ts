"use server"

import { createAdminSupabase } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export type FinanceDirection = "in" | "out"
export type FinanceStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled"
export type FinanceType =
    | "booking_payment"
    | "deposit"
    | "refund"
    | "damage_charge"
    | "pcn_ticket"
    | "late_fee"
    | "vendor_cost"
    | "loan_payment"
    | "subscription"
    | "one_time_charge"
    | "manual_adjustment"
    | "other"

export type FinanceSource =
    | "booking"
    | "agreement"
    | "deposit"
    | "damage_report"
    | "vendor"
    | "loan"
    | "manual"

export interface FinanceTransaction {
    id: string
    occurred_at: string
    direction: FinanceDirection
    type: FinanceType
    source: FinanceSource
    status: FinanceStatus
    currency: string
    amount_gross: number
    fees: number
    amount_net: number

    booking_id?: string
    agreement_id?: string
    customer_id?: string
    vehicle_id?: string
    vendor_id?: string
    deposit_id?: string
    damage_report_id?: string
    loan_id?: string
    loan_payment_id?: string
    reversal_of_transaction_id?: string

    method?: string
    provider?: string
    reference?: string
    notes?: string

    created_at?: string
    updated_at?: string
}

// Get all finance transactions with advanced filtering
export async function getFinanceTransactions(filters?: {
    startDate?: string
    endDate?: string
    type?: string
    status?: string
    direction?: string
    source?: string
    search?: string
    customerId?: string
    vehicleId?: string
    vendorId?: string
    booking_id?: string
    preset?: "today" | "yesterday" | "week" | "month" | "year"
    page?: number
    limit?: number
}) {
    try {
        const supabase = createAdminSupabase()
        let query = supabase
            .from("finance_transactions")
            .select(`
                *,
                customer:user_profiles (full_name, username),
                cars:vehicle_id (name, brand)
            `, { count: "exact" })

        if (filters?.startDate) query = query.gte("occurred_at", filters.startDate)
        if (filters?.endDate) query = query.lte("occurred_at", filters.endDate)
        if (filters?.type && filters.type !== "All") query = query.eq("type", filters.type)
        if (filters?.status && filters.status !== "All") query = query.eq("status", filters.status)
        if (filters?.direction && filters.direction !== "All") query = query.eq("direction", filters.direction)
        if (filters?.source && filters.source !== "All") query = query.eq("source", filters.source)

        if (filters?.customerId) query = query.eq("customer_id", filters.customerId)
        if (filters?.vehicleId) query = query.eq("vehicle_id", filters.vehicleId)
        if (filters?.vendorId) query = query.eq("vendor_id", filters.vendorId)
        if (filters?.booking_id) query = query.eq("booking_id", filters.booking_id)

        // Apply preset date filtering
        if (filters?.preset) {
            const now = new Date()
            let start: string | undefined
            let end: string | undefined

            if (filters.preset === "today") {
                start = new Date(now.setHours(0, 0, 0, 0)).toISOString()
            } else if (filters.preset === "yesterday") {
                const yesterday = new Date(now)
                yesterday.setDate(yesterday.getDate() - 1)
                start = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString()
                end = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString()
            } else if (filters.preset === "week") {
                const weekStart = new Date(now)
                weekStart.setDate(weekStart.getDate() - weekStart.getDay())
                start = new Date(weekStart.setHours(0, 0, 0, 0)).toISOString()
            } else if (filters.preset === "month") {
                start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            }

            if (start) query = query.gte("occurred_at", start)
            if (end) query = query.lte("occurred_at", end)
        }

        if (filters?.search) {
            query = query.or(`reference.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
        }

        const page = filters?.page || 1
        const limit = filters?.limit || 20
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data, error, count } = await query
            .order("occurred_at", { ascending: false })
            .range(from, to)

        if (error) throw error
        return { success: true, data, count, totalPages: Math.ceil((count || 0) / limit) }
    } catch (error) {
        console.error("Error fetching finance transactions:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Get finance summary stats for a period
export async function getFinanceSummary(filters?: {
    startDate?: string
    endDate?: string
    preset?: "today" | "yesterday" | "week" | "month" | "year"
}) {
    try {
        const supabase = createAdminSupabase()
        let query = supabase.from("finance_transactions").select("direction, status, amount_gross, fees, amount_net, occurred_at")

        // Apply date filters
        let start = filters?.startDate
        let end = filters?.endDate

        if (filters?.preset) {
            const now = new Date()
            if (filters.preset === "today") {
                start = new Date(now.setHours(0, 0, 0, 0)).toISOString()
            } else if (filters.preset === "yesterday") {
                const yesterday = new Date(now)
                yesterday.setDate(yesterday.getDate() - 1)
                start = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString()
                end = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString()
            } else if (filters.preset === "week") {
                const weekStart = new Date(now)
                weekStart.setDate(weekStart.getDate() - weekStart.getDay())
                start = new Date(weekStart.setHours(0, 0, 0, 0)).toISOString()
            } else if (filters.preset === "month") {
                start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            }
        }

        if (start) query = query.gte("occurred_at", start)
        if (end) query = query.lte("occurred_at", end)

        // Only count paid transactions for summary
        const { data, error } = await query.eq("status", "paid")

        if (error) throw error

        const summary = {
            revenue: 0,
            costs: 0,
            profit: 0,
            netCashflow: 0,
            byType: {} as Record<string, number>,
            bySource: {} as Record<string, number>,
            timeline: [] as any[]
        }

        data?.forEach((tx: any) => {
            const amount = Number(tx.amount_net)
            if (tx.direction === "in") {
                summary.revenue += amount
            } else {
                summary.costs += amount
            }

            // Stats by type/source
            summary.byType[tx.type] = (summary.byType[tx.type] || 0) + amount
            summary.bySource[tx.source] = (summary.bySource[tx.source] || 0) + amount
        })

        summary.profit = summary.revenue - summary.costs
        summary.netCashflow = summary.revenue - summary.costs // Simplified for now

        return { success: true, data: summary }
    } catch (error) {
        console.error("Error getting finance summary:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Create a new transaction
export async function createFinanceTransaction(data: Omit<FinanceTransaction, "id" | "created_at" | "updated_at">) {
    try {
        const supabase = createAdminSupabase()

        // Ensure amount_net is computed if not provided
        const amount_net = data.amount_net ?? (Number(data.amount_gross) - Number(data.fees || 0))

        const { data: transaction, error } = await supabase
            .from("finance_transactions")
            .insert({ ...data, amount_net })
            .select()
            .single()

        if (error) throw error

        revalidatePath("/admin/finance")
        return { success: true, data: transaction }
    } catch (error) {
        console.error("Error creating finance transaction:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Delete a transaction
export async function deleteFinanceTransaction(id: string) {
    try {
        const supabase = createAdminSupabase()
        const { error } = await supabase.from("finance_transactions").delete().eq("id", id)

        if (error) throw error

        revalidatePath("/admin/finance")
        return { success: true }
    } catch (error) {
        console.error("Error deleting finance transaction:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Get all recurring charges
export async function getRecurringCharges() {
    try {
        const supabase = createAdminSupabase()
        const { data, error } = await supabase
            .from("finance_recurring_charges")
            .select(`
                *,
                vendors (name)
            `)
            .order("next_due_date", { ascending: true })

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error("Error fetching recurring charges:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Create a recurring charge
export async function createRecurringCharge(data: any) {
    try {
        const supabase = createAdminSupabase()
        const { data: charge, error } = await supabase
            .from("finance_recurring_charges")
            .insert(data)
            .select()
            .single()

        if (error) throw error

        revalidatePath("/admin/finance")
        return { success: true, data: charge }
    } catch (error) {
        console.error("Error creating recurring charge:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Update a recurring charge
export async function updateRecurringCharge(id: string, data: any) {
    try {
        const supabase = createAdminSupabase()
        const { data: charge, error } = await supabase
            .from("finance_recurring_charges")
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        revalidatePath("/admin/finance")
        return { success: true, data: charge }
    } catch (error) {
        console.error("Error updating recurring charge:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Delete a recurring charge
export async function deleteRecurringCharge(id: string) {
    try {
        const supabase = createAdminSupabase()
        const { error } = await supabase.from("finance_recurring_charges").delete().eq("id", id)

        if (error) throw error

        revalidatePath("/admin/finance")
        return { success: true }
    } catch (error) {
        console.error("Error deleting recurring charge:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Sync recurring charges (create transactions for those due)
export async function syncRecurringCharges() {
    try {
        const supabase = createAdminSupabase()
        const today = new Date().toISOString().split("T")[0]

        // 1. Find active recurring charges that are due
        const { data: dueCharges, error: fetchError } = await supabase
            .from("finance_recurring_charges")
            .select("*")
            .eq("status", "active")
            .eq("auto_create_transaction", true)
            .lte("next_due_date", today)

        if (fetchError) throw fetchError
        if (!dueCharges || dueCharges.length === 0) return { success: true, count: 0 }

        let createdCount = 0
        for (const charge of dueCharges) {
            // Create the transaction
            const { error: txError } = await supabase
                .from("finance_transactions")
                .insert({
                    occurred_at: new Date(charge.next_due_date).toISOString(),
                    direction: "out",
                    type: "subscription",
                    source: "manual",
                    status: "paid",
                    currency: charge.currency,
                    amount_gross: charge.amount,
                    amount_net: charge.amount,
                    vendor_id: charge.vendor_id,
                    notes: `Auto-generated from recurring charge: ${charge.name}`,
                    method: "bank_transfer"
                })

            if (txError) {
                console.error(`Error creating transaction for recurring charge ${charge.id}:`, txError)
                continue
            }

            // Update next due date
            const nextDue = new Date(charge.next_due_date)
            if (charge.frequency === "monthly") nextDue.setMonth(nextDue.getMonth() + 1)
            else if (charge.frequency === "weekly") nextDue.setDate(nextDue.getDate() + 7)
            else if (charge.frequency === "yearly") nextDue.setFullYear(nextDue.getFullYear() + 1)

            await supabase
                .from("finance_recurring_charges")
                .update({
                    next_due_date: nextDue.toISOString().split("T")[0],
                    updated_at: new Date().toISOString()
                })
                .eq("id", charge.id)

            createdCount++
        }

        revalidatePath("/admin/finance")
        return { success: true, count: createdCount }
    } catch (error) {
        console.error("Error syncing recurring charges:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}
