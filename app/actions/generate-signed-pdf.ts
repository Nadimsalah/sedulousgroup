"use server"

import { PDFDocument } from "pdf-lib"
import { db } from "@/lib/database"
import { getBookingsAction, getCarsAction } from "./database"

export async function generateSignedPdfAction(agreementId: string) {
  console.log("[v0] ===== generateSignedPdfAction START =====")
  console.log("[v0] Agreement ID:", agreementId)
  const startTime = Date.now()

  try {
    // Get agreement
    const agreement = await db.getAgreementById(agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found" }
    }

    // Get the existing unsigned PDF URL (this has the logo and all content)
    const unsignedPdfUrl = agreement.unsignedAgreementUrl || (agreement as any).unsigned_agreement_url
    if (!unsignedPdfUrl) {
      return { success: false, error: "Original agreement PDF not found. Please contact support." }
    }

    console.log("[v0] Loading existing PDF from:", unsignedPdfUrl)

    // Get booking and car data
    const [bookings, cars] = await Promise.all([getBookingsAction(), getCarsAction()])
    const booking = bookings.find((b: any) => b.id === agreement.bookingId)
    const car = cars.find((c: any) => c.id === booking?.carId || c.id === booking?.car_id)

    if (!booking || !car) {
      return { success: false, error: "Booking or car data not found" }
    }

    // Get customer signature URL from database
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase credentials")
    }
    
    const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    
    // Get raw agreement data to find customer signature
    const { data: rawAgreement, error: rawError } = await adminSupabase
      .from("agreements")
      .select("*")
      .eq("id", agreementId)
      .single()
    
    if (rawError || !rawAgreement) {
      return { success: false, error: "Failed to fetch agreement data" }
    }
    
    // Get customer signature - can be base64, URL, or in JSON structure
    let customerSignatureData: string | null = null
    
    // First, check customer_signature_data
    const signatureData = rawAgreement.customer_signature_data
    if (signatureData) {
      // Check if it's base64 (starts with data:image)
      if (signatureData.startsWith('data:image')) {
        customerSignatureData = signatureData
        console.log("[v0] Found customer signature as base64 in customer_signature_data")
      }
      // Check if it's a JSON string with both signatures
      else {
        try {
          const parsed = JSON.parse(signatureData)
          if (parsed.customer_signature && typeof parsed.customer_signature === 'string') {
            // Check if it's base64 or URL
            if (parsed.customer_signature.startsWith('data:image')) {
              customerSignatureData = parsed.customer_signature
              console.log("[v0] Found customer signature as base64 in JSON structure")
            } else if (parsed.customer_signature.startsWith('http')) {
              customerSignatureData = parsed.customer_signature
              console.log("[v0] Found customer signature as URL in JSON structure")
            }
          }
        } catch {
          // Not JSON, check if it's a direct URL (not base64, not PDF)
          if (signatureData.startsWith('http') && !signatureData.endsWith('.pdf') && !signatureData.includes('.pdf?')) {
            customerSignatureData = signatureData
            console.log("[v0] Found customer signature as direct URL in customer_signature_data")
          }
        }
      }
    }
    
    // If not found, check signed_agreement_url (but only if it's not a PDF)
    if (!customerSignatureData) {
      const signedUrl = rawAgreement.signed_agreement_url
      if (signedUrl && !signedUrl.endsWith('.pdf') && !signedUrl.includes('.pdf?') && signedUrl.startsWith('http')) {
        customerSignatureData = signedUrl
        console.log("[v0] Found customer signature in signed_agreement_url")
      }
    }
    
    // Final check
    if (!customerSignatureData) {
      console.error("[v0] Customer signature not found.")
      console.error("[v0] - signed_agreement_url:", rawAgreement.signed_agreement_url?.substring(0, 100))
<<<<<<< Current (Your changes)
      console.error("[v0] - customer_signature_data:", rawAgreement.customer_signature_data?.substring(0, 100))
      return { success: false, error: "Customer signature not found. Please sign the agreement again." }
    }
    
    console.log("[v0] Customer signature found, type:", customerSignatureData.startsWith('data:image') ? 'base64' : 'URL', "Preview:", customerSignatureData.substring(0, 100))
=======
      console.error("[v0] - customer_signature_data type:", typeof rawAgreement.customer_signature_data)
      console.error("[v0] - customer_signature_data length:", rawAgreement.customer_signature_data?.length || 0)
      console.error("[v0] - customer_signature_data preview:", rawAgreement.customer_signature_data?.substring(0, 200) || 'null/undefined')
      return { success: false, error: "Customer signature not found. Please sign the agreement again." }
    }
    
    console.log("[v0] Customer signature found, type:", customerSignatureData.startsWith('data:image') ? 'base64' : 'URL', "Length:", customerSignatureData.length, "Preview:", customerSignatureData.substring(0, 100))
