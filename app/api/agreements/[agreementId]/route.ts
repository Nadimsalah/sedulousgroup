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

export async function PATCH(request: NextRequest, { params }: { params: { agreementId: string } }) {
  try {
    const agreementId = params.agreementId
    const body = await request.json()

    console.log("[v0] Updating agreement:", agreementId, "with data:", body)

    const adminSupabase = createAdminSupabase()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.signed_agreement_url) updateData.signed_agreement_url = body.signed_agreement_url
    if (body.unsigned_agreement_url) updateData.unsigned_agreement_url = body.unsigned_agreement_url
    if (body.customer_signature_data) updateData.customer_signature_data = body.customer_signature_data
    if (body.status) updateData.status = body.status
    if (body.signed_at) updateData.signed_at = body.signed_at
    if (body.sent_to_customer_at) updateData.sent_to_customer_at = body.sent_to_customer_at
    if (body.unsigned_agreement_url) updateData.unsigned_agreement_url = body.unsigned_agreement_url

    const { data, error } = await adminSupabase
      .from("agreements")
      .update(updateData)
      .eq("id", agreementId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating agreement:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Agreement updated successfully:", data)
    return NextResponse.json({ success: true, agreement: data })
  } catch (error: any) {
    console.error("[v0] Error in PATCH agreement:", error)
    return NextResponse.json({ error: error.message || "Failed to update agreement" }, { status: 500 })
  }
}

