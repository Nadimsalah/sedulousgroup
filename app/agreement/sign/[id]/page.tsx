"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Check, Download, CheckCircle, Eye, Loader2 } from "lucide-react"
import { getAgreementByIdAction, signAgreementAction } from "@/app/actions/agreements"
import { getBookingsAction, getCarsAction } from "@/app/actions/database"
import { toast } from "sonner"
import Image from "next/image"
import { generateRentalAgreementPDF, type AgreementData } from "@/lib/pdf-generator"

export default function SignAgreementPage() {
  const params = useParams()
  const router = useRouter()
  const agreementId = params.id as string
  const signatureRef = useRef<SignatureCanvas>(null)

  const [agreement, setAgreement] = useState<any>(null)
  const [booking, setBooking] = useState<any>(null)
  const [car, setCar] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)

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
        // Redirect to success page if already signed
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
      
      // Load preview PDF if available
      if (agreementData.unsignedAgreementUrl || agreementData.unsigned_agreement_url) {
        setPreviewPdfUrl(agreementData.unsignedAgreementUrl || agreementData.unsigned_agreement_url)
      }
    } catch (error) {
      console.error("[Sign Agreement] Error loading:", error)
      toast.error("Failed to load agreement")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearSignature = () => {
    signatureRef.current?.clear()
    setHasSignature(false)
  }

  // Check signature status periodically
  useEffect(() => {
    const checkSignature = () => {
      if (signatureRef.current) {
        const isEmpty = signatureRef.current.isEmpty()
        setHasSignature(!isEmpty)
      }
    }

    const interval = setInterval(checkSignature, 500)
    return () => clearInterval(interval)
  }, [])

  const handlePreview = async () => {
    if (!agreement || !booking || !car) return
    
    try {
      toast.info("Generating preview...")
      
      // Get company settings
      const { getCompanySettings } = await import("@/app/actions/company-settings")
      const companySettings = await getCompanySettings()
      
      // Prepare PDF data without signature
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
      }
      
      const logoPath = companySettings?.logo_url || "/sed.jpg"
      const pdfDoc = await generateRentalAgreementPDF(pdfData, logoPath)
      const pdfBlob = pdfDoc.output("blob")
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      setPreviewPdfUrl(pdfUrl)
      setShowPreview(true)
      toast.success("Preview generated")
    } catch (error) {
      console.error("[Sign Agreement] Error generating preview:", error)
      toast.error("Failed to generate preview")
    }
  }

  const handleSubmit = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Please draw your signature")
      return
    }

    if (!customerName.trim()) {
      toast.error("Please enter your name")
      return
    }

    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions")
      return
    }

    setIsSigning(true)

    try {
      // Get signature as base64
      const signatureDataUrl = signatureRef.current.toDataURL()
      
      if (!signatureDataUrl || signatureDataUrl.length < 100) {
        toast.error("Signature is invalid. Please draw your signature again.")
        setIsSigning(false)
        return
      }

      // Upload signature to storage
      const formData = new FormData()
      const blob = await fetch(signatureDataUrl).then((r) => r.blob())
      formData.append("file", blob, `signature-${agreementId}.png`)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload signature")
      }

      const { url: signatureUrl } = await uploadResponse.json()

      // Save signature to agreement (pass both URL and base64 for server-side PDF generation)
      const result = await signAgreementAction(agreementId, signatureUrl, customerName, signatureDataUrl)

      if (!result.success) {
        toast.error(result.error || "Failed to sign agreement")
        setIsSigning(false)
        return
      }

      // Generate PDF with signature immediately
      toast.info("Generating signed PDF...")
      
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
        customer_signature: signatureDataUrl,
        customer_name_signed: customerName,
      }
      
      const logoPath = companySettings?.logo_url || "/sed.jpg"
      const pdfDoc = await generateRentalAgreementPDF(pdfData, logoPath)
      const pdfBlob = pdfDoc.output("blob")
      
      // Trigger instant download
      const downloadUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `signed-agreement-${agreement.agreementNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
      
      // Upload PDF to server in background
      const uploadFormData = new FormData()
      uploadFormData.append("file", pdfBlob, `signed-agreement-${agreementId}-${Date.now()}.pdf`)
      
      fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })
        .then(async (res) => {
          if (res.ok) {
            const result = await res.json()
            // Update agreement with PDF URL
            await fetch(`/api/agreements/${agreementId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                signed_agreement_url: result.url,
                status: "signed",
              }),
            })
          }
        })
        .catch((err) => console.error("[Sign Agreement] Error uploading PDF:", err))
      
      toast.success("Agreement signed! PDF downloaded.")
      
      // Wait a moment then redirect
      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push(`/agreement/success/${agreementId}`)
      
    } catch (error) {
      console.error("[Sign Agreement] Error:", error)
      toast.error("An error occurred while signing")
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
          <Check className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-white">Agreement Not Found</h2>
          <p className="text-white/70 mb-4">The agreement you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/dashboard")} variant="outline" className="border-white/20 text-white">
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
          <h1 className="text-3xl font-bold text-white mb-2">Rental Agreement</h1>
          <p className="text-white/70">{agreement.agreementNumber}</p>
        </div>

        {/* Preview Button */}
        {previewPdfUrl && (
          <div className="mb-6 flex justify-center">
            <Button
              onClick={handlePreview}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Agreement PDF
            </Button>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && previewPdfUrl && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-black border border-white/10 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Agreement Preview</h2>
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  Close
                </Button>
              </div>
              <iframe
                src={previewPdfUrl}
                className="w-full h-[80vh] border border-white/10 rounded-lg"
                title="Agreement Preview"
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <Card className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg p-6 md:p-8 mb-6">
          {/* Booking Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Vehicle Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Vehicle:</span>
                  <span className="font-medium text-white">{car.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Category:</span>
                  <span className="font-medium text-white">{car.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Type:</span>
                  <span className="font-medium text-white">{booking.bookingType || "Rent"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Rental Period
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Pick-up:</span>
                  <span className="font-medium text-white">
                    {new Date(booking.pickupDate || booking.pickup_date).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Drop-off:</span>
                  <span className="font-medium text-white">
                    {new Date(booking.dropoffDate || booking.dropoff_date).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Total:</span>
                  <span className="font-medium text-red-500">£{booking.totalAmount?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-white mb-4">Terms and Conditions</h3>
            <div className="max-h-64 overflow-y-auto pr-4 space-y-3 text-white/90 text-sm">
              <p className="text-base leading-relaxed font-medium">By signing this agreement, you confirm that:</p>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                <li>You are at least 21 years old and hold a valid driving license</li>
                <li>All information provided is accurate and complete</li>
                <li>You will use the vehicle in accordance with UK road traffic laws</li>
                <li>You will return the vehicle in the same condition as received</li>
                <li>You accept responsibility for any damage, fines, or penalties incurred during the rental period</li>
                <li>You have read and agree to the full terms and conditions of this rental agreement</li>
                <li>Payment of £{booking.totalAmount?.toFixed(2) || "0.00"} is due as per the agreed payment schedule</li>
                <li>The vehicle must be returned with the same fuel level as at pickup, or refueling charges will apply</li>
                <li>Any damage to the vehicle will be charged at market rates for repairs</li>
                <li>Traffic violations, parking fines, and congestion charges are the responsibility of the renter</li>
              </ul>
            </div>
          </div>

          {/* Signature Section */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-base font-semibold mb-2 text-white block">
                Full Name *
              </Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-red-500"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold mb-3 block text-white">Digital Signature *</Label>
              <p className="text-sm text-white/70 mb-2">Please draw your signature in the box below:</p>
              <div className="border-2 border-white/20 rounded-lg bg-white p-2">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    width: 500,
                    height: 150,
                    className: "border border-gray-300 rounded w-full",
                  }}
                  backgroundColor="#ffffff"
                  penColor="#000000"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleClearSignature}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Clear
                </Button>
                {hasSignature && (
                  <div className="flex-1 flex items-center justify-center gap-2 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm px-4">
                    <CheckCircle className="h-4 w-4" />
                    Signature captured
                  </div>
                )}
              </div>
            </div>

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
                rental period. I understand that by signing this agreement, I am legally bound to these terms.
              </Label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSigning || !hasSignature || !customerName.trim() || !termsAccepted}
              className="w-full bg-red-500 hover:bg-red-600 text-white h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigning ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Signing Agreement...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-2" />
                  Sign Agreement
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className="text-center text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} Sedulous Group Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
