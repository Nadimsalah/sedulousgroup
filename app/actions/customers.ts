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

    // Fetch all bookings first to get unique customers
    const { data: allBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError)
    }

    // Fetch all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
    }

    // Fetch auth users to get emails
    const { data: authData } = await supabase.auth.admin.listUsers()
    const emailMap = new Map<string, string>()
    const userIdToEmailMap = new Map<string, string>()
    authData?.users?.forEach((user) => {
      emailMap.set(user.id, user.email || "")
      userIdToEmailMap.set(user.id, user.email || "")
    })

    // Create a map of unique customers from bookings
    const customerMap = new Map<string, {
      email: string
      name: string
      phone: string
      firstBookingDate: string
      userId?: string
      customerId?: string
    }>()

    // Extract unique customers from bookings
    ;(allBookings || []).forEach((booking: any) => {
      const email = (booking.customer_email || "").toLowerCase().trim()
      if (!email || email === "") return

      if (!customerMap.has(email)) {
        customerMap.set(email, {
          email: booking.customer_email,
          name: booking.customer_name || "Unknown",
          phone: booking.customer_phone || "N/A",
          firstBookingDate: booking.created_at,
          userId: booking.user_id || undefined,
          customerId: booking.customer_id || undefined,
        })
      } else {
        // Update with earliest booking date
        const existing = customerMap.get(email)!
        if (new Date(booking.created_at) < new Date(existing.firstBookingDate)) {
          existing.firstBookingDate = booking.created_at
        }
        if (booking.user_id && !existing.userId) {
          existing.userId = booking.user_id
        }
        if (booking.customer_id && !existing.customerId) {
          existing.customerId = booking.customer_id
        }
      }
    })

    // Merge with profiles
    const profileMap = new Map<string, any>()
    ;(profiles || []).forEach((profile: any) => {
      const email = (emailMap.get(profile.id) || profile.email || "").toLowerCase().trim()
      if (email) {
        profileMap.set(email, profile)
      }
      // Also map by user_id
      if (profile.id) {
        profileMap.set(profile.id, profile)
      }
    })

    // Build customer list
    const customers: CustomerWithDetails[] = []

    // Process customers from bookings
    for (const [email, bookingCustomer] of customerMap.entries()) {
      const bookingIds = new Set<string>()
      const userBookings: any[] = []

      // Find all bookings for this customer by email
      ;(allBookings || [])
        .filter((b: any) => (b.customer_email || "").toLowerCase().trim() === email)
        .forEach((b: any) => {
          if (!bookingIds.has(b.id)) {
            userBookings.push(b)
            bookingIds.add(b.id)
          }
        })

      // Find bookings by user_id if available
      if (bookingCustomer.userId) {
        ;(allBookings || [])
          .filter((b: any) => b.user_id === bookingCustomer.userId)
          .forEach((b: any) => {
            if (!bookingIds.has(b.id)) {
              userBookings.push(b)
              bookingIds.add(b.id)
            }
          })
      }

      // Find bookings by customer_id if available
      if (bookingCustomer.customerId) {
        ;(allBookings || [])
          .filter((b: any) => b.customer_id === bookingCustomer.customerId)
          .forEach((b: any) => {
            if (!bookingIds.has(b.id)) {
              userBookings.push(b)
              bookingIds.add(b.id)
            }
          })
      }

      // Find bookings by customer_name (fuzzy match)
      const nameParts = (bookingCustomer.name || "").trim().split(/\s+/)
      if (nameParts.length > 0) {
        ;(allBookings || [])
          .filter((b: any) => {
            const bookingName = (b.customer_name || "").toLowerCase()
            return nameParts.some(part => bookingName.includes(part.toLowerCase()))
          })
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

      // Get profile data if available
      const profile = profileMap.get(email) || profileMap.get(bookingCustomer.userId || "")
      const customerId = bookingCustomer.userId || bookingCustomer.customerId || profile?.id || `email-${email}`

      customers.push({
        id: customerId,
        name: profile?.full_name || profile?.username || bookingCustomer.name || "Unknown",
        email: bookingCustomer.email,
        phone: profile?.phone || bookingCustomer.phone || "N/A",
        location: profile?.address || "N/A",
        joinedDate: profile?.created_at || bookingCustomer.firstBookingDate,
        totalBookings: userBookings.length,
        activeBookings: activeBookings.length,
        totalSpent: totalSpent,
        status: activeBookings.length > 0 ? "active" : "inactive",
        lastBooking: lastBooking?.created_at || null,
        avatar_url: profile?.avatar_url || null,
      })
    }

    // Add customers from profiles who don't have bookings yet
    ;(profiles || []).forEach((profile: any) => {
      const email = emailMap.get(profile.id) || profile.email
      if (email && !customerMap.has((email || "").toLowerCase().trim())) {
        customers.push({
          id: profile.id,
          name: profile.full_name || profile.username || "Unknown",
          email: email || "N/A",
          phone: profile.phone || "N/A",
          location: profile.address || "N/A",
          joinedDate: profile.created_at,
          totalBookings: 0,
          activeBookings: 0,
          totalSpent: 0,
          status: "inactive",
          lastBooking: null,
          avatar_url: profile.avatar_url,
        })
      }
    })

    // Sort by last booking date (most recent first), then by name
    customers.sort((a, b) => {
      if (a.lastBooking && b.lastBooking) {
        return new Date(b.lastBooking).getTime() - new Date(a.lastBooking).getTime()
      }
      if (a.lastBooking) return -1
      if (b.lastBooking) return 1
      return a.name.localeCompare(b.name)
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
