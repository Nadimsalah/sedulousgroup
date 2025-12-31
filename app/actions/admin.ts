"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function getAdminStats() {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Fetch all bookings
    const { data: bookings, error: bookingsError } = await supabase.from("bookings").select("*")

    if (bookingsError) {
      console.error("[v0] Error fetching bookings:", bookingsError)
    }

    // Fetch all cars
    const { data: cars, error: carsError } = await supabase.from("cars").select("*")

    if (carsError) {
      console.error("[v0] Error fetching cars:", carsError)
    }

    // Fetch all user profiles
    const { data: profiles, error: profilesError } = await supabase.from("user_profiles").select("*")

    if (profilesError) {
      console.error("[v0] Error fetching profiles:", profilesError)
    }

    // Calculate stats with case-insensitive matching
    const totalBookings = bookings?.length || 0
    const pendingBookings =
      bookings?.filter((b: any) => (b.status || "").toLowerCase() === "pending").length || 0
    const activeBookings =
      bookings?.filter((b: any) => {
        const status = (b.status || "").toLowerCase()
        return ["active", "approved", "confirmed"].includes(status)
      }).length || 0
    const totalCustomers = profiles?.length || 0

    console.log(
      "[v0] Admin stats loaded - Total: ",
      totalBookings,
      "Pending:",
      pendingBookings,
      "Active:",
      activeBookings,
      "Customers:",
      totalCustomers,
    )

    return {
      bookings: bookings || [],
      cars: cars || [],
      profiles: profiles || [],
      stats: {
        totalBookings,
        pendingBookings,
        activeBookings,
        totalCustomers,
      },
    }
  } catch (error) {
    console.error("[v0] Error in getAdminStats:", error)
    return {
      bookings: [],
      cars: [],
      profiles: [],
      stats: {
        totalBookings: 0,
        pendingBookings: 0,
        activeBookings: 0,
        totalCustomers: 0,
      },
    }
  }
}

export async function getAllBookings() {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })

    if (bookingsError) {
      console.error("[v0] Error fetching bookings:", bookingsError)
      return []
    }

    if (!bookings || bookings.length === 0) {
      return []
    }

    const carIds = [...new Set(bookings.map((b) => b.car_id).filter(Boolean))]
    const userIds = [...new Set(bookings.map((b) => b.user_id).filter(Boolean))]

    let cars: any[] = []
    let users: any[] = []

    if (carIds.length > 0) {
      const { data: carsData } = await supabase.from("cars").select("*").in("id", carIds)
      cars = carsData || []
    }

    if (userIds.length > 0) {
      const { data: usersData } = await supabase.from("user_profiles").select("*").in("id", userIds)
      users = usersData || []
    }

    const enrichedBookings = bookings.map((booking: any) => ({
      ...booking,
      car: cars.find((c) => c.id === booking.car_id) || null,
      user: users.find((u) => u.id === booking.user_id) || null,
    }))

    console.log("[v0] Loaded ", enrichedBookings.length, " bookings")

    return enrichedBookings
  } catch (error) {
    console.error("[v0] Error in getAllBookings:", error)
    return []
  }
}
