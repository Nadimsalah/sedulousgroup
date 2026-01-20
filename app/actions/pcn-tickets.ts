"use server"

import { db } from "@/lib/database"
import type { PCNTicket } from "@/lib/database"
import { sendPCNTicketEmail } from "./email"
import { createClient } from "@/lib/supabase/server"
import { createFinanceTransaction } from "./finance"

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

    // Create notification for admin
    try {
      const adminSupabase = await createClient() // We'll use the admin client logic from inside createPCNTicket if needed, but here we can just use another insert
      await adminSupabase.from("notifications").insert({
        title: "New PCN Ticket",
        message: `${data.ticketType.toUpperCase()} ticket ${data.ticketNumber || ""} received for booking ${data.bookingId}`,
        type: "pcn",
        link: `/admin/pcn-tickets`,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      console.log("[v0] Notification created for new PCN")
    } catch (notificationError) {
      console.error("[v0] Failed to create notification for PCN:", notificationError)
    }

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

    // Record Finance Transaction if paid
    if (status === "paid") {
      // Fetch full ticket details to get booking/car/customer IDs
      const { data: ticketDetails } = await (await createClient())
        .from("pcn_tickets")
        .select("*")
        .eq("id", ticketId)
        .single()

      if (ticketDetails) {
        await createFinanceTransaction({
          occurred_at: new Date().toISOString(),
          direction: "in",
          type: "pcn_ticket",
          source: "manual", // PCNs are usually manually reconciled
          status: "paid",
          currency: "GBP",
          amount_gross: ticketDetails.amount,
          fees: 0,
          amount_net: ticketDetails.amount,
          booking_id: ticketDetails.booking_id,
          agreement_id: ticketDetails.agreement_id,
          customer_id: ticketDetails.customer_id,
          vehicle_id: ticketDetails.vehicle_id,
          method: paidBy === "company" ? "company_payment" : "customer_payment",
          notes: `PCN Payment recorded. Paid by: ${paidBy || "customer"}. Type: ${ticketDetails.ticket_type}`,
        })
      }
    }

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

export async function getAllPCNTicketsAction(filters?: { status?: string; searchTerm?: string }) {
  console.log("[PCN Tickets Action] getAllPCNTicketsAction called", { filters })

  try {
    const tickets = await db.getPCNTicketsWithDetails(filters)
    console.log(`[PCN Tickets Action] Loaded ${tickets.length} tickets with details`)
    return { success: true, tickets }
  } catch (error) {
    console.error("[PCN Tickets Action] getAllPCNTicketsAction error:", error)
    return { success: false, tickets: [], error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getActiveAgreementByVRNAction(vrn: string) {
  console.log("[PCN Tickets Action] getActiveAgreementByVRNAction called for VRN:", vrn)

  try {
    const supabase = await createClient()

    // Normalize VRN: trim whitespace and convert to uppercase
    const normalizedVRN = vrn.trim().toUpperCase()

    // Find vehicle by VRN in fleet_vehicles table (case-insensitive)
    const { data: fleetVehicles, error: vError } = await supabase
      .from("fleet_vehicles")
      .select(`
        car_id,
        registration_number,
        cars (id, name)
      `)
      .ilike("registration_number", normalizedVRN)

    if (vError || !fleetVehicles || fleetVehicles.length === 0) {
      console.log("[PCN Tickets Action] Vehicle not found for VRN:", normalizedVRN, "Error:", vError)
      return { success: false, error: "Vehicle not found. Please check the registration number." }
    }

    const fleetVehicle: any = fleetVehicles[0]
    const vehicle = {
      id: fleetVehicle.car_id,
      name: fleetVehicle.cars?.name || "Unknown Vehicle",
      registration_number: fleetVehicle.registration_number
    }

    // Find active agreement for this vehicle
    const { data: agreements, error: aError } = await supabase
      .from("agreements")
      .select(`
        id,
        agreement_number,
        booking_id,
        customer_id,
        vehicle_id,
        status,
        user_profiles (full_name, email)
      `)
      .eq("vehicle_id", vehicle.id)
      .in("status", ["active", "signed", "confirmed"])
      .order("created_at", { ascending: false })
      .limit(1)

    if (aError || !agreements || agreements.length === 0) {
      return { success: false, error: "No active agreement found for this vehicle" }
    }

    const agreement: any = agreements[0]

    return {
      success: true,
      data: {
        agreementId: agreement.id,
        agreementNumber: agreement.agreement_number,
        bookingId: agreement.booking_id,
        customerId: agreement.customer_id,
        customerName: agreement.user_profiles?.full_name,
        customerEmail: agreement.user_profiles?.email,
        vehicleId: agreement.vehicle_id,
        vehicleName: vehicle.name,
        registrationNumber: vehicle.registration_number
      }
    }
  } catch (error) {
    console.error("[PCN Tickets Action] getActiveAgreementByVRNAction error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getActiveAgreementsForPCNAction() {
  console.log("[PCN Tickets Action] getActiveAgreementsForPCNAction called")

  try {
    const supabase = await createClient()

    // Get all active agreements with customer and vehicle details
    const { data: agreements, error } = await supabase
      .from("agreements")
      .select(`
        id,
        agreement_number,
        booking_id,
        customer_id,
        vehicle_id,
        status,
        user_profiles (full_name, email),
        cars (id, name, registration_number)
      `)
      .in("status", ["active", "signed", "confirmed"])
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[PCN Tickets Action] Error fetching agreements:", error)
      return { success: false, error: "Failed to load agreements", agreements: [] }
    }

    const formattedAgreements = (agreements || []).map((ag: any) => ({
      agreementId: ag.id,
      agreementNumber: ag.agreement_number,
      bookingId: ag.booking_id,
      customerId: ag.customer_id,
      customerName: ag.user_profiles?.full_name || "Unknown",
      customerEmail: ag.user_profiles?.email,
      vehicleId: ag.vehicle_id,
      vehicleName: ag.cars?.name || "Unknown Vehicle",
      registrationNumber: ag.cars?.registration_number || "No VRN"
    }))

    return { success: true, agreements: formattedAgreements }
  } catch (error) {
    console.error("[PCN Tickets Action] getActiveAgreementsForPCNAction error:", error)
    return { success: false, error: "An unexpected error occurred", agreements: [] }
  }
}
