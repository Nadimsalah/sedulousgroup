"use server"

import { createAdminSupabase } from "@/lib/supabase/admin"
import { createFinanceTransaction } from "./finance"

export interface CarLoan {
    id: string
    loan_number: string
    vehicle_id: string | null
    bank_name: string
    loan_amount: number
    interest_rate: number
    loan_term_months: number
    monthly_payment: number
    start_date: string
    end_date: string
    first_payment_date: string
    status: "active" | "paid_off" | "defaulted" | "overdue"
    total_paid: number
    remaining_balance: number
    notes?: string
    created_at?: string
    updated_at?: string
}

export interface LoanPayment {
    id: string
    loan_id: string
    payment_number: number
    due_date: string
    amount_due: number
    amount_paid: number
    payment_date?: string
    status: "pending" | "paid" | "overdue" | "partial"
    principal_amount?: number
    interest_amount?: number
    payment_method?: string
    reference_number?: string
    notes?: string
    created_at?: string
    updated_at?: string
}

// Calculate monthly payment using amortization formula
function calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    months: number
): number {
    const monthlyRate = annualRate / 100 / 12
    if (monthlyRate === 0) return principal / months

    const payment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)

    return Math.round(payment * 100) / 100
}

// Generate payment schedule
export async function generatePaymentSchedule(loanData: {
    loan_id: string
    loan_amount: number
    interest_rate: number
    loan_term_months: number
    monthly_payment: number
    first_payment_date: string
}) {
    const supabase = createAdminSupabase()
    const payments: Partial<LoanPayment>[] = []

    let remainingBalance = loanData.loan_amount
    const monthlyRate = loanData.interest_rate / 100 / 12

    for (let i = 1; i <= loanData.loan_term_months; i++) {
        const dueDate = new Date(loanData.first_payment_date)
        dueDate.setMonth(dueDate.getMonth() + (i - 1))

        const interestAmount = remainingBalance * monthlyRate
        const principalAmount = loanData.monthly_payment - interestAmount

        payments.push({
            loan_id: loanData.loan_id,
            payment_number: i,
            due_date: dueDate.toISOString().split("T")[0],
            amount_due: loanData.monthly_payment,
            amount_paid: 0,
            status: "pending",
            principal_amount: Math.round(principalAmount * 100) / 100,
            interest_amount: Math.round(interestAmount * 100) / 100,
        })

        remainingBalance -= principalAmount
    }

    const { error } = await supabase.from("loan_payments").insert(payments)

    if (error) {
        console.error("Error generating payment schedule:", error)
        throw new Error("Failed to generate payment schedule")
    }

    return payments
}

