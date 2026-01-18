"use server"

import { createClient } from "@supabase/supabase-js"
import { db } from "@/lib/database"

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

export async function createInspectionAction(data: {
  agreementId: string
  bookingId: string
  vehicleId: string
  inspectionType: "handover" | "return"
  odometerReading: number
  fuelLevel: "full" | "3/4" | "1/2" | "1/4" | "empty"
  exteriorPhotos: string[]
  interiorPhotos: string[]
  damagePhotos: string[]
  videoUrls: string[]
  damageNotes?: string
  overallCondition: "excellent" | "good" | "fair" | "poor"
  inspectedBy?: string
}) {
  console.log("[Inspections Action] createInspectionAction called with:", {
    agreementId: data.agreementId,
    bookingId: data.bookingId,
    vehicleId: data.vehicleId,
    inspectionType: data.inspectionType,
    odometerReading: data.odometerReading,
    exteriorPhotos: data.exteriorPhotos.length,
    interiorPhotos: data.interiorPhotos.length,
  })

  try {
    const inspection = await db.createVehicleInspection({
      ...data,
      inspectedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (!inspection) {
      console.error("[Inspections Action] Inspection creation returned null")
      return { success: false, error: "Failed to create inspection: No data returned from database" }
    }

    console.log("[Inspections Action] Inspection created successfully:", inspection.id)
    return { success: true, inspection }
  } catch (error) {
    console.error("[Inspections Action] createInspectionAction error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}

export async function getInspectionsByAgreementAction(agreementId: string) {
  console.log("[v0] getInspectionsByAgreementAction called for agreement:", agreementId)

  try {
    const inspections = await db.getInspectionsByAgreement(agreementId)
    return inspections || []
  } catch (error) {
    console.error("[v0] getInspectionsByAgreementAction error:", error)
    return []
  }
}

export async function getInspectionsByBookingAction(bookingId: string) {
  console.log("[v0] getInspectionsByBookingAction called for booking:", bookingId)

  try {
    const inspections = await db.getInspectionsByBooking(bookingId)
    return inspections || []
  } catch (error) {
    console.error("[v0] getInspectionsByBookingAction error:", error)
    return []
  }
}

export async function getInspectionByIdAction(inspectionId: string) {
  console.log("[v0] getInspectionByIdAction called for inspection:", inspectionId)

  try {
    const inspection = await db.getInspectionById(inspectionId)
    return inspection
  } catch (error) {
    console.error("[v0] getInspectionByIdAction error:", error)
    return null
  }
}

export async function getInspectionsStatusForBookingsAction(bookingIds: string[]) {
  if (!bookingIds.length) return {}

  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from("vehicle_inspections")
      .select("booking_id, inspection_type")
      .in("booking_id", bookingIds)

    if (error) throw error

    // Group by booking_id
    const statusMap: Record<string, { hasHandover: boolean, hasReturn: boolean }> = {}

    // Initialize
    bookingIds.forEach(id => {
      statusMap[id] = { hasHandover: false, hasReturn: false }
    })

    data?.forEach((row: any) => {
      if (!statusMap[row.booking_id]) return
      if (row.inspection_type === "handover") statusMap[row.booking_id].hasHandover = true
      if (row.inspection_type === "return") statusMap[row.booking_id].hasReturn = true
    })

    return statusMap
  } catch (error) {
    console.error("Error fetching inspection statuses:", error)
    return {}
  }
}

export async function getInspectionsByVehicleId(vehicleId: string) {
  console.log("[v0] getInspectionsByVehicleId called for vehicle:", vehicleId)

  try {
    const inspections = await db.getInspectionsByVehicle(vehicleId)
    return inspections || []
  } catch (error) {
    console.error("[v0] getInspectionsByVehicleId error:", error)
    return []
  }
}
