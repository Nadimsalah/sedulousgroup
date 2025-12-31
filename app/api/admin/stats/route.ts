import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    // Check if user is admin (you can add role check here)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })

    if (bookingsError) {
      console.error("[v0] Error fetching bookings:", bookingsError)
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }

    const { count: carsCount, error: carsError } = await supabase
      .from("cars")
      .select("*", { count: "exact", head: true })

    if (carsError) {
      console.error("[v0] Error fetching cars count:", carsError)
    }

    const { count: customersCount, error: customersError } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })

    if (customersError) {
      console.error("[v0] Error fetching customers count:", customersError)
    }

    // Calculate stats
    const now = new Date()
    const stats = {
      totalBookings: bookings?.length || 0,
      pending:
        bookings?.filter(
          (b: any) => b.status === "Pending" || b.status === "Pending Details" || b.status === "Pending Review",
        ).length || 0,
      approved: bookings?.filter((b: any) => b.status === "Confirmed").length || 0,
      onRent: bookings?.filter((b: any) => b.status === "On Rent").length || 0,
      overdue:
        bookings?.filter((b: any) => {
          if (b.status !== "On Rent") return false
          return new Date(b.dropoff_date) < now
        }).length || 0,
      completed: bookings?.filter((b: any) => b.status === "Completed").length || 0,
      rejected: bookings?.filter((b: any) => b.status === "Cancelled" || b.status === "Rejected").length || 0,
      totalCars: carsCount || 0,
      totalCustomers: customersCount || 0,
    }

    const events = (bookings || []).map((booking: any) => {
      let color = "#3b82f6" // blue for default

      if (booking.status === "Pending" || booking.status === "Pending Details")
        color = "#fbbf24" // yellow
      else if (booking.status === "Confirmed")
        color = "#3b82f6" // blue
      else if (booking.status === "On Rent")
        color = "#22c55e" // green
      else if (booking.status === "Completed")
        color = "#9ca3af" // grey
      else if (booking.status === "Cancelled") color = "#ef4444" // red

      if (booking.status === "On Rent" && new Date(booking.dropoff_date) < now) {
        color = "#dc2626" // dark red for overdue
      }

      return {
        id: booking.id,
        title: booking.customer_name || "Booking",
        start: booking.pickup_date,
        end: booking.dropoff_date,
        resource: {
          id: booking.id,
          carId: booking.car_id,
          customerName: booking.customer_name,
          status: booking.status,
          color,
        },
      }
    })

    return NextResponse.json({ stats, events })
  } catch (error) {
    console.error("[v0] Error in admin stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
