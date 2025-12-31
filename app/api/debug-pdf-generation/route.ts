import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { agreementId } = await request.json()
    
    if (!agreementId) {
      return NextResponse.json({ error: "Agreement ID required" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Get agreement data
    const { data: agreement, error: agreementError } = await adminSupabase
      .from("agreements")
      .select("*")
      .eq("id", agreementId)
      .single()

    if (agreementError || !agreement) {
      return NextResponse.json({ 
        error: "Agreement not found",
        details: agreementError 
      }, { status: 404 })
    }

    // Check what we have
    const diagnostics = {
      agreementId,
      hasUnsignedPdf: !!agreement.unsigned_agreement_url,
      unsignedPdfUrl: agreement.unsigned_agreement_url?.substring(0, 100),
      hasSignedPdf: !!agreement.signed_agreement_url && agreement.signed_agreement_url.endsWith('.pdf'),
      signedPdfUrl: agreement.signed_agreement_url?.substring(0, 100),
      hasSignatureData: !!agreement.customer_signature_data,
      signatureDataType: agreement.customer_signature_data ? 
        (agreement.customer_signature_data.startsWith('http') ? 'URL' : 
         agreement.customer_signature_data.startsWith('data:') ? 'Base64' :
         agreement.customer_signature_data.startsWith('{') ? 'JSON' : 'Unknown') : 'None',
      status: agreement.status,
    }

    // Try to test unsigned PDF accessibility
    if (agreement.unsigned_agreement_url) {
      try {
        const testResponse = await fetch(agreement.unsigned_agreement_url, { method: "HEAD" })
        diagnostics['unsignedPdfAccessible'] = testResponse.ok
        diagnostics['unsignedPdfStatus'] = testResponse.status
      } catch (e) {
        diagnostics['unsignedPdfAccessible'] = false
        diagnostics['unsignedPdfError'] = e instanceof Error ? e.message : 'Unknown'
      }
    }

    // Try to extract signature URL
    let signatureUrl = null
    if (agreement.customer_signature_data) {
      try {
        const parsed = JSON.parse(agreement.customer_signature_data)
        signatureUrl = parsed.customer_signature || parsed.customer_signature_data
      } catch {
        if (agreement.customer_signature_data.startsWith('http')) {
          signatureUrl = agreement.customer_signature_data
        }
      }
    }

    if (signatureUrl) {
      try {
        const sigTest = await fetch(signatureUrl, { method: "HEAD" })
        diagnostics['signatureAccessible'] = sigTest.ok
        diagnostics['signatureStatus'] = sigTest.status
        diagnostics['signatureUrl'] = signatureUrl.substring(0, 100)
      } catch (e) {
        diagnostics['signatureAccessible'] = false
        diagnostics['signatureError'] = e instanceof Error ? e.message : 'Unknown'
      }
    }

    return NextResponse.json({ success: true, diagnostics })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

