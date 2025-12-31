import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { agreementId, signatureUrl, customerName } = await request.json()

    if (!agreementId || !signatureUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await db.updateAgreementSignature(agreementId, signatureUrl, customerName)

    if (success) {
      // Update agreement status to signed
      await db.updateAgreementStatus(agreementId, "signed")

      // Update booking status to On Rent
      const agreement = await db.getAgreementById(agreementId)
      if (agreement) {
        await db.updateBookingStatus(agreement.bookingId, "On Rent")
      }

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to sign agreement" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Error signing agreement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
