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

    // Calculate profit statistics
    const now = new Date()
    
    // Today: start of today (00:00:00) to end of today (23:59:59)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    
    // Yesterday: start of yesterday to end of yesterday
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
    
    // This week: start of week (Sunday) to now
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    // This month: start of current month to now
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

    // Helper function to check if booking is completed/paid
    const isPaidBooking = (booking: any) => {
      const status = (booking.status || "").toLowerCase()
      return ["completed", "active", "approved", "confirmed", "on rent"].includes(status) ||
             booking.stripe_payment_intent_id ||
             booking.stripe_session_id
    }

    // Helper function to get booking amount
    const getBookingAmount = (booking: any) => {
      return parseFloat(booking.total_amount) || 0
    }

    // Helper function to check if date is in range (inclusive)
    const isDateInRange = (date: Date | string, start: Date, end: Date) => {
      const bookingDate = new Date(date)
      return bookingDate >= start && bookingDate <= end
    }

    // Helper function to check if date is on or after start
    const isDateOnOrAfter = (date: Date | string, start: Date) => {
      const bookingDate = new Date(date)
      return bookingDate >= start
    }

    // Calculate profits
    const allProfit = (bookings || [])
      .filter(isPaidBooking)
      .reduce((sum, b) => sum + getBookingAmount(b), 0)

    const todayProfit = (bookings || [])
      .filter((b) => {
        if (!isPaidBooking(b)) return false
        // Check both created_at and updated_at to catch bookings updated today
        const createdDate = b.created_at ? new Date(b.created_at) : null
        const updatedDate = b.updated_at ? new Date(b.updated_at) : null
        
        if (createdDate && isDateInRange(createdDate, todayStart, todayEnd)) return true
        if (updatedDate && isDateInRange(updatedDate, todayStart, todayEnd)) return true
        return false
      })
      .reduce((sum, b) => sum + getBookingAmount(b), 0)

    const yesterdayProfit = (bookings || [])
      .filter((b) => {
        if (!isPaidBooking(b)) return false
        const createdDate = b.created_at ? new Date(b.created_at) : null
        const updatedDate = b.updated_at ? new Date(b.updated_at) : null
        
        if (createdDate && isDateInRange(createdDate, yesterdayStart, yesterdayEnd)) return true
        if (updatedDate && isDateInRange(updatedDate, yesterdayStart, yesterdayEnd)) return true
        return false
      })
      .reduce((sum, b) => sum + getBookingAmount(b), 0)

    const weekProfit = (bookings || [])
      .filter((b) => {
        if (!isPaidBooking(b)) return false
        const createdDate = b.created_at ? new Date(b.created_at) : null
        const updatedDate = b.updated_at ? new Date(b.updated_at) : null
        
        if (createdDate && isDateOnOrAfter(createdDate, weekStart)) return true
        if (updatedDate && isDateOnOrAfter(updatedDate, weekStart)) return true
        return false
      })
      .reduce((sum, b) => sum + getBookingAmount(b), 0)

    const monthProfit = (bookings || [])
      .filter((b) => {
        if (!isPaidBooking(b)) return false
        const createdDate = b.created_at ? new Date(b.created_at) : null
        const updatedDate = b.updated_at ? new Date(b.updated_at) : null
        
        if (createdDate && isDateOnOrAfter(createdDate, monthStart)) return true
        if (updatedDate && isDateOnOrAfter(updatedDate, monthStart)) return true
        return false
      })
      .reduce((sum, b) => sum + getBookingAmount(b), 0)

    console.log(
      "[v0] Admin stats loaded - Total: ",
      totalBookings,
      "Pending:",
      pendingBookings,
      "Active:",
      activeBookings,
      "Customers:",
      totalCustomers,
      "All Profit:",
      allProfit,
      "Today Profit:",
      todayProfit,
      "Today Range:",
      todayStart.toISOString(),
      "to",
      todayEnd.toISOString(),
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
        profit: {
          all: allProfit,
          today: todayProfit,
          yesterday: yesterdayProfit,
          week: weekProfit,
          month: monthProfit,
        },
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
        profit: {
          all: 0,
          today: 0,
          yesterday: 0,
          week: 0,
          month: 0,
        },
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
