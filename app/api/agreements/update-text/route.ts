import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { agreementId, agreementText } = await request.json()

    if (!agreementId || !agreementText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("agreements")
      .update({
        agreement_text: agreementText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agreementId)

    if (error) {
      console.error("[v0] Error updating agreement text:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in update-text route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
