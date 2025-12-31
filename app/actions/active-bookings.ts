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

export interface ActiveBookingWithAgreement {
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
  agreement_id: string | null
  agreement_status: string | null
  signed_agreement_url: string | null
}

export async function getActiveBookingsWithSignedAgreements(): Promise<{
  success: boolean
  data: ActiveBookingWithAgreement[]
  error?: string
}> {
  try {
    const supabase = createAdminSupabase()

    // Fetch all bookings with active status
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .in("status", ["active", "approved", "confirmed"])
      .order("created_at", { ascending: false })

    if (bookingsError) {
      return { success: false, data: [], error: bookingsError.message }
    }

    if (!bookings || bookings.length === 0) {
      return { success: true, data: [] }
    }

    // Get all agreements for these bookings
    const bookingIds = bookings.map((b) => b.id)
    const { data: agreements, error: agreementsError } = await supabase
      .from("agreements")
      .select("*")
      .in("booking_id", bookingIds)

    if (agreementsError) {
      console.error("Error fetching agreements:", agreementsError)
    }

    console.log("[Active Bookings] Total bookings found:", bookings.length)
    console.log("[Active Bookings] Total agreements found:", agreements?.length || 0)

    // Filter agreements to only those with both customer and admin signatures
    // We check for signatures, not just status, since status might not always be accurate
    const signedAgreements = (agreements || []).filter((agreement) => {
      console.log(`[Active Bookings] Checking agreement ${agreement.id}:`, {
        status: agreement.status,
        has_customer_signature: !!agreement.customer_signature_data,
        has_signed_url: !!agreement.signed_agreement_url,
        has_unsigned_url: !!agreement.unsigned_agreement_url,
        customer_signature_type: agreement.customer_signature_data ? (agreement.customer_signature_data.startsWith("{") ? "JSON" : "direct") : "none",
      })

      // Check if customer has signed (customer_signature_data exists)
      if (!agreement.customer_signature_data) {
        console.log(`[Active Bookings] Agreement ${agreement.id} rejected: No customer signature`)
        return false
      }

      // Check if admin has signed
      // Admin signature indicators:
      // 1. unsigned_agreement_url exists (admin created the agreement PDF with admin signature)
      // 2. In customer_signature_data as JSON with admin_signature field
      // 3. signed_agreement_url is a PDF (final PDF with both signatures)
      let hasAdminSignature = false
      let hasCustomerSignature = false

      // Customer signature: customer_signature_data exists
      hasCustomerSignature = !!agreement.customer_signature_data

      // Admin signature checks
      // Method 1: Check if unsigned_agreement_url exists (admin created it)
      if (agreement.unsigned_agreement_url) {
        hasAdminSignature = true
        console.log(`[Active Bookings] Agreement ${agreement.id} has admin signature (unsigned_agreement_url)`)
      }

      // Method 2: Check customer_signature_data for JSON with admin signature
      if (!hasAdminSignature && agreement.customer_signature_data) {
        try {
          const signatureData = agreement.customer_signature_data
          if (typeof signatureData === "string" && signatureData.startsWith("{")) {
            const parsed = JSON.parse(signatureData)
            if (parsed.admin_signature || parsed.adminSignature) {
              hasAdminSignature = true
              console.log(`[Active Bookings] Agreement ${agreement.id} has admin signature (in JSON)`)
            }
          }
        } catch (e) {
          // Not JSON, continue
        }
      }

      // Method 3: Check if signed_agreement_url is a PDF (final document with both signatures)
      if (!hasAdminSignature && agreement.signed_agreement_url) {
        const signedUrl = agreement.signed_agreement_url
        if (signedUrl.includes(".pdf") || signedUrl.endsWith(".pdf")) {
          hasAdminSignature = true
          console.log(`[Active Bookings] Agreement ${agreement.id} has admin signature (signed PDF exists)`)
        }
      }

      // Both signatures must be present
      const isValid = hasCustomerSignature && hasAdminSignature
      console.log(`[Active Bookings] Agreement ${agreement.id} final check:`, {
        hasCustomer: hasCustomerSignature,
        hasAdmin: hasAdminSignature,
        isValid,
        unsigned_url: !!agreement.unsigned_agreement_url,
        signed_url: !!agreement.signed_agreement_url,
      })
      return isValid
    })

    console.log("[Active Bookings] Signed agreements found:", signedAgreements.length)

    // Get booking IDs that have fully signed agreements
    const signedBookingIds = new Set(signedAgreements.map((a) => a.booking_id))

    // Filter bookings to only those with signed agreements
    const signedBookings = bookings.filter((b) => signedBookingIds.has(b.id))

    // Get unique car IDs
    const carIds = [...new Set(signedBookings.map((b) => b.car_id).filter(Boolean))]

    // Fetch cars
    let carsMap: Record<string, any> = {}
    if (carIds.length > 0) {
      const { data: cars } = await supabase.from("cars").select("id, name, brand, image, rental_type").in("id", carIds)

      if (cars) {
        carsMap = Object.fromEntries(cars.map((c) => [c.id, c]))
      }
    }

    // Create agreement map
    const agreementMap = new Map(signedAgreements.map((a) => [a.booking_id, a]))

    // Combine data
    const result: ActiveBookingWithAgreement[] = signedBookings.map((booking) => {
      const car = carsMap[booking.car_id]
      const agreement = agreementMap.get(booking.id)

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
        agreement_id: agreement?.id || null,
        agreement_status: agreement?.status || null,
        signed_agreement_url: agreement?.signed_agreement_url || null,
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

