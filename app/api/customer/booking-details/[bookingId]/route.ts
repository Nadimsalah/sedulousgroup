import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { bookingId: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth check - user:", user?.email, "error:", authError?.message)

    if (authError || !user) {
      console.log("[v0] Auth failed, returning 401")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bookingId = params.bookingId
    console.log("[v0] Fetching booking ID:", bookingId, "for user:", user.email)

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle()

    console.log("[v0] Booking query - found:", !!booking, "error:", bookingError?.message)

    if (bookingError) {
      console.error("[v0] Booking query error:", bookingError.message)
      return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 })
    }

    if (!booking) {
      console.log("[v0] Booking not found:", bookingId)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.customer_email?.toLowerCase() !== user.email?.toLowerCase()) {
      console.log("[v0] Unauthorized - booking email:", booking.customer_email, "user email:", user.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: car } = await supabase.from("cars").select("*").eq("id", booking.car_id).maybeSingle()

    // Fetch agreement
    const { data: agreement } = await supabase
      .from("agreements")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .maybeSingle()

    console.log("[v0] Agreement found:", !!agreement)

    // Fetch inspection
    const { data: inspection } = await supabase
      .from("vehicle_inspections")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("inspection_type", "pickup")
      .order("created_at", { ascending: false })
      .maybeSingle()

    console.log("[v0] Inspection found:", !!inspection)

    return NextResponse.json({
      booking: { ...booking, car },
      agreement: agreement || null,
      inspection: inspection || null,
    })
  } catch (error: any) {
    console.error("[v0] Error in booking details API:", error.message)
    return NextResponse.json({ error: "Failed to fetch booking details" }, { status: 500 })
  }
}
