"use server"

import { db } from "@/lib/database"
import { sendPCNTicketEmail } from "./email"

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
    const ticket = await db.createPCNTicket({
      ...data,
      status: "pending",
      customerNotified: false,
    })

    console.log("[v0] PCN Ticket created:", ticket)
    return { success: true, ticket }
  } catch (error) {
    console.error("[v0] createPCNTicketAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getPCNsByAgreementAction(agreementId: string) {
  console.log("[v0] getPCNsByAgreementAction called for agreement:", agreementId)

  try {
    const tickets = await db.getPCNsByAgreementId(agreementId)
    return tickets || []
  } catch (error) {
    console.error("[v0] getPCNsByAgreementAction error:", error)
    return []
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
