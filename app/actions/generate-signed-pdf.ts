"use server"

import { PDFDocument } from "pdf-lib"
import { db } from "@/lib/database"
import { getBookingsAction, getCarsAction } from "./database"

export async function generateSignedPdfAction(agreementId: string) {
  console.log("[v0] ===== generateSignedPdfAction START =====")
  console.log("[v0] Agreement ID:", agreementId)
  const startTime = Date.now()

  try {
    // 1. Get agreement
    const agreement = await db.getAgreementById(agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found" }
    }

    // 2. Get the existing unsigned PDF URL
    const unsignedPdfUrl = agreement.unsignedAgreementUrl || (agreement as any).unsigned_agreement_url
    if (!unsignedPdfUrl) {
      return { success: false, error: "Original agreement PDF not found. Please contact support." }
    }

    // 3. Get booking and car data
    const [bookings, cars] = await Promise.all([getBookingsAction(), getCarsAction()])
    const booking = bookings.find((b: any) => b.id === agreement.bookingId)
    const car = cars.find((c: any) => c.id === booking?.carId || c.id === (booking as any)?.car_id)

    if (!booking || !car) {
      return { success: false, error: "Booking or car data not found" }
    }

    // 4. Setup Supabase Admin Client
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase credentials")
    }
    
    const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    
    // 5. Get raw agreement data for signature
    const { data: rawAgreement, error: rawError } = await adminSupabase
      .from("agreements")
      .select("*")
      .eq("id", agreementId)
      .single()
    
    if (rawError || !rawAgreement) {
      return { success: false, error: "Failed to fetch agreement data" }
    }
    
    // 6. Find Customer Signature (Base64 or URL)
    let customerSignatureData: string | null = null
    const signatureData = rawAgreement.customer_signature_data

    // Check customer_signature_data
    if (signatureData) {
      if (signatureData.startsWith('data:image')) {
        customerSignatureData = signatureData
      } else {
        try {
          const parsed = JSON.parse(signatureData)
          if (parsed.customer_signature?.startsWith('data:image')) {
            customerSignatureData = parsed.customer_signature
          } else if (parsed.customer_signature?.startsWith('http')) {
            customerSignatureData = parsed.customer_signature
          }
        } catch {
          if (signatureData.startsWith('http') && !signatureData.endsWith('.pdf')) {
            customerSignatureData = signatureData
          }
        }
      }
    }
    
    // Fallback to signed_agreement_url if it's an image
    if (!customerSignatureData) {
      const signedUrl = rawAgreement.signed_agreement_url
      if (signedUrl && !signedUrl.endsWith('.pdf') && signedUrl.startsWith('http')) {
        customerSignatureData = signedUrl
      }
    }
    
    if (!customerSignatureData) {
      return { success: false, error: "Customer signature not found. Please sign the agreement again." }
    }
    
    // 7. Load the Unsigned PDF
    let unsignedPdfBytes: ArrayBuffer
    try {
      // Logic to handle Supabase Storage URLs that might need signing
      let fetchUrl = unsignedPdfUrl
      
      if (unsignedPdfUrl.includes('supabase.co') && unsignedPdfUrl.includes('/storage/')) {
        // Simple public URL check failed? create signed URL logic here if needed
        // For brevity, assuming public access or previously generated signed URL
        // (Your original code had complex retry logic here, keeping it simple but functional)
        const pdfResponse = await fetch(unsignedPdfUrl)
        if (!pdfResponse.ok) {
           // If public fetch fails, try generating a signed URL
           const pathParts = unsignedPdfUrl.split('/storage/v1/object/public/')[1]?.split('/') 
             || unsignedPdfUrl.split('/storage/v1/object/sign/')[1]?.split('/')
           
           if (pathParts) {
             const bucket = pathParts[0]
             const filePath = pathParts.slice(1).join('/')
             const { data: signedData } = await adminSupabase.storage
               .from(bucket)
               .createSignedUrl(filePath, 60)
             if (signedData?.signedUrl) fetchUrl = signedData.signedUrl
           }
        }
      }

      const response = await fetch(fetchUrl)
      if (!response.ok) throw new Error(`Status ${response.status}`)
      unsignedPdfBytes = await response.arrayBuffer()
    } catch (error) {
      return { success: false, error: "Failed to load original PDF template." }
    }
    
    const pdfDoc = await PDFDocument.load(unsignedPdfBytes)
    
    // 8. Process Signature Image (Convert to ArrayBuffer)
    let signatureImageBytes: ArrayBuffer
    
    if (customerSignatureData.startsWith('data:image')) {
      const base64Data = customerSignatureData.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      signatureImageBytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    } else {
      // It is a URL
      const sigRes = await fetch(customerSignatureData)
      if (!sigRes.ok) return { success: false, error: "Failed to fetch signature image." }
      signatureImageBytes = await sigRes.arrayBuffer()
    }

    // Embed image (try PNG then JPG)
    let signatureImage
    try {
      signatureImage = await pdfDoc.embedPng(signatureImageBytes)
    } catch {
      try {
        signatureImage = await pdfDoc.embedJpg(signatureImageBytes)
      } catch {
        return { success: false, error: "Signature format not supported (must be PNG or JPG)." }
      }
    }
    
    // --- POSITIONING LOGIC START ---
    const pages = pdfDoc.getPages()
    const lastPage = pages[pages.length - 1]
    const { width, height } = lastPage.getSize()

    const mmToPoints = 2.83465

    // SETTINGS:
    // This places the signature ~5.5cm from the bottom of the page.
    // If it is too low, increase this number (e.g., 65).
    // If it is too high, decrease this number (e.g., 45).
    const signatureYFromBottomMm = 135 
    
    // Width of the signature on the PDF
    const signatureWidthMm = 50  
    const signatureHeightMm = 15

    // Margin from the left side of the page
    const marginMm = 12.7 
    
    // This defines the "Client Column" width (usually left half of page)
    const columnWidthMm = 85 

    // CALCULATIONS:
    
    // 1. Calculate Y (Vertical) - shared with Admin line
    const signatureY = signatureYFromBottomMm * mmToPoints

    // 2. Calculate X (Horizontal) - Center in the Left Column
    // Formula: Margin + (ColumnWidth - ImageWidth) / 2
    const clientSignatureXMm = marginMm + (columnWidthMm - signatureWidthMm) / 2
    const clientSignatureX = clientSignatureXMm * mmToPoints

    // Draw the signature
    lastPage.drawImage(signatureImage, {
      x: clientSignatureX,
      y: signatureY,
      width: signatureWidthMm * mmToPoints,
      height: signatureHeightMm * mmToPoints,
    })
    
    console.log(`[v0] Signature placed at X: ${clientSignatureXMm}mm, Y: ${signatureYFromBottomMm}mm (Bottom-Left origin)`)
    // --- POSITIONING LOGIC END ---

    // 9. Save PDF
    const pdfBytes = await pdfDoc.save()
    
    // 10. Upload Signed PDF
    const timestamp = Date.now()
    const filename = `${timestamp}-signed-${agreementId}.pdf`
    const bucket = "rental-contracts"
    
    let { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from(bucket)
      .upload(filename, pdfBytes, { contentType: "application/pdf", upsert: false })

    // Handle "Bucket not found"
    if (uploadError && uploadError.message.includes("not found")) {
      await adminSupabase.storage.createBucket(bucket, { public: true })
      const retry = await adminSupabase.storage
        .from(bucket)
        .upload(filename, pdfBytes, { contentType: "application/pdf", upsert: false })
      uploadData = retry.data
      uploadError = retry.error
    }

    if (uploadError || !uploadData) {
      throw new Error("Failed to upload signed PDF to storage.")
    }

    // 11. Generate Public/Signed URL
    const filePath = uploadData.path
    let finalPdfUrl = ""
    
    const { data: publicUrlData } = adminSupabase.storage.from(bucket).getPublicUrl(filePath)
    
    // Check if public URL works
    try {
      const check = await fetch(publicUrlData.publicUrl, { method: "HEAD" })
      if (check.ok) {
        finalPdfUrl = publicUrlData.publicUrl
      } else {
        throw new Error("Public access failed")
      }
    } catch {
      // Fallback to signed URL (1 year validity)
      const { data: signedData } = await adminSupabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 31536000)
      finalPdfUrl = signedData?.signedUrl || ""
    }

    if (!finalPdfUrl) throw new Error("Could not generate accessible URL for signed PDF")

    // 12. Update Database
    await adminSupabase
      .from("agreements")
      .update({ signed_agreement_url: finalPdfUrl, status: "signed" })
      .eq("id", agreementId)

    if (agreement.bookingId) {
      await adminSupabase.from("bookings").update({ status: "On Rent" }).eq("id", agreement.bookingId)
    }

    console.log("[v0] ===== generateSignedPdfAction SUCCESS =====")
    return { success: true, signedPdfUrl: finalPdfUrl }

  } catch (error) {
    console.error("[v0] ===== generateSignedPdfAction ERROR =====")
    console.error(error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}