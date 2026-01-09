"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/database"
import type { DamageReport } from "@/lib/database"

export async function createDamageReport(data: {
  agreementId?: string
  bookingId?: string
  vehicleId: string
  customerId?: string
  damageType: string
  severity: string
  description: string
  locationOnVehicle?: string
  incidentDate: string
  damagePhotos: string[]
  damageVideos: string[]
  estimatedCost?: number
  responsibleParty?: string
  notes?: string
  reportedBy?: string
}) {
  try {
    console.log("[Damage Reports] Creating damage report with data:", {
      vehicleId: data.vehicleId,
      damageType: data.damageType,
      severity: data.severity,
      description: data.description?.substring(0, 50),
      photosCount: data.damagePhotos?.length || 0,
    })

    // Use database method which uses admin client
    const report = await db.createDamageReport({
      agreementId: data.agreementId || undefined,
      bookingId: data.bookingId || undefined,
      vehicleId: data.vehicleId,
      customerId: data.customerId || undefined,
      damageType: data.damageType,
        severity: data.severity,
        description: data.description,
      locationOnVehicle: data.locationOnVehicle || undefined,
      incidentDate: data.incidentDate,
      reportedDate: new Date().toISOString(),
      damagePhotos: data.damagePhotos || [],
      damageVideos: data.damageVideos || [],
      estimatedCost: data.estimatedCost || undefined,
      repairStatus: "pending",
      responsibleParty: data.responsibleParty || undefined,
      notes: data.notes || undefined,
      reportedBy: data.reportedBy || undefined,
      })

    if (!report) {
      console.error("[Damage Reports] Failed to create damage report - no data returned")
      return { success: false, error: "Failed to create damage report: No data returned from database" }
    }

    console.log("[Damage Reports] Damage report created successfully:", report.id)
    return { success: true, report }
  } catch (error) {
    console.error("[Damage Reports] Error creating damage report:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}

export async function getDamageReports(): Promise<DamageReport[]> {
  try {
    // Use admin client to bypass RLS and see all reports
    const supabase = await createAdminClient()
    if (!supabase) {
      console.error("[Damage Reports] No admin client available")
      return []
    }

    console.log("[Damage Reports] Fetching all damage reports...")

    const { data, error } = await supabase
      .from("damage_reports")
      .select("*")
      .order("reported_date", { ascending: false })

    if (error) {
      console.error("[Damage Reports] Error fetching damage reports:", error)
      throw error
    }

    console.log(`[Damage Reports] Found ${data?.length || 0} damage reports`)

    return (data || []).map((report) => ({
      id: report.id,
      agreementId: report.agreement_id,
      bookingId: report.booking_id,
      vehicleId: report.vehicle_id,
      customerId: report.customer_id,
      damageType: report.damage_type,
      severity: report.severity,
      description: report.description,
      locationOnVehicle: report.location_on_vehicle,
      incidentDate: report.incident_date,
      reportedDate: report.reported_date,
      damagePhotos: report.damage_photos || [],
      damageVideos: report.damage_videos || [],
      estimatedCost: report.estimated_cost,
      actualCost: report.actual_cost,
      repairStatus: report.repair_status,
      repairedBy: report.repaired_by,
      repairedAt: report.repaired_at,
      responsibleParty: report.responsible_party,
      insuranceClaimNumber: report.insurance_claim_number,
      notes: report.notes,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      reportedBy: report.reported_by,
    }))
  } catch (error) {
    console.error("[Damage Reports] Error getting damage reports:", error)
    return []
  }
}

export async function getDamageReportsByVehicle(vehicleId: string): Promise<DamageReport[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("damage_reports")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("reported_date", { ascending: false })

    if (error) throw error

    return (data || []).map((report) => ({
      id: report.id,
      agreementId: report.agreement_id,
      bookingId: report.booking_id,
      vehicleId: report.vehicle_id,
      customerId: report.customer_id,
      damageType: report.damage_type,
      severity: report.severity,
      description: report.description,
      locationOnVehicle: report.location_on_vehicle,
      incidentDate: report.incident_date,
      reportedDate: report.reported_date,
      damagePhotos: report.damage_photos || [],
      damageVideos: report.damage_videos || [],
      estimatedCost: report.estimated_cost,
      actualCost: report.actual_cost,
      repairStatus: report.repair_status,
      repairedBy: report.repaired_by,
      repairedAt: report.repaired_at,
      responsibleParty: report.responsible_party,
      insuranceClaimNumber: report.insurance_claim_number,
      notes: report.notes,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      reportedBy: report.reported_by,
    }))
  } catch (error) {
    console.error("[v0] Error getting damage reports by vehicle:", error)
    return []
  }
}

export async function updateDamageReportStatus(
  reportId: string,
  updates: {
    repairStatus?: string
    actualCost?: number
    repairedBy?: string
    insuranceClaimNumber?: string
  },
) {
  try {
    // Use admin client to bypass RLS
    const supabase = await createAdminClient()
    if (!supabase) {
      console.error("[Damage Reports] No admin client available for updating status")
      return { success: false, error: "No admin client available" }
    }

    console.log("[Damage Reports] Updating damage report:", reportId, updates)

    const updateData: any = {}
    if (updates.repairStatus) updateData.repair_status = updates.repairStatus
    if (updates.actualCost !== undefined) updateData.actual_cost = updates.actualCost
    if (updates.repairedBy) updateData.repaired_by = updates.repairedBy
    if (updates.insuranceClaimNumber) updateData.insurance_claim_number = updates.insuranceClaimNumber
    if (updates.repairStatus === "completed") {
      updateData.repaired_at = new Date().toISOString()
    }

    const { error } = await supabase.from("damage_reports").update(updateData).eq("id", reportId)

    if (error) {
      console.error("[Damage Reports] Error updating damage report:", error)
      throw error
    }

    console.log("[Damage Reports] Damage report updated successfully")
    return { success: true }
  } catch (error) {
    console.error("[Damage Reports] Error updating damage report:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}
