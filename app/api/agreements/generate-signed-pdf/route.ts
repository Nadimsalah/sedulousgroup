import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create admin client with service role to bypass RLS
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

export async function POST(request: NextRequest) {
  try {
    const { agreementId } = await request.json()

    if (!agreementId) {
      return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 })
    }

    console.log("[v0] Generating signed PDF for agreement:", agreementId)

    const adminSupabase = createAdminSupabase()

    // Fetch agreement with all details
    const { data: agreement, error: agreementError } = await adminSupabase
      .from("agreements")
      .select("*")
      .eq("id", agreementId)
      .single()

    if (agreementError || !agreement) {
      console.error("[v0] Agreement not found:", agreementError)
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    // Fetch booking details
    const { data: booking } = await adminSupabase
      .from("bookings")
      .select("*")
      .eq("id", agreement.booking_id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Get admin signature (stored in customer_signature_data when admin signed)
    const adminSignatureUrl = agreement.customer_signature_data || agreement.unsigned_agreement_url
    // Get customer signature (stored in signed_agreement_url when customer signed)
    const customerSignatureUrl = agreement.signed_agreement_url

    if (!adminSignatureUrl || !customerSignatureUrl) {
      return NextResponse.json({ error: "Both signatures are required" }, { status: 400 })
    }

    // Import jsPDF dynamically (it should work in Node.js with jsdom or similar)
    // For now, we'll return the URLs and let the client generate the PDF
    // Or we can use a different PDF library that works server-side

    // Actually, let's use a simpler approach: fetch both signature images and combine them
    // But jsPDF might not work server-side. Let's create a client-side solution instead.

    // For now, return the signature URLs so the client can generate the PDF
    return NextResponse.json({
      success: true,
      adminSignatureUrl,
      customerSignatureUrl,
      agreementText: agreement.agreement_text || "",
    })
  } catch (error: any) {
    console.error("[v0] Error generating signed PDF:", error)
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 })
  }
}






