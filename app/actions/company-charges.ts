"use server"

import { createAdminSupabase } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { createFinanceTransaction } from "./finance"

export interface CompanyExpense {
    id: string
    title: string
    amount: number
    expense_date: string
    category: string
    status: "paid" | "pending"
    recurrence: "one_time" | "monthly"
    source: "manual" | "car_loan"
    reference_id?: string
    payment_method?: string
    recipient?: string
    notes?: string
    attachment_url?: string
    created_at?: string
    updated_at?: string
}

// Get all company expenses
export async function getCompanyExpenses(filters?: {
    category?: string
    status?: string
    recurrence?: string
    source?: string
    search?: string
    startDate?: string
    endDate?: string
}) {
    try {
        const supabase = createAdminSupabase()
        let query = supabase
            .from("company_expenses")
            .select("*")
            .order("expense_date", { ascending: false })

        if (filters?.category && filters.category !== "All") {
            query = query.eq("category", filters.category)
        }

        if (filters?.source && filters.source !== "All") {
            query = query.eq("source", filters.source)
        }

        if (filters?.status && filters.status !== "All") {
            query = query.eq("status", filters.status)
        }

        if (filters?.recurrence && filters.recurrence !== "All") {
            query = query.eq("recurrence", filters.recurrence)
        }

        if (filters?.startDate) {
            query = query.gte("expense_date", filters.startDate)
        }

        if (filters?.endDate) {
            query = query.lte("expense_date", filters.endDate)
        }

        if (filters?.search) {
            query = query.or(`title.ilike.%${filters.search}%,recipient.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error("Error fetching company expenses:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Create a new company expense
export async function createCompanyExpense(data: Omit<CompanyExpense, "id" | "created_at" | "updated_at">) {
    try {
        const supabase = createAdminSupabase()

        const { data: expense, error } = await supabase
            .from("company_expenses")
            .insert(data)
            .select()
            .single()

        if (error) throw error

        // Sync with Finance Ledger
        await createFinanceTransaction({
            occurred_at: new Date(data.expense_date).toISOString(),
            direction: "out",
            type: "one_time_charge",
            source: "manual",
            status: data.status === "paid" ? "paid" : "pending",
            currency: "GBP",
            amount_gross: data.amount,
            fees: 0,
            amount_net: data.amount,
            notes: `Auto-synced from Company Charges: ${data.title}. ${data.notes || ""}`,
            method: data.payment_method || "bank_transfer",
            reference: data.reference_id,
        })

        revalidatePath("/admin/company-charges")
        return { success: true, data: expense }
    } catch (error) {
        console.error("Error creating company expense:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Update an existing expense
export async function updateCompanyExpense(id: string, data: Partial<CompanyExpense>) {
    try {
        const supabase = createAdminSupabase()

        const { data: expense, error } = await supabase
            .from("company_expenses")
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        revalidatePath("/admin/company-charges")
        return { success: true, data: expense }
    } catch (error) {
        console.error("Error updating company expense:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Delete an expense
export async function deleteCompanyExpense(id: string) {
    try {
        const supabase = createAdminSupabase()

        const { error } = await supabase
            .from("company_expenses")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Supabase Error Deleting Expense:", error)
            throw error
        }

        revalidatePath("/admin/company-charges")
        return { success: true }
    } catch (error) {
        console.error("Error deleting company expense:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Get expense summaries/stats
export async function getExpenseStats() {
    try {
        const supabase = createAdminSupabase()
        const today = new Date().toISOString().split("T")[0]

        // This is a simplified version, in a real app you might use Supabase RPC for complicated counts
        const { data: allExpenses, error } = await supabase
            .from("company_expenses")
            .select("amount, expense_date, category")

        if (error) throw error

        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const stats = {
            totalAllTime: 0,
            thisMonth: 0,
            thisYear: 0,
            byCategory: {} as Record<string, number>,
            loanObligations: 0 // New field for active monthly payments
        }

        // Calculate active loan obligations
        const { data: activeLoans } = await supabase
            .from("car_loans")
            .select("monthly_payment")
            .eq("status", "active")

        if (activeLoans) {
            stats.loanObligations = activeLoans.reduce((sum: number, loan: any) => sum + Number(loan.monthly_payment), 0)
        }

        allExpenses.forEach((exp: any) => {
            const date = new Date(exp.expense_date)
            stats.totalAllTime += Number(exp.amount)

            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                stats.thisMonth += Number(exp.amount)
            }

            if (date.getFullYear() === currentYear) {
                stats.thisYear += Number(exp.amount)
            }

            stats.byCategory[exp.category] = (stats.byCategory[exp.category] || 0) + Number(exp.amount)
        })

        return { success: true, data: stats }
    } catch (error) {
        console.error("Error getting expense stats:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Sync existing paid loan payments to company charges
export async function syncLoanPaymentsData() {
    try {
        const supabase = createAdminSupabase()

        // 1. Get all paid loan payments with loan details
        const { data: payments, error: paymentsError } = await supabase
            .from("loan_payments")
            .select(`
                *,
                car_loans:loan_id (
                    loan_number,
                    cars:vehicle_id (brand, name)
                )
            `)
            .gt("amount_paid", 0) // Pull anything where money was actually paid

        if (paymentsError) throw paymentsError
        if (!payments || payments.length === 0) return { success: true, message: "No payments to sync" }

        // 2. Get existing company expenses from car loans to avoid duplicates
        const { data: existingExpenses, error: expensesError } = await supabase
            .from("company_expenses")
            .select("reference_id")
            .eq("source", "car_loan")

        if (expensesError) throw expensesError
        const existingRefIds = new Set((existingExpenses || []).map((e: any) => e.reference_id))

        // 3. Filter payments that haven't been synced yet
        const newExpenses = payments
            .filter((p: any) => !existingRefIds.has(p.id))
            .map((p: any) => {
                const vehicleName = p.car_loans?.cars ? `${p.car_loans.cars.brand} ${p.car_loans.cars.name}` : "Unknown Vehicle"
                return {
                    title: `Loan Payment: ${p.car_loans?.loan_number} (${vehicleName})`,
                    amount: p.amount_paid,
                    expense_date: p.payment_date || p.due_date,
                    category: "Loan Payment",
                    source: "car_loan",
                    status: "paid",
                    recurrence: "monthly",
                    reference_id: p.id,
                    payment_method: p.payment_method || "bank_transfer",
                    notes: `Auto-synced from car loan history. ${p.notes || ""}`,
                }
            })

        if (newExpenses.length === 0) {
            return { success: true, message: "All payments already synced" }
        }

        // 4. Batch insert new expenses
        const { error: insertError } = await supabase
            .from("company_expenses")
            .insert(newExpenses)

        if (insertError) throw insertError

        revalidatePath("/admin/company-charges")
        return { success: true, count: newExpenses.length }
    } catch (error) {
        console.error("Error syncing loan payments:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}
