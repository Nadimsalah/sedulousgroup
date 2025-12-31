import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create admin client to bypass RLS
function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      carId,
      customerName,
      customerEmail,
      customerPhone,
      pickupLocation,
      dropoffLocation,
      pickupDate,
      dropoffDate,
      pickupTime,
      dropoffTime,
      totalAmount,
      bookingType,
      userId,
    } = body

    // Validate required fields
    if (!carId) {
      return NextResponse.json({ success: false, error: "Car ID is required" }, { status: 400 })
    }
    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ success: false, error: "Customer information is required" }, { status: 400 })
    }
    if (!pickupDate || !dropoffDate) {
      return NextResponse.json({ success: false, error: "Rental dates are required" }, { status: 400 })
    }

    const supabase = createAdminSupabase()

    // Generate unique booking ID
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed confusing chars like 0,O,1,I
    let shortCode = ""
    for (let i = 0; i < 6; i++) {
      shortCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const bookingId = `SED-${shortCode}`

    // Create booking
    const bookingData = {
      id: bookingId,
      car_id: carId,
      user_id: userId || null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      pickup_location: pickupLocation || "London, UK",
      dropoff_location: dropoffLocation || "London, UK",
      pickup_date: pickupDate,
      dropoff_date: dropoffDate,
      pickup_time: pickupTime || "10:00",
      dropoff_time: dropoffTime || "10:00",
      total_amount: totalAmount || 0,
      status: "Pending Review",
      booking_type: bookingType || "Rent",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("bookings").insert(bookingData).select().single()

    if (error) {
      console.error("[v0] Error creating booking:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: data.id,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        status: data.status,
      },
    })
  } catch (error) {
    console.error("[v0] Exception in booking creation:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
