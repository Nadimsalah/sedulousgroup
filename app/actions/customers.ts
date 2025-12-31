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

export interface CustomerWithDetails {
  id: string
  name: string
  email: string
  phone: string
  location: string
  joinedDate: string
  totalBookings: number
  activeBookings: number
  totalSpent: number
  status: string
  lastBooking: string | null
  avatar_url: string | null
}

export async function getCustomersWithDetails(): Promise<{
  customers: CustomerWithDetails[]
  error: string | null
}> {
  try {
    const supabase = createAdminSupabase()

    // Fetch all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) {
      return { customers: [], error: profilesError.message }
    }

    // Fetch all bookings
    const { data: bookings, error: bookingsError } = await supabase.from("bookings").select("*")

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError)
    }

    // Fetch auth users to get emails
    const { data: authData } = await supabase.auth.admin.listUsers()

    const emailMap = new Map()
    authData?.users?.forEach((user) => {
      emailMap.set(user.id, user.email)
    })

    // Process customers - search bookings by all possible fields
    const customers: CustomerWithDetails[] = (profiles || []).map((profile: any) => {
      const customerEmail = emailMap.get(profile.id) || profile.email
      const bookingIds = new Set<string>()
      const userBookings: any[] = []

      // Find bookings by user_id
      ;(bookings || [])
        .filter((b: any) => b.user_id === profile.id)
        .forEach((b: any) => {
          if (!bookingIds.has(b.id)) {
            userBookings.push(b)
            bookingIds.add(b.id)
          }
        })

      // Find bookings by customer_id
      ;(bookings || [])
        .filter((b: any) => b.customer_id === profile.id)
        .forEach((b: any) => {
          if (!bookingIds.has(b.id)) {
            userBookings.push(b)
            bookingIds.add(b.id)
          }
        })

      // Find bookings by customer_email
      if (customerEmail) {
        ;(bookings || [])
          .filter((b: any) => b.customer_email === customerEmail)
          .forEach((b: any) => {
            if (!bookingIds.has(b.id)) {
              userBookings.push(b)
              bookingIds.add(b.id)
            }
          })
      }

      const activeBookings = userBookings.filter((b: any) => {
        const status = (b.status || "").toLowerCase()
        return ["active", "approved", "pending", "confirmed"].includes(status)
      })

      const totalSpent = userBookings.reduce((sum: number, b: any) => {
        return sum + (Number(b.total_amount) || 0)
      }, 0)

      const sortedBookings = [...userBookings].sort(
        (a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      )
      const lastBooking = sortedBookings[0]

      return {
        id: profile.id,
        name: profile.full_name || profile.username || "Unknown",
        email: customerEmail || "N/A",
        phone: profile.phone || "N/A",
        location: profile.address || "N/A",
        joinedDate: profile.created_at,
        totalBookings: userBookings.length,
        activeBookings: activeBookings.length,
        totalSpent: totalSpent,
        status: activeBookings.length > 0 ? "active" : "inactive",
        lastBooking: lastBooking?.created_at || null,
        avatar_url: profile.avatar_url,
      }
    })

    return { customers, error: null }
  } catch (error) {
    console.error("getCustomersWithDetails error:", error)
    return {
      customers: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
