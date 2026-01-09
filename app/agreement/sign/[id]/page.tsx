"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, CheckCircle, Download, Loader2, Camera, X } from "lucide-react"
import { getAgreementByIdAction } from "@/app/actions/agreements"
import { getBookingsAction, getCarsAction } from "@/app/actions/database"
import { toast } from "sonner"
import Image from "next/image"
import { generateRentalAgreementPDF, type AgreementData } from "@/lib/pdf-generator"
import SignatureCanvas from "react-signature-canvas"

export default function SignAgreementPage() {
  const params = useParams()
  const router = useRouter()
  const agreementId = params.id as string
  const signaturePadRef = useRef<any>(null)
  const [agreement, setAgreement] = useState<any>(null)
  const [booking, setBooking] = useState<any>(null)
  const [car, setCar] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [customerSignature, setCustomerSignature] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (agreementId) {
      loadAgreement()
    }
  }, [agreementId])

  const loadAgreement = async () => {
    if (!agreementId) return
    setIsLoading(true)
    try {
      const agreementData = await getAgreementByIdAction(agreementId)

      if (!agreementData) {
        toast.error("Agreement not found")
        router.push("/dashboard")
        return
      }

      if (agreementData.status === "signed") {
        toast.info("This agreement has already been signed")
        router.push(`/agreement/success/${agreementId}`)
        return
      }

      setAgreement(agreementData)

      const [bookingsData, carsData] = await Promise.all([getBookingsAction(), getCarsAction()])

      const bookingData = bookingsData.find((b: any) => b.id === agreementData.bookingId)
      const carData = carsData.find((c: any) => c.id === bookingData?.carId || c.id === bookingData?.car_id)

      setBooking(bookingData)
      setCar(carData)
      setCustomerName(bookingData?.customerName || bookingData?.customer_name || "")
    } catch (error) {
      console.error("[Sign Agreement] Error loading:", error)
      toast.error("Failed to load agreement")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSign = async () => {
    // Validate name
    if (!customerName.trim()) {
      toast.error("Please enter your full name")
      return
    }

    // Validate signature
    if (!customerSignature) {
      toast.error("Please draw and confirm your signature")
      return
    }

    // Validate terms
    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions")
      return
    }

    setIsSigning(true)

    try {
      console.log("[Sign Agreement] Starting signing process...")

      // Update agreement status to "signed" with signature
      const updateResponse = await fetch(`/api/agreements/${agreementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "signed",
          signed_at: new Date().toISOString(),
          customer_signature_data: customerSignature,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}))
        console.error("[Sign Agreement] Failed to update agreement:", updateResponse.status, errorData)
        toast.error(errorData.error || "Failed to sign agreement")
        setIsSigning(false)
        return
      }

      console.log("[Sign Agreement] Agreement signed successfully")

      // Generate PDF
      toast.info("Generating agreement PDF...")
      
      const { getCompanySettings } = await import("@/app/actions/company-settings")
      const companySettings = await getCompanySettings()
      
      const pdfData: AgreementData = {
        company_name: companySettings?.company_name || "Sedulous Group LTD",
        company_address: companySettings?.company_address || "200 Burnt Oak Broadway, Edgware, HA8 0AP, United Kingdom",
        company_phone: companySettings?.company_phone || "020 8952 6908",
        company_email: companySettings?.company_email || "info@sedulousgroupltd.co.uk",
        customer_name: booking?.customerName || booking?.customer_name || customerName,
        customer_email: booking?.customerEmail || booking?.customer_email || "",
        customer_phone: booking?.customerPhone || booking?.customer_phone || "",
        customer_license: booking?.drivingLicenseNumber || booking?.driving_license_number || "N/A",
        customer_address: booking?.customerAddress || booking?.customer_address || "",
        vehicle: `${car?.brand || ""} ${car?.name || ""}`.trim(),
        registration: car?.registration || "",
        odometer: agreement?.odometerReading?.toString() || "0",
        fuel: agreement?.fuelLevel || "Full",
        pickup_date: new Date(booking?.pickupDate || booking?.pickup_date).toLocaleDateString("en-GB"),
        pickup_time: booking?.pickupTime || booking?.pickup_time || "",
        dropoff_date: new Date(booking?.dropoffDate || booking?.dropoff_date).toLocaleDateString("en-GB"),
        dropoff_time: booking?.dropoffTime || booking?.dropoff_time || "",
        pickup_location: booking?.pickupLocation || booking?.pickup_location || "",
        dropoff_location: booking?.dropoffLocation || booking?.dropoff_location || "",
        insurance_text: "I DECLARE THAT I have not had a proposal declined, a policy cancelled, nor renewal refused nor been required to pay an increased premium nor had special conditions imposed by any motor insurer. I have not been convicted of any motoring offense (other than a maximum of 2 speeding offenses) during the past 5 years nor had my license suspended during the past 10 years and there is no prosecution pending. I do not have any physical nor mental defect nor infirmity nor suffer from diabetes, fits nor any heart complaint. I have not had any accidents and/or claims exceeding £3000 in the past 36 calendar months, and I further declare that to the best of my knowledge and belief no information has been withheld which would influence the provision of motor insurance to me and this declaration shall form the basis of the contract of insurance.",
        terms: [
          "1. When you sign the form you accept the conditions set out in this rental agreement.",
          "2. You will have the vehicle for the rental period shown in the agreement.",
          "3. You must look after the vehicle and the keys.",
          "4. The vehicle must only be driven by named drivers.",
          "5. You will pay all charges, damages, fines, and administration costs.",
          "6. In the event of an accident, do not admit liability and inform us immediately.",
          "7. This agreement is governed by the laws of the country in which it is signed.",
        ],
        agreement_number: agreement.agreementNumber,
        created_date: new Date(agreement.createdAt).toLocaleDateString("en-GB"),
        customer_name_signed: customerName,
        customer_signature: customerSignature,
      }
      
      // Generate PDF
      const logoPath = companySettings?.logo_url || "/sed.jpg"
      const pdfDoc = await generateRentalAgreementPDF(pdfData, logoPath)
      const pdfBlob = pdfDoc.output("blob")
      
      // Download PDF
      const downloadUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `agreement-${agreement.agreementNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
      
      // Upload PDF to server
      const uploadFormData = new FormData()
      uploadFormData.append("file", pdfBlob, `agreement-${agreementId}-${Date.now()}.pdf`)
      
      try {
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          
          // Update agreement with PDF URL
          await fetch(`/api/agreements/${agreementId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              signed_agreement_url: uploadResult.url,
            }),
          })
          
          toast.success("Agreement signed! PDF downloaded.")
          const successUrl = `/agreement/success/${agreementId}?signedPdf=${encodeURIComponent(uploadResult.url)}`
          router.push(successUrl)
          return
        }
      } catch (uploadError) {
        console.error("[Sign Agreement] Error uploading PDF:", uploadError)
      }
      
      toast.success("Agreement signed! PDF downloaded.")
      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push(`/agreement/success/${agreementId}`)
      
    } catch (error) {
      console.error("[Sign Agreement] Error:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while signing")
      setIsSigning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-white/70">Loading agreement...</p>
        </div>
      </div>
    )
  }

  if (!agreement || !booking || !car) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2 text-white">Agreement Not Found</h2>
          <Button onClick={() => router.push("/dashboard")} variant="outline" className="mt-4 border-white/20 text-white">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image src="/images/dna-group-logo.png" alt="Sedulous Group" width={150} height={50} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sign Rental Agreement</h1>
          <p className="text-white/70">Agreement #{agreement.agreementNumber}</p>
        </div>

        {/* Main Card */}
        <Card className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg p-6 md:p-8 mb-6">
          {/* Vehicle Info */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              {car.image && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                  <Image src={car.image} alt={car.name} fill className="object-cover" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{car.brand} {car.name}</h2>
                <p className="text-white/60">{car.category}</p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Pickup Date</p>
              <p className="text-white font-medium">
                {new Date(booking.pickupDate || booking.pickup_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Return Date</p>
              <p className="text-white font-medium">
                {new Date(booking.dropoffDate || booking.dropoff_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Total Amount</p>
              <p className="text-red-500 font-bold text-xl">£{booking.totalAmount?.toFixed(2) || "0.00"}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Booking Type</p>
              <p className="text-white font-medium">{booking.bookingType || "Rent"}</p>
            </div>
          </div>

          {/* Vehicle Condition Photos Section */}
          {((agreement.vehiclePhotos && agreement.vehiclePhotos.length > 0) || 
            (agreement.vehicle_photos && agreement.vehicle_photos.length > 0)) && (
            <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Car Condition Photos</h3>
                  <p className="text-white/50 text-sm">
                    {(agreement.vehiclePhotos || agreement.vehicle_photos).length} photos taken at handover
                  </p>
                </div>
              </div>
              <p className="text-white/60 text-sm mb-4">
                Please review the vehicle condition photos below. These images document the car&apos;s state at the time of pickup.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(agreement.vehiclePhotos || agreement.vehicle_photos).map((photoUrl: string, index: number) => (
                  <div 
                    key={index} 
                    className="relative aspect-square rounded-lg overflow-hidden border border-white/20 cursor-pointer hover:border-red-500 transition-all group"
                    onClick={() => setSelectedImage(photoUrl)}
                  >
                    <Image
                      src={photoUrl}
                      alt={`Vehicle photo ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                      <span className="text-white text-xs font-medium">Click to view</span>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {index + 1}/{(agreement.vehiclePhotos || agreement.vehicle_photos).length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Preview Modal */}
          {selectedImage && (
            <div 
              className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 cursor-pointer"
              onClick={() => setSelectedImage(null)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImage(null)
                }}
                className="absolute top-4 right-4 z-[10000] text-white hover:text-red-400 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors pointer-events-auto"
              >
                <X className="h-8 w-8" />
              </button>
              <div 
                className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center pointer-events-none"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={selectedImage}
                  alt="Vehicle photo preview"
                  fill
                  className="object-contain pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/50 px-4 py-2 rounded-full">
                Click anywhere or ✕ to close
              </div>
            </div>
          )}

          {/* Customer Name */}
          <div className="mb-6">
            <Label htmlFor="name" className="text-white mb-2 block">
              Full Name *
            </Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your full name"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          {/* Signature Section */}
          <div className="mb-6 space-y-3">
            <Label className="text-white">Your Signature *</Label>
            <div className="border-2 border-zinc-700 rounded-lg bg-white p-2 overflow-x-auto">
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{ width: 500, height: 150, className: "border border-gray-300 rounded" }}
                backgroundColor="#ffffff"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => signaturePadRef.current?.clear()}
                variant="outline"
                className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                Clear Signature
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
                    const signatureData = signaturePadRef.current.toDataURL()
                    setCustomerSignature(signatureData)
                    toast.success("Signature confirmed!")
                  } else {
                    toast.error("Please draw your signature first")
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Confirm Signature
              </Button>
            </div>
          </div>

          {customerSignature && (
            <div className="mb-6 p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm">
              ✓ Signature captured
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="mb-6">
            <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-lg p-4">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-white/90 leading-relaxed cursor-pointer flex-1">
                I have read, understood, and agree to all the terms and conditions of this rental agreement. I confirm
                that all information provided is accurate and I accept full responsibility for the vehicle during the
                rental period.
              </Label>
            </div>
          </div>

          {/* Sign Button */}
          <Button
            onClick={handleSign}
            disabled={isSigning || !customerName.trim() || !termsAccepted || !customerSignature}
            className="w-full bg-red-500 hover:bg-red-600 text-white h-14 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Signing Agreement...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Sign Agreement
              </>
            )}
          </Button>
        </Card>

        <div className="text-center text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} Sedulous Group Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
