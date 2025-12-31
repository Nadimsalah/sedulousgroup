"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create admin client with service role to bypass RLS (same as dashboard)
function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getBookingDetails(bookingId: string) {
  try {
    // First, get the authenticated user using regular client
    const supabase = await createClient()

    if (!supabase) {
      return { error: "Failed to initialize Supabase" }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Not authenticated" }
    }

    console.log("[v0] getBookingDetails - User ID:", user.id, "Email:", user.email, "Booking ID:", bookingId)

    // Use admin client to bypass RLS (same approach as dashboard)
    const adminSupabase = createAdminSupabase()

    // Fetch booking by ID first
    const { data: booking, error: bookingError } = await adminSupabase
      .from("bookings")
      .select("*, cars(*)")
      .eq("id", bookingId)
      .single()

    console.log("[v0] Booking fetch result - Found:", !!booking, "Error:", bookingError?.message)

    if (bookingError || !booking) {
      console.error("[v0] Booking not found - ID:", bookingId, "Error:", bookingError?.message)
      return { error: "Booking not found" }
    }

    // Verify ownership - check both user_id and customer_email
    const isOwner =
      booking.user_id === user.id ||
      booking.customer_email?.toLowerCase() === user.email?.toLowerCase()

    console.log("[v0] Ownership check - user_id match:", booking.user_id === user.id, "email match:", booking.customer_email?.toLowerCase() === user.email?.toLowerCase())

    if (!isOwner) {
      console.error("[v0] Access denied - Booking user_id:", booking.user_id, "Booking email:", booking.customer_email, "User ID:", user.id, "User email:", user.email)
      return { error: "Access denied - This booking does not belong to you" }
    }

    // Fetch agreement for this booking - try multiple ways
    let { data: agreement, error: agreementError } = await adminSupabase
      .from("agreements")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle()

    // If not found by booking_id, try by customer_id
    if (!agreement && user.id) {
      const { data: customerAgreement } = await adminSupabase
        .from("agreements")
        .select("*")
        .eq("customer_id", user.id)
        .eq("booking_id", bookingId)
        .maybeSingle()
      
      if (customerAgreement) {
        agreement = customerAgreement
      }
    }

    console.log("[v0] Agreement found:", !!agreement, "Error:", agreementError?.message)
    if (agreement) {
      console.log("[v0] Agreement details - ID:", agreement.id, "Status:", agreement.status, "Booking ID:", agreement.booking_id)
    }

    return { booking, agreement, user }
  } catch (error: any) {
    console.error("[v0] Error fetching booking:", error)
    return { error: error.message || "Failed to load booking" }
  }
}

export async function signAgreement(bookingId: string, signatureUrl: string, agreementId: string) {
  try {
    // Get authenticated user
    const supabase = await createClient()

    if (!supabase) {
      return { error: "Failed to initialize Supabase" }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Not authenticated" }
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminSupabase()

    // Verify agreement belongs to this user's booking
    const { data: agreement, error: agreementError } = await adminSupabase
      .from("agreements")
      .select("*, bookings!inner(*)")
      .eq("id", agreementId)
      .eq("booking_id", bookingId)
      .single()

    if (agreementError || !agreement) {
      return { error: "Agreement not found" }
    }

    // Verify ownership
    // @ts-ignore - Type checking issue with nested joins
    const booking = agreement.bookings
    const isOwner =
      booking.user_id === user.id ||
      booking.customer_email?.toLowerCase() === user.email?.toLowerCase()

    if (!isOwner) {
      return { error: "Access denied" }
    }

    // Get current agreement to preserve admin signature
    const { data: currentAgreement } = await adminSupabase
      .from("agreements")
      .select("customer_signature_data")
      .eq("id", agreementId)
      .single()

    // Preserve admin signature (stored as base64 data URL when admin signed)
    // Only update customer_signature_data if it's not a base64 admin signature
    const adminSignature = currentAgreement?.customer_signature_data
    const isAdminSignature = adminSignature && adminSignature.startsWith("data:image")

    const updateData: any = {
      // DON'T set signed_agreement_url here - it will be set by PDF generation
      // signed_agreement_url should only contain the final PDF URL, not the signature image
      status: "pending", // Will be updated to "signed" when PDF is generated
      signed_at: new Date().toISOString(),
    }

    // Store customer signature in customer_signature_data so we don't lose it when signed_agreement_url is overwritten with PDF
    // Don't overwrite admin signature - keep it in customer_signature_data if it exists
    if (!isAdminSignature) {
      // Only update if it's not an admin signature
      updateData.customer_signature_data = signatureUrl
    } else {
      // If admin signature exists, we need to preserve customer signature separately
      // Store it in a way we can retrieve it later
      updateData.customer_signature_data = JSON.stringify({
        admin_signature: adminSignature,
        customer_signature: signatureUrl
      })
    }

    // Update agreement with signature
    const { error: updateError } = await adminSupabase
      .from("agreements")
      .update(updateData)
      .eq("id", agreementId)
      .eq("booking_id", bookingId)

    if (updateError) {
      console.error("[v0] Error updating agreement:", updateError)
      return { error: updateError.message }
    }

    console.log("[v0] Agreement signed successfully - ID:", agreementId)
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error signing agreement:", error)
    return { error: error.message || "Failed to sign agreement" }
  }
}
