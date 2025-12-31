import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { agreementId, mediaUrls } = await request.json()

    if (!agreementId || !mediaUrls) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await db.updateAgreementMedia(agreementId, mediaUrls)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to update media" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Error updating agreement media:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