>>>>>>> Incoming (Background Agent changes)
    console.log("[v0] Unsigned PDF URL:", unsignedPdfUrl)
    
    // Load the existing PDF - handle both public URLs and signed URLs
    let unsignedPdfBytes: ArrayBuffer
    
    try {
      let pdfResponse = await fetch(unsignedPdfUrl)
      if (!pdfResponse.ok) {
        console.error("[v0] Failed to fetch unsigned PDF, status:", pdfResponse.status, pdfResponse.statusText)
        // Try to get a signed URL if it's a Supabase storage URL
        if (unsignedPdfUrl.includes('supabase.co') && unsignedPdfUrl.includes('/storage/')) {
          // Extract bucket and path from URL
          // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
          // or: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]?token=...
          const publicMatch = unsignedPdfUrl.match(/\/storage\/v1\/object\/public\/([^?]+)/)
          const signMatch = unsignedPdfUrl.match(/\/storage\/v1\/object\/sign\/([^?]+)/)
          
          let bucket: string | null = null
          let filePath: string | null = null
          
          if (publicMatch) {
            const fullPath = publicMatch[1]
            const pathParts = fullPath.split('/')
            bucket = pathParts[0]
            filePath = pathParts.slice(1).join('/')
          } else if (signMatch) {
            const fullPath = signMatch[1]
            const pathParts = fullPath.split('/')
            bucket = pathParts[0]
            filePath = pathParts.slice(1).join('/')
          }
          
          if (bucket && filePath) {
            console.log("[v0] Trying to create signed URL for unsigned PDF - Bucket:", bucket, "Path:", filePath)
            
            const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
              .from(bucket)
              .createSignedUrl(filePath, 3600)
            
            if (signedUrlError) {
              console.error("[v0] Error creating signed URL for unsigned PDF:", signedUrlError)
              return { success: false, error: `Failed to load original PDF: ${signedUrlError.message}` }
            }
            
            if (signedUrlData?.signedUrl) {
              console.log("[v0] Using signed URL for unsigned PDF")
              pdfResponse = await fetch(signedUrlData.signedUrl)
              if (!pdfResponse.ok) {
                return { success: false, error: `Failed to load original PDF: ${pdfResponse.statusText}` }
              }
            } else {
              return { success: false, error: `Failed to load original PDF: Could not create signed URL` }
            }
          } else {
            return { success: false, error: `Failed to load original PDF: Could not parse URL - ${unsignedPdfUrl.substring(0, 100)}` }
          }
        } else {
          return { success: false, error: `Failed to load original PDF: ${pdfResponse.statusText}` }
        }
      }
      
      unsignedPdfBytes = await pdfResponse.arrayBuffer()
      console.log("[v0] Loaded unsigned PDF, size:", unsignedPdfBytes.byteLength, "bytes")
    } catch (fetchError) {
      console.error("[v0] Error fetching unsigned PDF:", fetchError)
      return { success: false, error: `Failed to load original PDF: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` }
    }
    
    const pdfDoc = await PDFDocument.load(unsignedPdfBytes)
    
    // Load customer signature image
    let signatureImageBytes: ArrayBuffer
    
    // Check if signature is base64
    if (customerSignatureData.startsWith('data:image')) {
      console.log("[v0] Signature is base64, converting to ArrayBuffer...")
      try {
        // Extract base64 data (remove data:image/png;base64, prefix)
        const base64Data = customerSignatureData.split(',')[1]
        if (!base64Data) {
          return { success: false, error: "Invalid base64 signature format" }
        }
        // Convert base64 to ArrayBuffer using Buffer (Node.js)
        const buffer = Buffer.from(base64Data, 'base64')
        signatureImageBytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
        console.log("[v0] Base64 signature converted to ArrayBuffer, size:", signatureImageBytes.byteLength, "bytes")
      } catch (base64Error) {
        console.error("[v0] Error converting base64 signature:", base64Error)
        return { success: false, error: `Failed to convert base64 signature: ${base64Error instanceof Error ? base64Error.message : 'Unknown error'}` }
      }
    } else {
      // It's a URL, fetch it
      console.log("[v0] Fetching signature image from URL:", customerSignatureData.substring(0, 100))
      let signatureResponse: Response
      
      try {
        // Check if it's a Supabase storage URL
        if (customerSignatureData.includes('supabase.co') && customerSignatureData.includes('/storage/')) {
          // Extract bucket and path from URL
          const publicMatch = customerSignatureData.match(/\/storage\/v1\/object\/public\/([^?]+)/)
          const signMatch = customerSignatureData.match(/\/storage\/v1\/object\/sign\/([^?]+)/)
          
          let bucket: string | null = null
          let filePath: string | null = null
          
          if (publicMatch) {
            const fullPath = publicMatch[1]
            const pathParts = fullPath.split('/')
            bucket = pathParts[0]
            filePath = pathParts.slice(1).join('/')
          } else if (signMatch) {
            const fullPath = signMatch[1]
            const pathParts = fullPath.split('/')
            bucket = pathParts[0]
            filePath = pathParts.slice(1).join('/')
          }
          
          if (bucket && filePath) {
            console.log("[v0] Downloading signature from Supabase storage - Bucket:", bucket, "Path:", filePath)
            
            // Download directly using admin client
            const { data: fileData, error: downloadError } = await adminSupabase.storage
              .from(bucket)
              .download(filePath)
            
            if (downloadError) {
              console.error("[v0] Error downloading signature from storage:", downloadError)
              // Fallback to creating signed URL
              const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
                .from(bucket)
                .createSignedUrl(filePath, 3600)
              
              if (signedUrlError || !signedUrlData?.signedUrl) {
                return { success: false, error: `Failed to load signature: ${downloadError?.message || signedUrlError?.message || 'Unknown error'}` }
              }
              
              signatureResponse = await fetch(signedUrlData.signedUrl)
            } else {
              // Convert Blob to ArrayBuffer
              signatureImageBytes = await fileData.arrayBuffer()
              console.log("[v0] Signature downloaded from storage, size:", signatureImageBytes.byteLength, "bytes")
            }
          } else {
            // Not a Supabase storage URL, try direct fetch
            signatureResponse = await fetch(customerSignatureData)
          }
        } else {
          // Not a Supabase URL, try direct fetch
          signatureResponse = await fetch(customerSignatureData)
        }
        
        // If we need to fetch (not already downloaded from storage)
        if (!signatureImageBytes && signatureResponse) {
          if (!signatureResponse.ok) {
            console.error("[v0] Signature fetch failed:", signatureResponse.status, signatureResponse.statusText)
            return { success: false, error: `Failed to load signature image: ${signatureResponse.status} ${signatureResponse.statusText}` }
          }
          signatureImageBytes = await signatureResponse.arrayBuffer()
          console.log("[v0] Signature image loaded from URL, size:", signatureImageBytes.byteLength, "bytes")
        }
      } catch (fetchError) {
        console.error("[v0] Error fetching signature:", fetchError)
        return { success: false, error: `Failed to fetch signature image: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` }
      }
    }
    
    if (!signatureImageBytes) {
      return { success: false, error: "Failed to load signature image: No data received" }
    }
    
    let signatureImage: any
    try {
      console.log("[v0] Embedding signature image as PNG...")
      signatureImage = await pdfDoc.embedPng(signatureImageBytes)
      console.log("[v0] Signature embedded as PNG successfully")
    } catch (pngError) {
      console.log("[v0] PNG embedding failed, trying JPEG...", pngError)
      try {
        signatureImage = await pdfDoc.embedJpg(signatureImageBytes)
        console.log("[v0] Signature embedded as JPEG successfully")
      } catch (jpgError) {
        console.error("[v0] Both PNG and JPEG embedding failed:", jpgError)
        return { success: false, error: `Failed to embed signature image. PNG error: ${pngError instanceof Error ? pngError.message : 'Unknown'}, JPEG error: ${jpgError instanceof Error ? jpgError.message : 'Unknown'}` }
      }
    }
    
    // Get the last page (where signatures are)
    const pages = pdfDoc.getPages()
    const lastPage = pages[pages.length - 1]
    const { width, height } = lastPage.getSize()
    
    // Signature position (left side, Client Signature area)
    // In jsPDF: margin = 36/2.83465 ≈ 12.7mm ≈ 36 points
    // sigTableY is calculated from top, signatureY = sigTableY + 12
    // In pdf-lib, coordinates are from bottom-left, so we need to convert
    
    // Approximate signature box position (from bottom)
    // The signature table is near the bottom of the page
    // Based on jsPDF layout: margin (36pt) from top, signature area is ~100-150pt from bottom
    const marginPoints = 36 // margin in points
    const sigTableYFromTop = height - 120 // Approximate position from top (will be converted)
    const signatureYFromTop = sigTableYFromTop + 12 // signatureY = sigTableY + 12
    
    // Convert to pdf-lib coordinates (from bottom)
    const signatureY = height - signatureYFromTop
    
    // Signature dimensions (60mm width, max 20mm height as in jsPDF)
    const signatureWidthPoints = 60 * 2.83465 // 60mm to points
    const signatureHeightPoints = Math.min(
      (signatureImage.height / signatureImage.width) * signatureWidthPoints,
      20 * 2.83465 // Max 20mm height
    )
    
    const signatureX = marginPoints + 10 // margin + 10 (as in jsPDF)
    
    // Add signature image to PDF
    lastPage.drawImage(signatureImage, {
      x: signatureX,
      y: signatureY - signatureHeightPoints, // Adjust for image height
      width: signatureWidthPoints,
      height: signatureHeightPoints,
    })
    
    console.log("[v0] Customer signature added at:", {
      x: signatureX,
      y: signatureY - signatureHeightPoints,
      width: signatureWidthPoints,
      height: signatureHeightPoints,
    })
    
    console.log("[v0] Customer signature added to existing PDF")

    // Save the modified PDF
    console.log("[v0] Saving PDF document...")
    let pdfBytes: Uint8Array
    try {
      pdfBytes = await pdfDoc.save()
      console.log("[v0] PDF document saved, size:", pdfBytes.length, "bytes")
    } catch (saveError) {
      console.error("[v0] Error saving PDF:", saveError)
      return { success: false, error: `Failed to save PDF: ${saveError instanceof Error ? saveError.message : 'Unknown error'}` }
    }
    
    // Generate unique filename matching /api/upload format: timestamp-filename
    const timestamp = Date.now()
    const sanitizedName = `signed-agreement-${agreementId}.pdf`.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFilename = `${timestamp}-${sanitizedName}`
    
    console.log("[v0] PDF bytes generated, size:", pdfBytes.length, "bytes")
    console.log("[v0] Uploading with filename:", uniqueFilename)
    
    // Upload directly to Supabase Storage (reuse existing adminSupabase client from above)
    // Use same bucket and method as /api/upload
    const bucket = "rental-contracts"
    
    // Supabase accepts Uint8Array, ArrayBuffer, Blob, or File
    // pdfBytes is already Uint8Array from pdfDoc.save()
    
    // Upload PDF - use same method as /api/upload
    let { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from(bucket)
      .upload(uniqueFilename, pdfBytes, {
        cacheControl: "3600",
        upsert: false, // Same as /api/upload
        contentType: "application/pdf",
      })

    // If bucket doesn't exist, try to create it (same logic as /api/upload)
    if (uploadError && (uploadError.message.includes("Bucket not found") || uploadError.message.includes("not found"))) {
      console.log("[v0] Bucket not found, attempting to create bucket:", bucket)
      
      const { error: createError } = await adminSupabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: null,
        fileSizeLimit: 10485760, // 10MB
      })

      if (createError) {
        console.error("[v0] Failed to create bucket:", createError)
        throw new Error(`Failed to create storage bucket: ${createError.message}`)
      }

      console.log("[v0] Bucket created successfully, retrying upload")
      
      // Retry upload after creating bucket
      const retryResult = await adminSupabase.storage
        .from(bucket)
        .upload(uniqueFilename, pdfBytes, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf",
        })
      
      if (retryResult.error) {
        throw new Error(`Failed to upload file after creating bucket: ${retryResult.error.message}`)
      }
      
      uploadData = retryResult.data
      uploadError = null
    }

    if (uploadError) {
      console.error("[v0] Supabase upload error for signed PDF:", uploadError)
      throw new Error(`Failed to upload signed PDF: ${uploadError.message}`)
    }

    if (!uploadData) {
      throw new Error("Upload succeeded but no data returned")
    }

    console.log("[v0] Upload successful - Upload data:", JSON.stringify(uploadData, null, 2))

    // Use the actual path from uploadData if available, otherwise use uniqueFilename
    // uploadData.path is the actual path Supabase stored the file at
    const filePath = uploadData.path || uniqueFilename
    console.log("[v0] Using file path for URL generation:", filePath)

    // Try public URL first (since unsigned PDFs work with public URLs, bucket should be public)
    const { data: publicUrlData } = adminSupabase.storage.from(bucket).getPublicUrl(filePath)
    const publicUrl = publicUrlData.publicUrl
    console.log("[v0] Generated public URL:", publicUrl)
    
    // Verify the public URL is accessible
    let finalUrl = publicUrl
    let usePublicUrl = false
    
    try {
      const testResponse = await fetch(publicUrl, { method: "HEAD" })
      if (testResponse.ok) {
        console.log("[v0] ✓ Public URL is accessible")
        usePublicUrl = true
        finalUrl = publicUrl
      } else {
        console.warn("[v0] ⚠ Public URL returned status:", testResponse.status, "Response:", testResponse.statusText)
        // Public URL doesn't work, use signed URL instead
        usePublicUrl = false
      }
    } catch (urlTestError) {
      console.warn("[v0] ⚠ Could not verify public URL accessibility:", urlTestError)
      // Public URL test failed, use signed URL instead
      usePublicUrl = false
    }

    // If public URL doesn't work, use signed URL (works regardless of bucket public settings)
    if (!usePublicUrl) {
      console.log("[v0] Public URL not accessible, using signed URL instead")
      const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 31536000) // 1 year expiration
      
      if (signedUrlError) {
        console.error("[v0] Error creating signed URL:", signedUrlError)
        // Use public URL anyway as last resort
        console.log("[v0] Using public URL as last resort")
        finalUrl = publicUrl
      } else if (signedUrlData?.signedUrl) {
        finalUrl = signedUrlData.signedUrl
        console.log("[v0] Using signed URL (first 100 chars):", finalUrl.substring(0, 100))
      } else {
        console.warn("[v0] ⚠ Could not create signed URL, using public URL")
        finalUrl = publicUrl
      }
    }

    const signedPdfUrl = finalUrl
    console.log("[v0] Final PDF URL (first 100 chars):", signedPdfUrl.substring(0, 100))

    // Update agreement with PDF URL using direct database update to ensure it's saved
    const { error: updateError } = await adminSupabase
      .from("agreements")
      .update({
        signed_agreement_url: signedPdfUrl,
        status: "signed",
      })
      .eq("id", agreementId)

    if (updateError) {
      console.error("[v0] Error updating agreement with signed PDF URL:", updateError)
      throw new Error(`Failed to update agreement: ${updateError.message}`)
    }

    console.log("[v0] Agreement updated successfully with signed PDF URL:", signedPdfUrl)
    
    // Verify the PDF URL is accessible
    try {
      const testResponse = await fetch(signedPdfUrl, { method: "HEAD" })
      if (testResponse.ok) {
        console.log("[v0] ✓ PDF URL is accessible")
      } else {
        console.warn("[v0] ⚠ PDF URL returned status:", testResponse.status)
      }
    } catch (urlTestError) {
      console.warn("[v0] ⚠ Could not verify PDF URL accessibility:", urlTestError)
    }
    
    // Also update booking status to On Rent (or Confirmed if that status exists)
    if (agreement.bookingId) {
      const { error: bookingUpdateError } = await adminSupabase
        .from("bookings")
        .update({ status: "On Rent" })
        .eq("id", agreement.bookingId)
      
      if (bookingUpdateError) {
        console.warn("[v0] Failed to update booking status:", bookingUpdateError)
      } else {
        console.log("[v0] Booking status updated to On Rent")
      }
    }

    const duration = Date.now() - startTime
    console.log("[v0] ===== generateSignedPdfAction SUCCESS =====")
    console.log("[v0] Duration:", duration, "ms")
    console.log("[v0] Signed PDF URL:", signedPdfUrl.substring(0, 100))
    
    return { success: true, signedPdfUrl }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("[v0] ===== generateSignedPdfAction ERROR =====")
    console.error("[v0] Duration:", duration, "ms")
    console.error("[v0] Error:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

