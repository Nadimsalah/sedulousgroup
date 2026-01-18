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

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ agreementId: string }> | { agreementId: string } }) {
  try {
    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params
    const agreementId = resolvedParams.agreementId

    if (!agreementId) {
      return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 })
    }

    const body = await request.json()

    console.log("[v0] Updating agreement:", agreementId, "with data:", Object.keys(body))

    const adminSupabase = createAdminSupabase()

    // First check if agreement exists
    const { data: existingAgreement, error: checkError } = await adminSupabase
      .from("agreements")
      .select("id")
      .eq("id", agreementId)
      .single()

    if (checkError || !existingAgreement) {
      console.error("[v0] Agreement not found:", agreementId, checkError)
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.signed_agreement_url) updateData.signed_agreement_url = body.signed_agreement_url
    if (body.unsigned_agreement_url) updateData.unsigned_agreement_url = body.unsigned_agreement_url
    if (body.customer_signature_data) updateData.customer_signature_data = body.customer_signature_data
    if (body.status) updateData.status = body.status
    if (body.signed_at) updateData.signed_at = body.signed_at
    if (body.sent_to_customer_at) updateData.sent_to_customer_at = body.sent_to_customer_at
    if (body.vehicle_photos) updateData.vehicle_photos = body.vehicle_photos
    if (body.fuel_level) updateData.fuel_level = body.fuel_level
    if (body.odometer_reading !== undefined) updateData.odometer_reading = body.odometer_reading
    if (body.vehicle_registration) updateData.vehicle_registration = body.vehicle_registration
    // Note: customer_name_signed is stored in the PDF, not in the database column

    const { data, error } = await adminSupabase
      .from("agreements")
      .update(updateData)
      .eq("id", agreementId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating agreement:", error)
      return NextResponse.json({ error: error.message || "Failed to update agreement" }, { status: 500 })
    }

    if (!data) {
      console.error("[v0] No data returned after update")
      return NextResponse.json({ error: "Agreement not found after update" }, { status: 404 })
    }

    console.log("[v0] Agreement updated successfully:", data.id)
    return NextResponse.json({ success: true, agreement: data })
  } catch (error: any) {
    console.error("[v0] Error in PATCH agreement:", error)
    return NextResponse.json({
      error: error.message || "Failed to update agreement",
      details: error.toString()
    }, { status: 500 })
  }
}

