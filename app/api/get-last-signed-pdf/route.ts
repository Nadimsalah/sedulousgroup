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

    // Get the most recent signed agreement
    const { data, error } = await supabase
      .from("agreements")
      .select("id, agreement_number, signed_agreement_url, unsigned_agreement_url, status, created_at, updated_at")
      .not("signed_agreement_url", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching signed PDF:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "No signed agreements found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      agreement: {
        id: data.id,
        agreementNumber: data.agreement_number,
        status: data.status,
        signedPdfUrl: data.signed_agreement_url,
        unsignedPdfUrl: data.unsigned_agreement_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    })
  } catch (error) {
    console.error("Error in get-last-signed-pdf:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

