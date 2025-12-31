"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Check, X, CheckCircle, Download } from "lucide-react"
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

  useEffect(() => {
    if (agreementId) {
      loadAgreement()
    }
  }, [agreementId])

  const loadAgreement = async () => {
    if (!agreementId) return
    setIsLoading(true)
    const agreementData = await getAgreementByIdAction(agreementId)

    if (!agreementData) {
      toast.error("Agreement not found")
      return
    }

    if (agreementData.status === "signed") {
      toast.info("This agreement has already been signed")
    }

    setAgreement(agreementData)

    const [bookingsData, carsData] = await Promise.all([getBookingsAction(), getCarsAction()])

    const bookingData = bookingsData.find((b: any) => b.id === agreementData.bookingId)
    const carData = carsData.find((c: any) => c.id === bookingData?.carId)

    setBooking(bookingData)
    setCar(carData)
    setCustomerName(bookingData?.customerName || "")
    setIsLoading(false)
  }

  const handleClearSignature = () => {
    signatureRef.current?.clear()
  }

  const handleSubmit = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Please provide your signature")
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
      // Convert signature to base64
      const signatureDataUrl = signatureRef.current.toDataURL()

      // Upload signature to blob storage
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

      // Step 1: Save signature to agreement first (with authorization check)
      const result = await signAgreementAction(agreementId, signatureUrl, customerName)

      if (!result.success) {
        toast.error(result.error || "Failed to sign agreement")
        setIsSigning(false)
        return
      }

      // Step 2: Generate PDF with both signatures (server-side)
      try {
        toast.info("Generating signed PDF with your signature...")
        
        const { generateSignedPdfAction } = await import("@/app/actions/generate-signed-pdf")
        const pdfResult = await generateSignedPdfAction(agreementId)

        if (!pdfResult.success) {
          throw new Error(pdfResult.error || "Failed to generate signed PDF")
        }

        toast.success("Agreement signed successfully! PDF generated with your signature.")
        
        // Refresh agreement to get updated signed_agreement_url
        await loadAgreement()
        
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } catch (pdfError: any) {
        console.error("[v0] Error generating signed PDF:", pdfError)
        // Signature was saved, but PDF generation failed
        toast.warning("Agreement signed, but PDF generation had an issue. Your signature was saved.")
        await loadAgreement() // Refresh to show signed status
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } finally {
        setIsSigning(false)
      }
    } catch (error) {
      console.error("[v0] Error signing agreement:", error)
      toast.error("An error occurred while signing")
    }

    setIsSigning(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
          <p className="mt-4 text-white/70">Loading agreement...</p>
        </div>
      </div>
    )
  }

  if (!agreement || !booking || !car) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center max-w-md">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-white">Agreement Not Found</h2>
          <p className="text-white/70">The agreement you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  const alreadySigned = agreement.status === "signed"

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-6">
            <Image src="/images/dna-group-logo.png" alt="Sedulous Group" width={150} height={50} />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Rental Agreement</h1>
            <p className="text-white/70">{agreement.agreementNumber}</p>
          </div>

          {alreadySigned && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-8 w-8 text-green-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Agreement Signed Successfully!</h3>
                  <p className="text-green-400 text-sm mb-4">
                    Your contract has been signed and the PDF with your signature has been generated.
                  </p>
                  {agreement.signed_at && (
                    <p className="text-white/60 text-sm mb-4">
                      Signed on: {new Date(agreement.signed_at).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {(agreement.signed_agreement_url || (agreement as any).signedAgreementUrl) && (
                    <a
                      href={agreement.signed_agreement_url || (agreement as any).signedAgreementUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      Download Signed Agreement PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">Vehicle Details</h3>
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
                  <span className="font-medium text-white">{booking.bookingType}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">Rental Period</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Pick-up:</span>
                  <span className="font-medium text-white">{new Date(booking.pickupDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Drop-off:</span>
                  <span className="font-medium text-white">{new Date(booking.dropoffDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Total:</span>
                  <span className="font-medium text-red-500">£{booking.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-white mb-4">Terms and Conditions</h3>
            <div className="max-h-96 overflow-y-auto pr-4 space-y-4 text-white/90">
              <p className="text-base leading-relaxed">By signing this agreement, you confirm that:</p>
              <ul className="list-disc pl-6 space-y-3 text-sm leading-relaxed">
                <li>You are at least 21 years old and hold a valid driving license</li>
                <li>All information provided is accurate and complete</li>
                <li>You will use the vehicle in accordance with UK road traffic laws</li>
                <li>You will return the vehicle in the same condition as received</li>
                <li>You accept responsibility for any damage, fines, or penalties incurred during the rental period</li>
                <li>You have read and agree to the full terms and conditions of this rental agreement</li>
                <li>Payment of £{booking.totalAmount.toFixed(2)} is due as per the agreed payment schedule</li>
                <li>The vehicle must be returned with the same fuel level as at pickup, or refueling charges will apply</li>
                <li>Any damage to the vehicle will be charged at market rates for repairs</li>
                <li>Traffic violations, parking fines, and congestion charges are the responsibility of the renter</li>
                <li>The vehicle must not be used for commercial purposes, racing, or any illegal activities</li>
                <li>Smoking is strictly prohibited inside the vehicle</li>
                <li>Pets are only allowed with prior written consent and may incur additional charges</li>
                <li>The renter is responsible for all tolls, parking fees, and other charges during the rental period</li>
                <li>In case of accident or breakdown, the renter must contact the rental company immediately</li>
                <li>The deposit may be held for up to 30 days after vehicle return to cover any potential charges</li>
                <li>Late returns will incur additional charges at the daily rate</li>
                <li>The rental company reserves the right to charge the renter's card for any damages or violations</li>
                <li>All disputes will be resolved in accordance with UK law</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-white/80 italic">
                  By proceeding with the signature, you acknowledge that you have read, understood, and agree to all terms and conditions listed above.
                </p>
              </div>
            </div>
          </div>

          {!alreadySigned && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-base font-semibold mb-2 text-white">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-red-500"
                />
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block text-white">Digital Signature</Label>
                <div className="border-2 border-white/20 rounded-lg overflow-hidden bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: "w-full h-48 bg-white cursor-crosshair",
                    }}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearSignature} 
                  className="mt-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Clear Signature
                </Button>
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
                disabled={isSigning}
                className="w-full bg-red-500 hover:bg-red-600 text-white h-12 text-base font-semibold"
              >
                {isSigning ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
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
          )}
        </div>

        <div className="text-center text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} Sedulous Group Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
