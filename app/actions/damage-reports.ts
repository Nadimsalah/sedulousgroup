"use server"

import { createClient } from "@/lib/supabase/server"
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
    const supabase = await createClient()

    const { data: report, error } = await supabase
      .from("damage_reports")
      .insert({
        agreement_id: data.agreementId,
        booking_id: data.bookingId,
        vehicle_id: data.vehicleId,
        customer_id: data.customerId,
        damage_type: data.damageType,
        severity: data.severity,
        description: data.description,
        location_on_vehicle: data.locationOnVehicle,
        incident_date: data.incidentDate,
        reported_date: new Date().toISOString(),
        damage_photos: data.damagePhotos,
        damage_videos: data.damageVideos,
        estimated_cost: data.estimatedCost,
        repair_status: "pending",
        responsible_party: data.responsibleParty,
        notes: data.notes,
        reported_by: data.reportedBy,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, report }
  } catch (error) {
    console.error("[v0] Error creating damage report:", error)
    return { success: false, error }
  }
}

export async function getDamageReports(): Promise<DamageReport[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("damage_reports")
      .select("*")
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
    console.error("[v0] Error getting damage reports:", error)
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
    const supabase = await createClient()

    const updateData: any = {}
    if (updates.repairStatus) updateData.repair_status = updates.repairStatus
    if (updates.actualCost !== undefined) updateData.actual_cost = updates.actualCost
    if (updates.repairedBy) updateData.repaired_by = updates.repairedBy
    if (updates.insuranceClaimNumber) updateData.insurance_claim_number = updates.insuranceClaimNumber
    if (updates.repairStatus === "completed") updateData.repaired_at = new Date().toISOString()

    const { error } = await supabase.from("damage_reports").update(updateData).eq("id", reportId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating damage report:", error)
    return { success: false, error }
  }
}
