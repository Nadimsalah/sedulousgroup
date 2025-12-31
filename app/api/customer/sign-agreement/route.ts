import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { agreementId, signatureUrl, customerName } = await request.json()

    if (!agreementId || !signatureUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify this agreement belongs to the user
    const { data: agreement, error: agreementError } = await supabase
      .from("agreements")
      .select("*, bookings!inner(*)")
      .eq("id", agreementId)
      .single()

    if (agreementError || !agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    // @ts-ignore - Type checking issue with nested joins
    if (agreement.bookings.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update agreement with signature
    const { error: updateError } = await supabase
      .from("agreements")
      .update({
        customer_signature_data: signatureUrl,
        signed_agreement_url: signatureUrl,
        signed_at: new Date().toISOString(),
        status: "signed",
      })
      .eq("id", agreementId)

    if (updateError) {
      console.error("[v0] Error updating agreement:", updateError)
      return NextResponse.json({ error: "Failed to sign agreement" }, { status: 500 })
    }

    // Update booking status
    const { data: bookings } = await supabase.from("bookings").select("id").eq("id", agreement.booking_id)

    if (bookings && bookings.length > 0) {
      await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookings[0].id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error signing agreement:", error)
    return NextResponse.json({ error: "Failed to sign agreement" }, { status: 500 })
  }
}
