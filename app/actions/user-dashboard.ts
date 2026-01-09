"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

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

// Get current user from session
async function getCurrentUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Server component
          }
        },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

export interface UserBooking {
  id: string
  car_id: string
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
  // Rejection fields
  rejection_reason?: string
  rejection_notes?: string
  rejected_at?: string
  can_resubmit?: boolean
  // Document URLs for re-upload
  driving_license_front_url?: string
  driving_license_back_url?: string
  proof_of_address_url?: string
  bank_statement_url?: string
  private_hire_license_front_url?: string
  private_hire_license_back_url?: string
  ni_number?: string
}

export interface UserAgreement {
  id: string
  agreement_number: string
  booking_id: string
  vehicle_id: string
  status: string
  agreement_status: string
  start_date: string
  end_date: string
  total_amount: number
  created_at: string
  signed_at: string | null
  car_name: string | null
  car_brand: string | null
}

export interface UserDashboardData {
  user: {
    id: string
    email: string
    full_name: string
    phone: string
    avatar_url: string | null
  }
  bookings: UserBooking[]
  agreements: UserAgreement[]
  stats: {
    totalBookings: number
    activeBookings: number
    totalAgreements: number
    totalSpent: number
  }
}

export async function getUserDashboardData(): Promise<{
  success: boolean
  data: UserDashboardData | null
  error?: string
}> {
  try {
    // Get current user
    const { user: authUser, error: authError } = await getCurrentUser()

    console.log("[v0] getCurrentUser result - error:", authError, "user:", authUser?.id)

    if (authError || !authUser) {
      console.log("[v0] Not authenticated, returning error")
      return { success: false, data: null, error: "Not authenticated" }
    }

    // Use admin client to bypass RLS and get user's data
    const supabase = createAdminSupabase()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", authUser.id)
      .single()

    console.log("[v0] Profile fetch - error:", profileError, "has profile:", !!profile)

    // Get user bookings - try all possible fields and combine results
    let bookings: any[] = []
    const bookingIds = new Set<string>()

    // Strategy 1: Search by user_id
    const { data: bookingsByUserId } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })

    if (bookingsByUserId) {
      bookingsByUserId.forEach((b: any) => {
        if (!bookingIds.has(b.id)) {
          bookings.push(b)
          bookingIds.add(b.id)
        }
      })
      console.log("[v0] Bookings found by user_id:", bookingsByUserId.length)
    }

    // Strategy 2: Search by customer_email
    if (authUser.email) {
      const { data: bookingsByEmail } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_email", authUser.email)
        .order("created_at", { ascending: false })

      if (bookingsByEmail) {
        bookingsByEmail.forEach((b: any) => {
          if (!bookingIds.has(b.id)) {
            bookings.push(b)
            bookingIds.add(b.id)
          }
        })
        console.log("[v0] Bookings found by customer_email:", bookingsByEmail.length)
      }
    }

    // Strategy 3: Search by customer_id
    const { data: bookingsByCustomerId } = await supabase
      .from("bookings")
      .select("*")
      .eq("customer_id", authUser.id)
      .order("created_at", { ascending: false })

    if (bookingsByCustomerId) {
      bookingsByCustomerId.forEach((b: any) => {
        if (!bookingIds.has(b.id)) {
          bookings.push(b)
          bookingIds.add(b.id)
        }
      })
      console.log("[v0] Bookings found by customer_id:", bookingsByCustomerId.length)
    }

    // Sort by created_at descending
    bookings.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })

    console.log("[v0] Final unique bookings count:", bookings.length)

    // Get user agreements - try multiple fields
    let agreements: any[] = []
    const agreementIds = new Set<string>()

    // Strategy 1: Search by customer_id
    const { data: agreementsByCustomerId } = await supabase
      .from("agreements")
      .select("*")
      .eq("customer_id", authUser.id)
      .order("created_at", { ascending: false })

    if (agreementsByCustomerId) {
      agreementsByCustomerId.forEach((a: any) => {
        if (!agreementIds.has(a.id)) {
          agreements.push(a)
          agreementIds.add(a.id)
        }
      })
      console.log("[v0] Agreements found by customer_id:", agreementsByCustomerId.length)
    }

    // Strategy 2: Search by booking_id (get agreements for user's bookings)
    const userBookingIds = bookings.map((b) => b.id)
    if (userBookingIds.length > 0) {
      const { data: agreementsByBookingId } = await supabase
        .from("agreements")
        .select("*")
        .in("booking_id", userBookingIds)
        .order("created_at", { ascending: false })

      if (agreementsByBookingId) {
        agreementsByBookingId.forEach((a: any) => {
          if (!agreementIds.has(a.id)) {
            agreements.push(a)
            agreementIds.add(a.id)
          }
        })
        console.log("[v0] Agreements found by booking_id:", agreementsByBookingId.length)
      }
    }

    // Sort by created_at descending
    agreements.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })

    console.log("[v0] Final unique agreements count:", agreements.length)

    // Get car details for bookings
    const carIds = [...new Set((bookings || []).map((b) => b.car_id).filter(Boolean))]
    let carsMap: Record<string, any> = {}

    if (carIds.length > 0) {
      const { data: cars } = await supabase.from("cars").select("id, name, brand, image").in("id", carIds)

      if (cars) {
        carsMap = Object.fromEntries(cars.map((c: any) => [c.id, c]))
      }
    }

    // Get car details for agreements
    const vehicleIds = [...new Set((agreements || []).map((a) => a.vehicle_id).filter(Boolean))]
    let vehiclesMap: Record<string, any> = {}

    if (vehicleIds.length > 0) {
      const { data: vehicles } = await supabase.from("cars").select("id, name, brand").in("id", vehicleIds)

      if (vehicles) {
        vehiclesMap = Object.fromEntries(vehicles.map((v: any) => [v.id, v]))
      }
    }

    // Process bookings
    const processedBookings: UserBooking[] = (bookings || []).map((booking) => {
      const car = carsMap[booking.car_id]
      return {
        id: booking.id,
        car_id: booking.car_id,
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
        // Rejection fields
        rejection_reason: booking.rejection_reason || undefined,
        rejection_notes: booking.rejection_notes || undefined,
        rejected_at: booking.rejected_at || undefined,
        can_resubmit: booking.can_resubmit ?? true,
        // Document URLs
        driving_license_front_url: booking.driving_license_front_url || undefined,
        driving_license_back_url: booking.driving_license_back_url || undefined,
        proof_of_address_url: booking.proof_of_address_url || undefined,
        bank_statement_url: booking.bank_statement_url || undefined,
        private_hire_license_front_url: booking.private_hire_license_front_url || undefined,
        private_hire_license_back_url: booking.private_hire_license_back_url || undefined,
        ni_number: booking.ni_number || undefined,
      }
    })

    // Process agreements
    const processedAgreements: UserAgreement[] = (agreements || []).map((agreement) => {
      const vehicle = vehiclesMap[agreement.vehicle_id]
      return {
        id: agreement.id,
        agreement_number: agreement.agreement_number || "",
        booking_id: agreement.booking_id || "",
        vehicle_id: agreement.vehicle_id || "",
        status: agreement.status || "",
        agreement_status: agreement.agreement_status || "",
        start_date: agreement.start_date,
        end_date: agreement.end_date,
        total_amount: Number(agreement.total_amount) || 0,
        created_at: agreement.created_at,
        signed_at: agreement.signed_at,
        car_name: vehicle?.name || null,
        car_brand: vehicle?.brand || null,
      }
    })

    // Calculate stats
    const activeBookings = processedBookings.filter((b) =>
      ["confirmed", "active", "approved", "pending"].includes(b.status.toLowerCase()),
    )
    const totalSpent = processedBookings.reduce((sum, b) => sum + b.total_amount, 0)

    return {
      success: true,
      data: {
        user: {
          id: authUser.id,
          email: authUser.email || "",
          full_name: profile?.full_name || authUser.email?.split("@")[0] || "User",
          phone: profile?.phone || "",
          avatar_url: profile?.avatar_url || null,
        },
        bookings: processedBookings,
        agreements: processedAgreements,
        stats: {
          totalBookings: processedBookings.length,
          activeBookings: activeBookings.length,
          totalAgreements: processedAgreements.length,
          totalSpent,
        },
      },
    }
  } catch (error) {
    console.error("[v0] getUserDashboardData error:", error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
