"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, XCircle, Download, CheckCircle, Camera, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import SignatureCanvas from "react-signature-canvas"

interface BookingData {
  booking: any
  agreement: any
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.bookingId as string
  const signaturePadRef = useRef<any>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BookingData | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isSigningLoading, setIsSigningLoading] = useState(false)
  const [customerSignature, setCustomerSignature] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    loadBookingDetails()
  }, [bookingId])

  const loadBookingDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use server action to fetch booking details
      const { getBookingDetails } = await import("@/app/actions/booking-details")
      const result = await getBookingDetails(bookingId)

      if (result.error) {
        if (result.error === "Not authenticated") {
          router.replace("/login")
          return
        }
        throw new Error(result.error)
      }

      if (!result.booking) {
        throw new Error("Booking not found")
      }

      // Debug: log agreement data including vehicle photos
      if (result.agreement) {
        console.log("[v0] Agreement loaded:", {
          id: result.agreement.id,
          status: result.agreement.status,
          vehicle_photos: result.agreement.vehicle_photos?.length || 0,
          vehiclePhotos: result.agreement.vehiclePhotos?.length || 0,
        })
      }
      
      setData({ booking: result.booking, agreement: result.agreement || null })

      if (result.agreement?.signed_agreement_url) {
        setCurrentStep(2)
      }
    } catch (err: any) {
      console.error("[v0] Error loading booking:", err)
      setError(err.message || "Failed to load booking")
    } finally {
      setLoading(false)
    }
  }

  const handleSignAgreement = async () => {
    if (!data?.booking || !data?.agreement?.id) {
      alert("Agreement not found. Please contact support.")
      return
    }

    if (!customerSignature) {
      alert("Please draw and confirm your signature first")
      return
    }

    try {
      setIsSigningLoading(true)

      // Update agreement status to "signed" with signature
      const updateResponse = await fetch(`/api/agreements/${data.agreement.id}`, {
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
        throw new Error(errorData.error || "Failed to sign agreement")
      }

      // Generate signed PDF after signing
      try {
        console.log("[v0] Starting PDF generation for agreement:", data.agreement.id)
        const { generateSignedPdfAction } = await import("@/app/actions/generate-signed-pdf")
        const pdfResult = await generateSignedPdfAction(data.agreement.id)
        
        if (!pdfResult.success) {
          console.error("[v0] PDF generation failed:", pdfResult.error)
          alert(`Agreement signed successfully, but PDF generation failed: ${pdfResult.error}. You can generate it from the success page.`)
        } else {
          console.log("[v0] PDF generated successfully:", pdfResult.signedPdfUrl?.substring(0, 100))
        }
      } catch (pdfError: any) {
        console.error("[v0] Error generating signed PDF:", pdfError)
        alert(`Agreement signed successfully, but PDF generation had an error: ${pdfError.message || "Unknown error"}. You can generate it from the success page.`)
      }

      // Redirect to success page
      router.push(`/agreement/success/${data.agreement.id}`)
    } catch (err: any) {
      console.error("[v0] Error signing agreement:", err)
      alert("Failed to sign: " + err.message)
    } finally {
      setIsSigningLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatDateTime = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    if (timeStr) {
      return `${formattedDate} at ${timeStr}`
    }
    return formattedDate
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500/20 text-green-400",
      pending: "bg-yellow-500/20 text-yellow-400",
      completed: "bg-blue-500/20 text-blue-400",
      confirmed: "bg-green-500/20 text-green-400",
      approved: "bg-green-500/20 text-green-400",
    }
    return colors[status?.toLowerCase()] || "bg-gray-500/20 text-gray-400"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-white/70">Loading booking...</p>
        </div>
      </div>
    )
  }

  if (error || !data?.booking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-white/70 mb-4">{error || "Booking not found"}</p>
          <Button onClick={() => router.push("/dashboard")} className="bg-red-500 hover:bg-red-600">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const { booking, agreement } = data
  const car = booking.cars || {}
  const hasSigned = agreement?.status === "signed" || !!agreement?.signed_agreement_url

  return (
    <div className="min-h-screen bg-black">
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Booking Info */}
        <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                {car.brand || ""} {car.name || "Vehicle"}
              </h1>
              <p className="text-white/60 text-sm">Booking: {booking.id?.slice(0, 8)}...</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold self-start ${getStatusColor(booking.status)}`}
            >
              {booking.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Rental Period</p>
              <p className="text-white font-semibold">
                {formatDateTime(booking.pickup_date, booking.pickup_time)} - {formatDateTime(booking.dropoff_date, booking.dropoff_time)}
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Total Amount</p>
              <p className="text-white font-semibold text-xl">£{booking.total_amount?.toFixed(2) || "0.00"}</p>
              {booking.booking_type && (
                <p className="text-white/50 text-xs mt-1">{booking.booking_type}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Pickup Location</p>
              <p className="text-white font-semibold">{booking.pickup_location || "Not specified"}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Dropoff Location</p>
              <p className="text-white font-semibold">{booking.dropoff_location || "Not specified"}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-white/60 text-sm mb-1">Customer Information</p>
            <p className="text-white font-semibold">{booking.customer_name || "Not provided"}</p>
            <p className="text-white/70 text-sm">{booking.customer_email || "Not provided"}</p>
            {booking.customer_phone && (
              <p className="text-white/70 text-sm">{booking.customer_phone}</p>
            )}
          </div>
        </div>

        {/* Agreement Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">Rental Agreement</h2>
            {agreement && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                agreement.status === "signed" ? "bg-green-500/20 text-green-400" :
                agreement.status === "sent" ? "bg-blue-500/20 text-blue-400" :
                "bg-yellow-500/20 text-yellow-400"
              }`}>
                {agreement.status || "Pending"}
              </span>
            )}
          </div>

          {!agreement ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
              <p className="text-yellow-400 font-semibold mb-2">Agreement Pending</p>
              <p className="text-white/70 text-sm">
                We are currently reviewing your documents. Please wait while our team processes your submission. Once approved, your rental agreement will be sent to you via email.
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Review */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 0 ? "bg-red-500 text-white" : "bg-white/10 text-white/50"}`}
                  >
                    1
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-white">Review Agreement</h3>
                </div>

                {agreement.agreement_text ? (
                  <div className="bg-black/50 rounded-xl p-4 border border-white/10 max-h-96 overflow-y-auto text-sm text-white/80 leading-relaxed mb-4">
                    {agreement.agreement_text}
                  </div>
                ) : (agreement.signed_agreement_url || (agreement as any).signedAgreementUrl || agreement.unsigned_agreement_url) ? (
                  <div className="bg-black/50 rounded-xl p-4 border border-white/10 mb-4">
                    <p className="text-white/70 text-sm mb-3">
                      {agreement.signed_agreement_url || (agreement as any).signedAgreementUrl
                        ? "View the signed agreement document:"
                        : "Please review the agreement document:"}
                    </p>
                    <a
                      href={agreement.signed_agreement_url || (agreement as any).signedAgreementUrl || agreement.unsigned_agreement_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      <Download className="h-4 w-4" />
                      {agreement.signed_agreement_url || (agreement as any).signedAgreementUrl
                        ? "View Signed Agreement PDF"
                        : "View Agreement PDF"}
                    </a>
                  </div>
                ) : (
                  <div className="bg-black/50 rounded-xl p-4 border border-white/10 text-sm text-white/60 mb-4">
                    Agreement text will be provided by the rental company.
                  </div>
                )}

                {/* Vehicle Photos Section */}
                <div className="bg-black/50 rounded-xl p-4 border border-white/10 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Camera className="h-5 w-5 text-red-500" />
                    <h4 className="text-white font-semibold">Vehicle Condition Photos</h4>
                    {((agreement.vehicle_photos && agreement.vehicle_photos.length > 0) || 
                      (agreement.vehiclePhotos && agreement.vehiclePhotos.length > 0)) && (
                      <span className="text-white/50 text-sm">
                        ({(agreement.vehicle_photos || agreement.vehiclePhotos || []).length} photos)
                      </span>
                    )}
                  </div>
                  
                  {((agreement.vehicle_photos && agreement.vehicle_photos.length > 0) || 
                    (agreement.vehiclePhotos && agreement.vehiclePhotos.length > 0)) ? (
                    <>
                      <p className="text-white/60 text-sm mb-4">
                        Please review the vehicle condition photos taken at pickup. These document the vehicle&apos;s state before your rental.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {(agreement.vehicle_photos || agreement.vehiclePhotos || []).map((photoUrl: string, index: number) => (
                          <div 
                            key={index} 
                            className="relative aspect-square rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-red-500 transition-colors group"
                            onClick={() => setSelectedImage(photoUrl)}
                          >
                            <Image
                              src={photoUrl}
                              alt={`Vehicle photo ${index + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">View</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-white/50 text-sm">
                      No vehicle photos have been uploaded yet. Photos will appear here once the admin uploads them during vehicle handover.
                    </p>
                  )}
                </div>

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
                      className="relative max-w-4xl max-h-[85vh] w-full h-full pointer-events-none"
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

                {currentStep === 0 && !hasSigned && (
                  <Button onClick={() => setCurrentStep(1)} className="w-full bg-red-500 hover:bg-red-600">
                    I Have Read and Agree
                  </Button>
                )}
              </div>

              {/* Step 2: Sign */}
              {currentStep >= 1 && (
                <div className="mb-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 1 ? "bg-red-500 text-white" : "bg-white/10 text-white/50"}`}
                    >
                      2
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-white">Sign Agreement</h3>
                  </div>

                  {!hasSigned && (
                    <div className="bg-black/50 rounded-xl p-4 border border-white/10 space-y-4">
                      <div className="space-y-3">
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
                                alert("Signature confirmed!")
                              } else {
                                alert("Please draw your signature first")
                              }
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            Confirm Signature
                          </Button>
                        </div>
                      </div>

                      {customerSignature && (
                        <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm">
                          ✓ Signature captured
                        </div>
                      )}

                      <Button
                        onClick={handleSignAgreement}
                        disabled={isSigningLoading || !agreement?.id || !customerSignature}
                        className="w-full bg-red-500 hover:bg-red-600 text-white h-12 text-base font-semibold disabled:opacity-50"
                      >
                        {isSigningLoading ? (
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
                    </div>
                  )}

                  {hasSigned && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                      <CheckCircle className="h-8 w-8 text-green-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-white font-semibold">Agreement Signed</p>
                        <p className="text-green-400 text-sm">Your contract is ready</p>
                        {agreement.signed_at && (
                          <p className="text-white/60 text-xs mt-1">
                            Signed on {formatDate(agreement.signed_at)}
                          </p>
                        )}
                      </div>
                      {(agreement.signed_agreement_url || (agreement as any).signedAgreementUrl) ? (
                        <a
                          href={agreement.signed_agreement_url || (agreement as any).signedAgreementUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium w-full md:w-auto justify-center"
                        >
                          <Download className="h-4 w-4" />
                          Download Signed Agreement PDF
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                          <span>PDF is being generated...</span>
                          <Button
                            onClick={loadBookingDetails}
                            variant="outline"
                            size="sm"
                            className="border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/10"
                          >
                            Refresh
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Complete */}
              {hasSigned && (
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold bg-green-500 text-white">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-white">Completed</h3>
                  </div>
                  <p className="text-white/70 mt-2 ml-11">Your rental agreement is signed and saved.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
