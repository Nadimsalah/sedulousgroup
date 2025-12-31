import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase credentials" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get all agreements with signed_agreement_url, ordered by updated_at
    const { data, error } = await supabase
      .from("agreements")
      .select("id, agreement_number, signed_agreement_url, unsigned_agreement_url, status, created_at, updated_at")
      .not("signed_agreement_url", "is", null)
      .order("updated_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching signed agreements:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Filter and format results
    const agreements = (data || []).map((agreement: any) => ({
      id: agreement.id,
      agreementNumber: agreement.agreement_number,
      status: agreement.status,
      signedPdfUrl: agreement.signed_agreement_url,
      unsignedPdfUrl: agreement.unsigned_agreement_url,
      isPdf: agreement.signed_agreement_url?.endsWith('.pdf') || agreement.signed_agreement_url?.includes('.pdf?'),
      isPng: agreement.signed_agreement_url?.endsWith('.png') || agreement.signed_agreement_url?.includes('/signatures/'),
      createdAt: agreement.created_at,
      updatedAt: agreement.updated_at,
    }))

    return NextResponse.json({
      success: true,
      count: agreements.length,
      agreements,
    })
  } catch (error) {
    console.error("Error in get-all-signed-agreements:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

