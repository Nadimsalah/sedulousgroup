"use server"

import { db } from "@/lib/database"

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
  console.log("[v0] createInspectionAction called")

  try {
    const inspection = await db.createVehicleInspection({
      ...data,
      inspectedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    console.log("[v0] Inspection created:", inspection)
    return { success: true, inspection }
  } catch (error) {
    console.error("[v0] createInspectionAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
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
