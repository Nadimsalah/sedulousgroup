import { NextResponse } from "next/server"
import { generateSignedPdfAction } from "@/app/actions/generate-signed-pdf"

export async function POST(request: Request) {
  try {
    const { agreementId } = await request.json()
    
    if (!agreementId) {
      return NextResponse.json(
        { error: "Agreement ID is required" },
        { status: 400 }
      )
    }

    console.log("[TEST] Starting PDF generation for agreement:", agreementId)
    const startTime = Date.now()
    
    const result = await generateSignedPdfAction(agreementId)
    
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      success: result.success,
      error: result.error,
      signedPdfUrl: result.signedPdfUrl,
      duration: `${duration}ms`,
    })
  } catch (error) {
    console.error("[TEST] Error in test PDF generation:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