// Get all car loans
export async function getCarLoans(filters?: {
    status?: string
    bank?: string
    search?: string
}) {
    try {
        const supabase = createAdminSupabase()
        let query = supabase
            .from("car_loans")
            .select(`
        *,
        cars:vehicle_id (
          id,
          name,
          brand
        )
      `)
            .order("created_at", { ascending: false })

        if (filters?.status) {
            query = query.eq("status", filters.status)
        }

        if (filters?.bank) {
            query = query.ilike("bank_name", `%${filters.bank}%`)
        }

        if (filters?.search) {
            query = query.or(
                `loan_number.ilike.%${filters.search}%,bank_name.ilike.%${filters.search}%`
            )
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error("Error fetching car loans:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Get single car loan with payments
export async function getCarLoanById(id: string) {
    try {
        const supabase = createAdminSupabase()

        const { data: loan, error: loanError } = await supabase
            .from("car_loans")
            .select(`
        *,
        cars:vehicle_id (
          id,
          name,
          brand,
          year
        )
      `)
            .eq("id", id)
            .single()

        if (loanError) throw loanError

        const { data: payments, error: paymentsError } = await supabase
            .from("loan_payments")
            .select("*")
            .eq("loan_id", id)
            .order("payment_number", { ascending: true })

        if (paymentsError) throw paymentsError

        const { data: documents, error: docsError } = await supabase
            .from("loan_documents")
            .select("*")
            .eq("loan_id", id)
            .order("uploaded_at", { ascending: false })

        if (docsError) throw docsError

        return {
            success: true,
            data: {
                ...loan,
                payments: payments || [],
                documents: documents || [],
            },
        }
    } catch (error) {
        console.error("Error fetching car loan:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Create new car loan
export async function createCarLoan(data: Omit<CarLoan, "id" | "created_at" | "updated_at">) {
    try {
        const supabase = createAdminSupabase()

        // Calculate monthly payment if not provided
        const monthlyPayment = data.monthly_payment || calculateMonthlyPayment(
            data.loan_amount,
            data.interest_rate,
            data.loan_term_months
        )

        // Calculate end date
        const startDate = new Date(data.start_date)
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + data.loan_term_months)

        const loanData = {
            ...data,
            monthly_payment: monthlyPayment,
            end_date: endDate.toISOString().split("T")[0],
            remaining_balance: data.loan_amount,
            total_paid: 0,
            status: "active" as const,
        }

        const { data: loan, error } = await supabase
            .from("car_loans")
            .insert(loanData)
            .select()
            .single()

        if (error) throw error

        // Generate payment schedule
        await generatePaymentSchedule({
            loan_id: loan.id,
            loan_amount: data.loan_amount,
            interest_rate: data.interest_rate,
            loan_term_months: data.loan_term_months,
            monthly_payment: monthlyPayment,
            first_payment_date: data.first_payment_date,
        })

        return { success: true, data: loan }
    } catch (error) {
        console.error("Error creating car loan:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Update car loan
export async function updateCarLoan(id: string, data: Partial<CarLoan>) {
    try {
        const supabase = createAdminSupabase()

        const { data: loan, error } = await supabase
            .from("car_loans")
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single()

        if (error) throw error
        return { success: true, data: loan }
    } catch (error) {
        console.error("Error updating car loan:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Delete car loan
export async function deleteCarLoan(id: string) {
    try {
        const supabase = createAdminSupabase()

        const { error } = await supabase.from("car_loans").delete().eq("id", id)

        if (error) throw error
        return { success: true }
    } catch (error) {
        console.error("Error deleting car loan:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Record a payment
export async function recordPayment(
    loanId: string,
    paymentId: string,
    paymentData: {
        amount_paid: number
        payment_date: string
        payment_method?: string
        reference_number?: string
        notes?: string
    }
) {
    try {
        const supabase = createAdminSupabase()

        // Get the payment
        const { data: payment, error: paymentError } = await supabase
            .from("loan_payments")
            .select("*")
            .eq("id", paymentId)
            .single()

        if (paymentError) throw paymentError

        // Determine status
        let status: "paid" | "partial" = "paid"
        if (paymentData.amount_paid < payment.amount_due) {
            status = "partial"
        }

        // Update payment
        const { error: updateError } = await supabase
            .from("loan_payments")
            .update({
                amount_paid: paymentData.amount_paid,
                payment_date: paymentData.payment_date,
                payment_method: paymentData.payment_method,
                reference_number: paymentData.reference_number,
                notes: paymentData.notes,
                status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", paymentId)

        if (updateError) throw updateError

        // Update loan totals
        const { data: loan, error: loanError } = await supabase
            .from("car_loans")
            .select("loan_number, total_paid, remaining_balance, cars:vehicle_id(brand, name)")
            .eq("id", loanId)
            .single()

        if (loanError) throw loanError

        const newTotalPaid = (loan.total_paid || 0) + paymentData.amount_paid
        const newRemainingBalance = loan.remaining_balance - paymentData.amount_paid

        // Determine loan status
        let loanStatus: "active" | "paid_off" = "active"
        if (newRemainingBalance <= 0) {
            loanStatus = "paid_off"
        }

        const { error: loanUpdateError } = await supabase
            .from("car_loans")
            .update({
                total_paid: newTotalPaid,
                remaining_balance: Math.max(0, newRemainingBalance),
                status: loanStatus,
                updated_at: new Date().toISOString(),
            })
            .eq("id", loanId)

        if (loanUpdateError) throw loanUpdateError

        // Create Finance ledger entry
        const vehicleName = loan.cars ? `${loan.cars.brand} ${loan.cars.name}` : "Unknown Vehicle"
        await createFinanceTransaction({
            occurred_at: new Date(paymentData.payment_date).toISOString(),
            direction: "out",
            type: "loan_payment",
            source: "loan",
            status: "paid",
            currency: "GBP",
            amount_gross: paymentData.amount_paid,
            fees: 0,
            amount_net: paymentData.amount_paid,
            loan_id: loanId,
            loan_payment_id: paymentId,
            vehicle_id: loan.cars?.id,
            method: paymentData.payment_method || "bank_transfer",
            reference: paymentData.reference_number || loan?.loan_number,
            notes: `Auto-generated from car loan payment recording. ${paymentData.notes || ""}`,
        })

        return { success: true }
    } catch (error) {
        console.error("Error recording payment:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

// Update overdue payments
export async function updateOverduePayments() {
    try {
        const supabase = createAdminSupabase()
        const today = new Date().toISOString().split("T")[0]

        const { error } = await supabase
            .from("loan_payments")
            .update({ status: "overdue" })
            .eq("status", "pending")
            .lt("due_date", today)

        if (error) throw error

        // Update loan status if any payment is overdue
        const { data: overdueLoans } = await supabase
            .from("loan_payments")
            .select("loan_id")
            .eq("status", "overdue")

        if (overdueLoans && overdueLoans.length > 0) {
            const loanIds = [...new Set(overdueLoans.map((p: any) => p.loan_id))]

            await supabase
                .from("car_loans")
                .update({ status: "overdue" })
                .in("id", loanIds)
                .eq("status", "active")
        }

        return { success: true }
    } catch (error) {
        console.error("Error updating overdue payments:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}
