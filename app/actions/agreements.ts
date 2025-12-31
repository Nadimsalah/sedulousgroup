"use server"

import { db } from "@/lib/database"
import { sendAgreementEmail } from "./email"

export async function createAgreementAction(data: {
  booking_id: string
  customer_id: string | null
  vehicle_id: string | null
  agreement_number: string
  agreement_type: string
  status: string
  odometer_reading: number
  fuel_level: string
  vehicle_registration: string
  start_date: string
  end_date: string
  total_amount: number
}) {
  console.log("[v0] createAgreementAction called with data:", data)

  try {
    // Validate required fields
    if (!data.booking_id) {
      throw new Error("Booking ID is required")
    }
    if (!data.agreement_number) {
      throw new Error("Agreement number is required")
    }
    if (!data.start_date || !data.end_date) {
      throw new Error("Start date and end date are required")
    }
    if (data.total_amount === undefined || data.total_amount === null) {
      throw new Error("Total amount is required")
    }

    const agreement = await db.createAgreement({
      bookingId: data.booking_id,
      customerId: data.customer_id || null,
      vehicleId: data.vehicle_id || null,
      agreementNumber: data.agreement_number,
      agreementType: data.agreement_type || "rent",
      status: data.status || "pending",
      startDate: data.start_date,
      endDate: data.end_date,
      totalAmount: data.total_amount,
      odometerReading: data.odometer_reading,
      fuelLevel: data.fuel_level,
      // Don't set createdBy since it requires a UUID, leave it null
      // createdBy: undefined,
    })

    if (!agreement) {
      throw new Error("Failed to create agreement: Database returned null")
    }

    console.log("[v0] Agreement created successfully:", agreement.id)
    return agreement
  } catch (error) {
    console.error("[v0] createAgreementAction error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    throw new Error(`Failed to create agreement: ${errorMessage}`)
  }
}

export async function signAgreementAction(agreementId: string, signatureUrl: string, customerName: string, signatureBase64?: string) {
  console.log("[v0] signAgreementAction called for agreement:", agreementId)

  try {
    // Authorization check - verify user owns this agreement
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify agreement belongs to this user
    const agreement = await db.getAgreementById(agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found" }
    }

    // Get booking to verify ownership
    const booking = await db.getBookingById(agreement.bookingId)
    if (!booking) {
      return { success: false, error: "Booking not found" }
    }

    // Check ownership
    const isOwner =
      booking.userId === user.id ||
      booking.customerEmail?.toLowerCase() === user.email?.toLowerCase() ||
      agreement.customerId === user.id

    if (!isOwner) {
      console.error("[v0] Authorization failed - User:", user.id, "Booking user:", booking.userId, "Agreement customer:", agreement.customerId)
      return { success: false, error: "Access denied - You can only sign your own agreements" }
    }

    // Save signature (with base64 if provided)
    const success = await db.updateAgreementSignature(agreementId, signatureUrl, customerName, signatureBase64)

    if (success) {
      // Update agreement status will be set to "signed" when PDF is generated
      // Update booking status to On Rent
      if (agreement) {
        await db.updateBookingStatus(agreement.bookingId, "On Rent")
      }
    }

    return { success }
  } catch (error) {
    console.error("[v0] signAgreementAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getAgreementsByBookingAction(bookingId: string) {
  console.log("[v0] getAgreementsByBookingAction called for booking:", bookingId)

  try {
    const agreements = await db.getAgreementsByBooking(bookingId)
    return agreements || []
  } catch (error) {
    console.error("[v0] getAgreementsByBookingAction error:", error)
    return []
  }
}

export async function getAgreementByIdAction(agreementId: string) {
  console.log("[v0] getAgreementByIdAction called for agreement:", agreementId)

  try {
    const agreement = await db.getAgreementById(agreementId)
    return agreement
  } catch (error) {
    console.error("[v0] getAgreementByIdAction error:", error)
    return null
  }
}

export async function sendAgreementToCustomerAction(agreementId: string) {
  console.log("[v0] sendAgreementToCustomerAction called for agreement:", agreementId)

  try {
    const agreement = await db.getAgreementById(agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found" }
    }

    const booking = await db.getBookingById(agreement.bookingId)
    if (!booking || !booking.customerEmail) {
      return { success: false, error: "Booking or customer email not found" }
    }

    const result = await sendAgreementEmail(agreementId, booking.customerEmail)
    return result
  } catch (error) {
    console.error("[v0] sendAgreementToCustomerAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getAgreements() {
  console.log("[v0] getAgreements called")

  try {
    const agreements = await db.getAllAgreements()
    return agreements || []
  } catch (error) {
    console.error("[v0] getAgreements error:", error)
    return []
  }
}

export async function getAgreementsByVehicleId(vehicleId: string) {
  console.log("[v0] getAgreementsByVehicleId called for vehicle:", vehicleId)

  try {
    const agreements = await db.getAgreementsByVehicle(vehicleId)
    return agreements || []
  } catch (error) {
    console.error("[v0] getAgreementsByVehicleId error:", error)
    return []
  }
}

export async function updateAgreementAction(
  agreementId: string,
  updates: {
    terms?: string
    vehicle_photos?: string[]
    status?: string
    signature_url?: string
    fuel_level?: string
    odometer_reading?: number
  },
) {
  console.log("[v0] updateAgreementAction called for agreement:", agreementId)

  try {
    const agreement = await db.getAgreementById(agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found" }
    }

    // Update the agreement with provided fields
    const updatedAgreement = await db.updateAgreement(agreementId, updates)

    console.log("[v0] Agreement updated successfully")
    return { success: true, agreement: updatedAgreement }
  } catch (error) {
    console.error("[v0] updateAgreementAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
