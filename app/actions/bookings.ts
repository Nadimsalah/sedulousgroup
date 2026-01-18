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
  car_registration_number: string | null
  // Document fields
  driving_license_number?: string
  ni_number?: string
  driving_license_front_url?: string
  driving_license_back_url?: string
  proof_of_address_url?: string
  bank_statement_url?: string
  private_hire_license_front_url?: string
  private_hire_license_back_url?: string
  documents_submitted_at?: string
  // Rejection fields
  rejection_reason?: string
  rejection_notes?: string
  rejected_at?: string
  can_resubmit?: boolean
}

export async function getAllBookingsAction(): Promise<{
  success: boolean
  data: BookingWithDetails[]
  error?: string
}> {
  try {
    console.log("[v0] getAllBookingsAction called")
    const supabase = createAdminSupabase()

    // Fetch all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })

    if (bookingsError) {
      console.error("[v0] Error fetching bookings:", bookingsError)
      return { success: false, data: [], error: bookingsError.message }
    }

    console.log("[v0] Bookings fetched:", bookings?.length || 0)

    if (!bookings || bookings.length === 0) {
      return { success: true, data: [] }
    }

    // Get unique car IDs
    const carIds = [...new Set(bookings.map((b) => b.car_id).filter(Boolean))]

    // Fetch cars
    let carsMap: Record<string, any> = {}
    if (carIds.length > 0) {
      const { data: cars } = await supabase.from("cars").select("id, name, brand, image, rental_type, registration_number").in("id", carIds)

      if (cars) {
        carsMap = Object.fromEntries(cars.map((c: any) => [c.id, c]))
      }
    }

    // Combine data - safely access fields that might not exist
    const result: BookingWithDetails[] = bookings.map((booking: any) => {
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
        car_registration_number: car?.registration_number || null,
        // Document fields (may not exist in older records)
        driving_license_number: booking.driving_license_number ?? undefined,
        ni_number: booking.ni_number ?? undefined,
        driving_license_front_url: booking.driving_license_front_url ?? undefined,
        driving_license_back_url: booking.driving_license_back_url ?? undefined,
        proof_of_address_url: booking.proof_of_address_url ?? undefined,
        bank_statement_url: booking.bank_statement_url ?? undefined,
        private_hire_license_front_url: booking.private_hire_license_front_url ?? undefined,
        private_hire_license_back_url: booking.private_hire_license_back_url ?? undefined,
        documents_submitted_at: booking.documents_submitted_at ?? undefined,
        // Rejection fields (may not exist if columns not added yet)
        rejection_reason: booking.rejection_reason ?? undefined,
        rejection_notes: booking.rejection_notes ?? undefined,
        rejected_at: booking.rejected_at ?? undefined,
        can_resubmit: booking.can_resubmit !== false, // Default to true if not set
      }
    })

    console.log("[v0] Bookings processed successfully:", result.length)
    return { success: true, data: result }
  } catch (error) {
    console.error("[v0] Exception in getAllBookingsAction:", error)
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

export async function rejectBookingAction(
  bookingId: string,
  reason: string,
  notes?: string,
  canResubmit: boolean = true,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminSupabase()

    // Basic update data - only use columns that exist
    const updateData: Record<string, any> = {
      status: canResubmit ? "Documents Rejected" : "Rejected",
      updated_at: new Date().toISOString(),
    }

    // Try to update with all fields first
    let { error } = await supabase
      .from("bookings")
      .update({
        ...updateData,
        rejection_reason: reason,
        rejection_notes: notes || null,
        rejected_at: new Date().toISOString(),
        can_resubmit: canResubmit,
      })
      .eq("id", bookingId)

    // If column doesn't exist error, fall back to basic update
    if (error && error.message.includes("column")) {
      console.log("[v0] Rejection columns don't exist yet, using basic update")
      const { error: basicError } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId)

      if (basicError) {
        console.error("[v0] Error rejecting booking (basic):", basicError)
        return { success: false, error: basicError.message }
      }
    } else if (error) {
      console.error("[v0] Error rejecting booking:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Booking rejected successfully:", bookingId, "Reason:", reason, "Can resubmit:", canResubmit)
    return { success: true }
  } catch (error) {
    console.error("[v0] Exception rejecting booking:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getBookingForResubmitAction(
  bookingId: string
): Promise<{ success: boolean; booking?: any; error?: string }> {
  try {
    console.log("[v0] getBookingForResubmitAction called for:", bookingId)

    // Get current user to verify ownership
    const { user: authUser, error: authError } = await getCurrentUser()
    if (authError || !authUser) {
      console.log("[v0] Not authenticated for resubmit")
      return { success: false, error: "Not authenticated" }
    }

    const supabase = createAdminSupabase()

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (error || !booking) {
      console.log("[v0] Booking not found:", error?.message)
      return { success: false, error: "Booking not found" }
    }

    // Verify user owns this booking
    const isOwner = booking.user_id === authUser.id ||
      booking.customer_id === authUser.id ||
      booking.customer_email === authUser.email

    console.log("[v0] Ownership check:", {
      booking_user_id: booking.user_id,
      booking_customer_id: booking.customer_id,
      booking_customer_email: booking.customer_email,
      auth_user_id: authUser.id,
      auth_user_email: authUser.email,
      isOwner
    })

    if (!isOwner) {
      return { success: false, error: "You don't have permission to access this booking" }
    }

    // Check if resubmission is allowed based on status
    const statusLower = (booking.status || "").toLowerCase()
    const isDocumentsRejected = statusLower === "documents rejected"
    const canResubmit = isDocumentsRejected

    console.log("[v0] Booking status:", booking.status, "statusLower:", statusLower)
    console.log("[v0] isDocumentsRejected:", isDocumentsRejected, "canResubmit:", canResubmit)

    return {
      success: true,
      booking: {
        ...booking,
        can_resubmit: canResubmit
      }
    }
  } catch (error) {
    console.error("[v0] Error getting booking for resubmit:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function resubmitBookingDocumentsAction(
  bookingId: string,
  documents: {
    driving_license_front_url?: string
    driving_license_back_url?: string
    proof_of_address_url?: string
    bank_statement_url?: string
    private_hire_license_front_url?: string
    private_hire_license_back_url?: string
    ni_number?: string
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminSupabase()

    // Basic update with documents
    const basicUpdate: Record<string, any> = {
      ...documents,
      status: "Documents Submitted",
      documents_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Try with rejection fields first
    let { error } = await supabase
      .from("bookings")
      .update({
        ...basicUpdate,
        rejection_reason: null,
        rejection_notes: null,
        rejected_at: null,
        can_resubmit: null,
      })
      .eq("id", bookingId)

    // If column doesn't exist, fall back to basic update
    if (error && error.message.includes("column")) {
      console.log("[v0] Rejection columns don't exist yet, using basic update")
      const { error: basicError } = await supabase
        .from("bookings")
        .update(basicUpdate)
        .eq("id", bookingId)

      if (basicError) {
        console.error("[v0] Error resubmitting documents (basic):", basicError)
        return { success: false, error: basicError.message }
      }
    } else if (error) {
      console.error("[v0] Error resubmitting documents:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Documents resubmitted successfully for booking:", bookingId)
    return { success: true }
  } catch (error) {
    console.error("[v0] Exception resubmitting documents:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getFleetStatsAction(): Promise<{
  success: boolean
  totalCars: number
  error?: string
}> {
  try {
    const supabase = createAdminSupabase()
    const { count, error } = await supabase.from("cars").select("*", { count: "exact", head: true })

    if (error) {
      console.error("[v0] Error fetching fleet stats:", error)
      return { success: false, totalCars: 0, error: error.message }
    }

    return { success: true, totalCars: count || 0 }
  } catch (error) {
    return { success: false, totalCars: 0, error: "Failed to fetch stats" }
  }
}
