import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { agreementId, fuelLevel, odometerReading } = await request.json()

    if (!agreementId || !fuelLevel || !odometerReading) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await db.updateAgreementVehicleData(agreementId, fuelLevel, odometerReading)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to update vehicle data" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Error updating vehicle data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
