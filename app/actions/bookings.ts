"use server"

import { createClient } from "@supabase/supabase-js"

// Create admin client with service role to bypass RLS
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

export interface BookingWithDetails {
  id: string
  car_id: string
  user_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  pickup_date: string
  dropoff_date: string
  pickup_time: string
  dropoff_time: string
  pickup_location: string
  dropoff_location: string
  total_amount: number
  status: string
  booking_type: string
  created_at: string
  car_name: string | null
  car_brand: string | null
  car_image: string | null
  car_rental_type: string | null
}

export async function getAllBookingsAction(): Promise<{
  success: boolean
  data: BookingWithDetails[]
  error?: string
}> {
  try {
    const supabase = createAdminSupabase()

    // Fetch all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })

    if (bookingsError) {
      return { success: false, data: [], error: bookingsError.message }
    }

    if (!bookings || bookings.length === 0) {
      return { success: true, data: [] }
    }

    // Get unique car IDs
    const carIds = [...new Set(bookings.map((b) => b.car_id).filter(Boolean))]

    // Fetch cars
    let carsMap: Record<string, any> = {}
    if (carIds.length > 0) {
      const { data: cars } = await supabase.from("cars").select("id, name, brand, image, rental_type").in("id", carIds)

      if (cars) {
        carsMap = Object.fromEntries(cars.map((c) => [c.id, c]))
      }
    }

    // Combine data
    const result: BookingWithDetails[] = bookings.map((booking) => {
      const car = carsMap[booking.car_id]
      return {
        id: booking.id,
        car_id: booking.car_id,
        user_id: booking.user_id,
        customer_name: booking.customer_name || "",
        customer_email: booking.customer_email || "",
        customer_phone: booking.customer_phone || "",
        pickup_date: booking.pickup_date,
        dropoff_date: booking.dropoff_date,
        pickup_time: booking.pickup_time || "",
        dropoff_time: booking.dropoff_time || "",
        pickup_location: booking.pickup_location || "",
        dropoff_location: booking.dropoff_location || "",
        total_amount: Number(booking.total_amount) || 0,
        status: booking.status || "Pending",
        booking_type: booking.booking_type || "",
        created_at: booking.created_at,
        car_name: car?.name || null,
        car_brand: car?.brand || null,
        car_image: car?.image || null,
        car_rental_type: car?.rental_type || null,
      }
    })

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function updateBookingStatusAction(
  bookingId: string,
  newStatus: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminSupabase()

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", bookingId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
