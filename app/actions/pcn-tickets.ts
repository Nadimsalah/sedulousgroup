"use server"

import { db } from "@/lib/database"
import type { PCNTicket } from "@/lib/database"
import { sendPCNTicketEmail } from "./email"
import { createClient } from "@/lib/supabase/server"

// UUID validation helper
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function createPCNTicketAction(data: {
  agreementId: string
  bookingId: string
  customerId?: string
  vehicleId?: string
  ticketType: "parking" | "speeding" | "congestion" | "other"
  ticketNumber?: string
  issueDate: string
  dueDate?: string
  amount: number
  ticketDocumentUrl: string
  notes?: string
  uploadedBy?: string
}) {
  console.log("[v0] createPCNTicketAction called")

  try {
    // Get current authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] createPCNTicketAction: Not authenticated", authError)
      return { success: false, error: "Authentication required. Please log in." }
    }

    // Use authenticated user's UUID for uploadedBy (ignore client-provided value for security)
    const uploadedByUserId = user.id

    // Validate UUID fields if provided
    if (data.customerId && !isValidUUID(data.customerId)) {
      return { success: false, error: "customerId must be a valid UUID" }
    }
    if (data.vehicleId && !isValidUUID(data.vehicleId)) {
      // vehicleId might be TEXT in some schemas, so we'll allow it but log a warning
      console.warn("[v0] vehicleId is not a UUID:", data.vehicleId)
    }

    const ticket = await db.createPCNTicket({
      ...data,
      uploadedBy: uploadedByUserId, // Override with authenticated user's UUID
      status: "pending",
      customerNotified: false,
    })

    console.log("[v0] PCN Ticket created:", ticket)
    return { success: true, ticket }
  } catch (error) {
    console.error("[v0] createPCNTicketAction error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    // Provide clearer error messages for UUID validation
    if (errorMessage.includes("invalid input syntax for type uuid")) {
      return { success: false, error: "Invalid UUID format. Please ensure all ID fields are valid UUIDs." }
    }
    
    return { success: false, error: errorMessage }
  }
}

export async function getPCNsByAgreementAction(agreementId: string, limit?: number) {
  console.log("[PCN Tickets Action] getPCNsByAgreementAction called for agreement:", agreementId, limit ? `(limit: ${limit})` : "")

  try {
    if (!agreementId) {
      console.warn("[PCN Tickets Action] No agreement ID provided")
      return []
    }

    const tickets = await db.getPCNsByAgreementId(agreementId, limit)
    console.log(`[PCN Tickets Action] Found ${tickets?.length || 0} tickets for agreement ${agreementId}`)
    return tickets || []
  } catch (error) {
    console.error("[PCN Tickets Action] getPCNsByAgreementAction error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[PCN Tickets Action] Error details:", errorMessage)
    return []
  }
}

export async function getPCNsByAgreementIdsAction(agreementIds: string[]): Promise<Record<string, PCNTicket[]>> {
  console.log("[PCN Tickets Action] getPCNsByAgreementIdsAction called for", agreementIds.length, "agreements")

  try {
    if (!agreementIds || agreementIds.length === 0) {
      return {}
    }

    const ticketsByAgreement = await db.getPCNsByAgreementIds(agreementIds)
    console.log(`[PCN Tickets Action] Batch found tickets for ${Object.keys(ticketsByAgreement).length} agreements`)
    return ticketsByAgreement
  } catch (error) {
    console.error("[PCN Tickets Action] getPCNsByAgreementIdsAction error:", error)
    return {}
  }
}

export async function sendPCNToCustomerAction(ticketId: string) {
  console.log("[v0] sendPCNToCustomerAction called for ticket:", ticketId)

  try {
    const result = await sendPCNTicketEmail(ticketId)

    if (result.success) {
      // Update ticket status
      await db.updatePCNTicket(ticketId, {
        status: "sent_to_customer",
        sentToCustomerAt: new Date().toISOString(),
        customerNotified: true,
      })
    }

    return result
  } catch (error) {
    console.error("[v0] sendPCNToCustomerAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updatePCNTicketStatusAction(ticketId: string, status: string, paidBy?: string) {
  console.log("[v0] updatePCNTicketStatusAction called")

  try {
    const updates: any = { status }

    if (status === "paid") {
      updates.paidBy = paidBy || "customer"
      updates.paidAt = new Date().toISOString()
    }

    const ticket = await db.updatePCNTicket(ticketId, updates)
    return { success: true, ticket }
  } catch (error) {
    console.error("[v0] updatePCNTicketStatusAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export interface PaginatedPCNTicketsResult {
  items: PCNTicket[]
  nextCursor: string | null
  hasMore: boolean
}

export async function getAllPCNTicketsPaginatedAction(
  limit: number = 5,
  cursor?: string,
  filters?: { status?: string; searchTerm?: string }
): Promise<PaginatedPCNTicketsResult> {
  console.log("[PCN Tickets Action] getAllPCNTicketsPaginatedAction called", { limit, cursor: cursor ? "present" : "none", filters })

  try {
    const result = await db.getAllPCNTicketsPaginated(limit, cursor, filters)
    console.log(`[PCN Tickets Action] Paginated result: ${result.items.length} items, hasMore: ${result.hasMore}`)
    return result
  } catch (error) {
    console.error("[PCN Tickets Action] getAllPCNTicketsPaginatedAction error:", error)
    return { items: [], nextCursor: null, hasMore: false }
  }
}

export async function getAllPCNTicketsAction(filters?: { status?: string; searchTerm?: string }): Promise<PCNTicket[]> {
  console.log("[PCN Tickets Action] getAllPCNTicketsAction called", { filters })

  try {
    const tickets = await db.getAllPCNTickets(filters)
    console.log(`[PCN Tickets Action] Loaded ${tickets.length} tickets`)
    return tickets
  } catch (error) {
    console.error("[PCN Tickets Action] getAllPCNTicketsAction error:", error)
    return []
  }
}
