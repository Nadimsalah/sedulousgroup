import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { bookingId: string } }) {
  try {
    const { bookingId } = params

    console.log("[v0] Admin API: Fetching booking:", bookingId)

    // Use admin client to bypass RLS
    const supabase = await createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "Admin access not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
        { status: 500 },
      )
    }

    // Fetch booking with car details using admin privileges
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        cars (
          id,
          name,
          brand,
          category,
          brand,
          category,
          image,
          registration_number
        )
      `)
      .eq("id", bookingId)
      .single()

    if (error) {
      console.error("[v0] Admin API: Error fetching booking:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!booking) {
      console.error("[v0] Admin API: Booking not found:", bookingId)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    console.log("[v0] Admin API: Booking found:", booking.id)
    return NextResponse.json({ booking }, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Admin API: Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { bookingId: string } }) {
  try {
    const { bookingId } = params
    const body = await request.json()

    console.log("[v0] Admin API: Updating booking:", bookingId, body)

    // Use admin client to bypass RLS
    const supabase = await createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "Admin access not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
        { status: 500 },
      )
    }

    // Update booking using admin privileges
    const { data: booking, error } = await supabase.from("bookings").update(body).eq("id", bookingId).select().single()

    if (error) {
      console.error("[v0] Admin API: Error updating booking:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Admin API: Booking updated successfully:", booking.id)
    return NextResponse.json({ booking }, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Admin API: Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
