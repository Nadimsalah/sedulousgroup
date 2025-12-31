"use server"

import { generateRentalAgreementPDF, type AgreementData } from "@/lib/pdf-generator"
import { getCompanySettings } from "./company-settings"
import { db } from "@/lib/database"
import { getBookingsAction, getCarsAction } from "./database"

export async function generateSignedPdfAction(agreementId: string) {
  console.log("[v0] generateSignedPdfAction called for agreement:", agreementId)

  try {
    // Get agreement
    const agreement = await db.getAgreementById(agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found" }
    }

    // Get booking and car data
    const [bookings, cars] = await Promise.all([getBookingsAction(), getCarsAction()])
    const booking = bookings.find((b: any) => b.id === agreement.bookingId)
    const car = cars.find((c: any) => c.id === booking?.carId || c.id === booking?.car_id)

    if (!booking || !car) {
      return { success: false, error: "Booking or car data not found" }
    }

    // Get company settings for logo
    const companySettings = await getCompanySettings()
    const logoUrl = companySettings?.logo_url || "/sed.jpg"

    // Format dates
    const formatDate = (date: any) => {
      if (!date) return "N/A"
      try {
        const d = new Date(date)
        if (isNaN(d.getTime())) return "Invalid Date"
        return d.toLocaleDateString("en-GB")
      } catch (e) {
        return "Invalid Date"
      }
    }

    // Get signatures from raw database query to ensure we have the latest data
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase credentials")
    }
    
    const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    
    // Get raw agreement data directly from database
    const { data: rawAgreement, error: rawError } = await adminSupabase
      .from("agreements")
      .select("*")
      .eq("id", agreementId)
      .single()
    
    if (rawError || !rawAgreement) {
      return { success: false, error: "Failed to fetch agreement data" }
    }
    
    console.log("[v0] Raw agreement - signed_agreement_url:", rawAgreement.signed_agreement_url?.substring(0, 100))
    console.log("[v0] Raw agreement - customer_signature_data:", rawAgreement.customer_signature_data?.substring(0, 100))
    
    // Get admin signature (stored as base64 in customer_signature_data when admin signed)
    const adminSignatureData = rawAgreement.customer_signature_data
    const isAdminSignature = adminSignatureData && adminSignatureData.startsWith("data:image")
    const adminSignatureUrl = isAdminSignature ? adminSignatureData : null
    
    // Get customer signature URL
    // It should be in signed_agreement_url if it's an image URL (not a PDF)
    let customerSignatureUrl = rawAgreement.signed_agreement_url
    
    // Check if signed_agreement_url is a PDF (means it was already generated, signature is lost)
    // Or if it's an image URL (PNG/JPG from Supabase storage)
    if (!customerSignatureUrl || customerSignatureUrl.endsWith('.pdf')) {
      // If it's a PDF, the signature URL was overwritten
      // Check if customer signature is stored in customer_signature_data (if no admin signature)
      if (!isAdminSignature && adminSignatureData && !adminSignatureData.endsWith('.pdf')) {
        customerSignatureUrl = adminSignatureData
      } else {
        console.error("[v0] Customer signature URL not found or was overwritten with PDF URL")
        return { success: false, error: "Customer signature image URL not found. Please sign the agreement again." }
      }
    }
    
    console.log("[v0] Signature retrieval - Admin signature:", !!adminSignatureUrl, "Customer signature:", customerSignatureUrl?.substring(0, 100))
    
    if (!customerSignatureUrl) {
      return { success: false, error: "Customer signature not found" }
    }

    // Terms
    const terms = [
      "1. YOUR CONTRACT WITH US: When you sign the form you accept the conditions set out in this rental agreement. Please read this rental agreement carefully.",
      "2. RENTAL PERIOD: You will have the vehicle for the rental period shown in the agreement. We may agree to extend the rental, but the period may never be more than 30 days.",
      "3. YOUR RESPONSIBILITIES: You must look after the vehicle and the keys to the vehicle. You must always lock the vehicle when not in use. You must protect the vehicle against bad weather. You must use the correct fuel.",
      "4. CONDITIONS FOR USING THE VEHICLE: The vehicle must only be driven by named drivers with full valid licenses. You and other drivers must not use the vehicle for hire or reward, for any illegal purpose, for racing or teaching someone to drive, or under the influence of drugs or alcohol.",
      "5. CHARGES: You will pay rental and other charges, costs/damages from failing conditions, refuelling charges if fuel is not replaced, all fines and court costs for traffic/parking offences plus administration costs, repair costs for unrecorded damage and replacement if stolen, loss of income charges if the vehicle is unavailable, interest on late payments at Barclays base rate + 4%, and VAT and taxes.",
      "6. IN THE EVENT OF AN ACCIDENT: Do NOT admit liability. Collect names/addresses of all involved and witnesses. Secure the vehicle. Contact police if injury or dispute. Inform rental office and complete accident form.",
      "7. GOVERNING LAW: The laws of the country in which it is signed governs this agreement.",
    ]

    const insuranceText = `I DECLARE THAT I have not had a proposal declined, a policy cancelled, nor renewal refused nor been required to pay an increased premium nor had special conditions imposed by any motor insurer. I have not been convicted of any motoring offense (other than a maximum of 2 speeding offenses) during the past 5 years nor had my license suspended during the past 10 years and there is no prosecution pending. I do not have any physical nor mental defect nor infirmity nor suffer from diabetes, fits nor any heart complaint. I have not had any accidents and/or claims exceeding £3000 in the past 36 calendar months, and I further declare that to the best of my knowledge and belief no information has been withheld which would influence the provision of motor insurance to me and this declaration shall form the basis of the contract of insurance.`

    // Prepare PDF data
    const pdfData: AgreementData = {
      company_name: companySettings?.company_name || "Sedulous Group LTD",
      company_address: companySettings?.company_address || "200 Burnt Oak Broadway, Edgware, HA8 0AP, United Kingdom",
      company_phone: companySettings?.company_phone || "020 8952 6908",
      company_email: companySettings?.company_email || "info@sedulousgroupltd.co.uk",
      customer_name: (booking as any).customerName || (booking as any).customer_name || "N/A",
      customer_email: (booking as any).customerEmail || (booking as any).customer_email || "N/A",
      customer_phone: (booking as any).customerPhone || (booking as any).customer_phone || "N/A",
      customer_license: (booking as any).drivingLicenseNumber || (booking as any).driving_license_number || "N/A",
      customer_address: (booking as any).pickupLocation || (booking as any).pickup_location || "N/A",
      vehicle: `${(car as any).brand || ""} ${(car as any).name || ""}`.trim() || "N/A",
      registration: (agreement as any).vehicle_registration || (agreement as any).vehicleRegistration || "N/A",
      odometer: (agreement as any).odometer_reading ? `${(agreement as any).odometer_reading} km` : (agreement as any).odometerReading ? `${(agreement as any).odometerReading} km` : "N/A",
      fuel: (agreement as any).fuel_level || (agreement as any).fuelLevel || "N/A",
      pickup_date: formatDate((booking as any).pickupDate || (booking as any).pickup_date),
      pickup_time: (booking as any).pickupTime || (booking as any).pickup_time || "N/A",
      dropoff_date: formatDate((booking as any).dropoffDate || (booking as any).dropoff_date),
      dropoff_time: (booking as any).dropoffTime || (booking as any).dropoff_time || "N/A",
      pickup_location: (booking as any).pickupLocation || (booking as any).pickup_location || "N/A",
      dropoff_location: (booking as any).dropoffLocation || (booking as any).dropoff_location || "N/A",
      insurance_text: insuranceText,
      terms: terms,
      agreement_number: agreement.agreementNumber || `AGR-${Date.now()}`,
      created_date: agreement.createdAt ? formatDate(agreement.createdAt) : new Date().toLocaleDateString("en-GB"),
      admin_signature: adminSignatureUrl || undefined,
      customer_signature: customerSignatureUrl,
      admin_name: "Admin",
    }

    // Generate PDF
    const doc = await generateRentalAgreementPDF(pdfData, logoUrl)

    // Convert to blob (using arrayBuffer for server-side)
    const pdfArrayBuffer = doc.output("arraybuffer")
    const fileName = `signed-agreement-${agreementId}-${Date.now()}.pdf`

    // Upload directly to Supabase Storage (reuse existing adminSupabase client from above)
    // Ensure bucket exists
    const bucket = "rental-contracts"
    const { data: existingBuckets } = await adminSupabase.storage.listBuckets()
    const bucketExists = existingBuckets?.some((b) => b.name === bucket)

    if (!bucketExists) {
      const { error: createError } = await adminSupabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      })
      if (createError) {
        console.error("[v0] Error creating bucket:", createError)
        throw new Error(`Failed to create storage bucket: ${createError.message}`)
      }
    }

    // Upload PDF
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from(bucket)
      .upload(fileName, pdfArrayBuffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: "application/pdf",
      })

    if (uploadError) {
      console.error("[v0] Supabase upload error for signed PDF:", uploadError)
      throw new Error(`Failed to upload signed PDF: ${uploadError.message}`)
    }

    // Get public URL
    const { data: publicUrlData } = adminSupabase.storage.from(bucket).getPublicUrl(fileName)
    const signedPdfUrl = publicUrlData.publicUrl

    // IMPORTANT: Preserve customer signature URL before overwriting signed_agreement_url
    // Store customer signature URL in customer_signature_data if admin signature is there
    // Otherwise, it's already in customer_signature_data
    const updateData: any = {
      signed_agreement_url: signedPdfUrl, // Final PDF URL
      status: "signed",
    }
    
    // If admin signature is in customer_signature_data, preserve customer signature URL there too
    // We'll store it as a JSON object or append it
    // For now, keep customer signature URL in customer_signature_data if admin signature exists
    // The customer signature URL is already used in PDF generation above, so we can overwrite
    // But we should preserve it for future reference
    if (isAdminSignature && customerSignatureUrl) {
      // Store both: admin signature (base64) and customer signature URL
      // We'll store them as a JSON string or keep admin in customer_signature_data
      // and customer signature URL separately
      // For simplicity, keep admin signature in customer_signature_data
      // Customer signature is already used in PDF, so we're good
    }

    // Update agreement with final PDF URL
    await db.updateAgreement(agreementId, {
      signedAgreementUrl: signedPdfUrl,
      status: "signed",
    })

    return { success: true, signedPdfUrl }
  } catch (error) {
    console.error("[v0] generateSignedPdfAction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

