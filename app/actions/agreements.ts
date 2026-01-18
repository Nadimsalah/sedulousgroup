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

    // Check ownership - be more lenient to handle various booking scenarios
    const isOwner =
      booking.userId === user.id ||
      booking.user_id === user.id ||
      booking.customerEmail?.toLowerCase() === user.email?.toLowerCase() ||
      booking.customer_email?.toLowerCase() === user.email?.toLowerCase() ||
      agreement.customerId === user.id ||
      agreement.customer_id === user.id ||
      // If no user ID is set on booking, allow if email matches
      (!booking.userId && !booking.user_id && booking.customerEmail?.toLowerCase() === user.email?.toLowerCase()) ||
      (!booking.userId && !booking.user_id && booking.customer_email?.toLowerCase() === user.email?.toLowerCase())

    if (!isOwner) {
      console.error("[v0] Authorization failed - User:", user.id, "Email:", user.email, "Booking user:", booking.userId || booking.user_id, "Booking email:", booking.customerEmail || booking.customer_email, "Agreement customer:", agreement.customerId || agreement.customer_id)
      return { success: false, error: "Access denied - You can only sign your own agreements. Please ensure you're logged in with the email associated with this booking." }
    }

    // Save signature (with base64 if provided)
    const success = await db.updateAgreementSignature(agreementId, signatureUrl, customerName, signatureBase64)

    if (!success) {
      console.error("[v0] Failed to update agreement signature")
      return { success: false, error: "Failed to save signature. Please try again." }
    }

    // Update agreement status will be set to "signed" when PDF is generated
    // Update booking status to On Rent
    try {
      if (agreement) {
        await db.updateBookingStatus(agreement.bookingId, "On Rent")
      }
    } catch (error) {
      console.error("[v0] Failed to update booking status:", error)
      // Don't fail the whole operation if booking status update fails
    }

    return { success: true }
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
    vehicle_registration?: string
  },
) {
  console.log("[v0] updateAgreementAction called for agreement:", agreementId)
  console.log("[v0] Updates:", {
    ...updates,
    vehicle_photos: updates.vehicle_photos?.length ? `${updates.vehicle_photos.length} photos` : undefined
  })

  try {
    const agreement = await db.getAgreementById(agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found" }
    }

    // Update the agreement with provided fields
    const dbUpdates: any = {
      ...updates,
    }

    // Map snake_case from action input to camelCase for database helper if needed, 
    // OR map directly to DB columns if database helper handles it.
    // `db.updateAgreement` handles: status, signedAgreementUrl, customerSignatureData, signedAt, sentToCustomerAt, mediaUrls, fuelLevel, odometerReading, vehiclePhotos, terms, vehicleRegistration.
    // It checks `updates.vehicleRegistration` etc.

    const mappedUpdates: any = {}
    if (updates.status) mappedUpdates.status = updates.status
    if (updates.terms) mappedUpdates.terms = updates.terms
    if (updates.signature_url) mappedUpdates.signedAgreementUrl = updates.signature_url // This might be wrong mapping? signed_agreement_url vs signature_url?
    // `updateAgreementAction` has `signature_url`. `db.updateAgreement` has `signedAgreementUrl` -> `signed_agreement_url` AND `customerSignatureData` -> `customer_signature_data`.
    // Wait, `signature_url` in action probably refers to the signed PDF url?

    if (updates.fuel_level) mappedUpdates.fuelLevel = updates.fuel_level
    if (updates.odometer_reading !== undefined) mappedUpdates.odometerReading = updates.odometer_reading
    if (updates.vehicle_registration) mappedUpdates.vehicleRegistration = updates.vehicle_registration
    if (updates.vehicle_photos) mappedUpdates.vehiclePhotos = updates.vehicle_photos

    const updatedAgreement = await db.updateAgreement(agreementId, mappedUpdates)

    console.log("[v0] Agreement updated successfully")
    if (updates.vehicle_photos) {
      console.log("[v0] Vehicle photos saved:", updates.vehicle_photos.length)
    }
    return { success: true, agreement: updatedAgreement }
  } catch (error) {
    console.error("[v0] updateAgreementAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Upload vehicle photos to storage and save URLs to agreement
 * Called from admin agreement creation flow
 */
export async function uploadVehiclePhotosAction(agreementId: string, photoUrls: string[]) {
  console.log("[v0] uploadVehiclePhotosAction called for agreement:", agreementId, "with", photoUrls.length, "photos")

  try {
    const agreement = await db.getAgreementById(agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found" }
    }

    // Save photo URLs to agreement
    const updatedAgreement = await db.updateAgreement(agreementId, {
      vehiclePhotos: photoUrls,
    })

    if (!updatedAgreement) {
      return { success: false, error: "Failed to save photos to agreement" }
    }

    console.log("[v0] Vehicle photos saved successfully:", photoUrls.length)
    return { success: true, photoUrls }
  } catch (error) {
    console.error("[v0] uploadVehiclePhotosAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Get vehicle photo URLs for an agreement
 * Returns public URLs or generates signed URLs if needed
 */
export async function getVehiclePhotoUrlsAction(agreementId: string) {
  console.log("[v0] getVehiclePhotoUrlsAction called for agreement:", agreementId)

  try {
    const agreement = await db.getAgreementById(agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found", photoUrls: [] }
    }

    // Get vehicle photos from agreement
    const photoUrls = agreement.vehiclePhotos || []

    console.log("[v0] Retrieved", photoUrls.length, "vehicle photos for agreement:", agreementId)

    // Photos are already public URLs (uploaded via Vercel Blob or Supabase public bucket)
    // If using private bucket, we would generate signed URLs here:
    // const signedUrls = await Promise.all(photoUrls.map(async (url) => {
    //   if (url.includes('supabase')) {
    //     const { createAdminClient } = await import("@/lib/supabase/server")
    //     const supabase = await createAdminClient()
    //     const { data } = await supabase.storage.from('rental-contracts').createSignedUrl(path, 3600)
    //     return data?.signedUrl || url
    //   }
    //   return url
    // }))

    return { success: true, photoUrls }
  } catch (error) {
    console.error("[v0] getVehiclePhotoUrlsAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", photoUrls: [] }
  }
}

/**
 * Get agreement with vehicle photos for client signature page
 * Includes authorization check to ensure user owns the agreement
 */
export async function getAgreementWithPhotosAction(agreementId: string) {
  console.log("[v0] getAgreementWithPhotosAction called for agreement:", agreementId)

  try {
    // Authorization check
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated", agreement: null }
    }

    // Get agreement
    const agreement = await db.getAgreementById(agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found", agreement: null }
    }

    // Get booking to verify ownership
    const booking = await db.getBookingById(agreement.bookingId)
    if (!booking) {
      return { success: false, error: "Booking not found", agreement: null }
    }

    // Check ownership
    const isOwner =
      booking.userId === user.id ||
      (booking as any).user_id === user.id ||
      booking.customerEmail?.toLowerCase() === user.email?.toLowerCase() ||
      (booking as any).customer_email?.toLowerCase() === user.email?.toLowerCase()

    if (!isOwner) {
      console.error("[v0] Authorization failed for getAgreementWithPhotosAction")
      return { success: false, error: "Access denied", agreement: null }
    }

    // Return agreement with photos
    return {
      success: true,
      agreement: {
        ...agreement,
        vehiclePhotos: agreement.vehiclePhotos || [],
      }
    }
  } catch (error) {
    console.error("[v0] getAgreementWithPhotosAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", agreement: null }
  }
}
