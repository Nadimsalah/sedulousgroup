"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, XCircle, Download, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface BookingData {
  booking: any
  agreement: any
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.bookingId as string
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BookingData | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isSigningLoading, setIsSigningLoading] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    if (currentStep === 1 && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "rgb(30, 30, 30)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [currentStep])

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

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCoordinates(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    const { x, y } = getCoordinates(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "rgb(30, 30, 30)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const handleSignAgreement = async () => {
    if (!canvasRef.current || !data?.booking || !data?.agreement?.id) {
      alert("Agreement not found. Please contact support.")
      return
    }

    try {
      setIsSigningLoading(true)
      const signatureDataUrl = canvasRef.current.toDataURL()

      const supabase = createClient()
      if (!supabase) throw new Error("Failed to initialize")

      const blob = await (await fetch(signatureDataUrl)).blob()
      const fileName = `signatures/${bookingId}-${Date.now()}.png`

      const { error: uploadError } = await supabase.storage
        .from("rental-contracts")
        .upload(fileName, blob, { upsert: true })

      if (uploadError) {
        console.log("Upload error, trying to continue:", uploadError.message)
      }

      const { data: signedUrl } = supabase.storage.from("rental-contracts").getPublicUrl(fileName)

      // Use server action to sign agreement
      const { signAgreement } = await import("@/app/actions/booking-details")
      const result = await signAgreement(bookingId, signedUrl.publicUrl, data.agreement.id)

      if (result.error) {
        throw new Error(result.error)
      }

      setCurrentStep(2)
      await loadBookingDetails()
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
              <p className="text-yellow-400 font-semibold mb-2">No Agreement Yet</p>
              <p className="text-white/70 text-sm">
                Your rental agreement will be created and sent to you once your booking is confirmed by our team.
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
                    <div className="bg-black/50 rounded-xl p-4 border border-white/10">
                      <p className="text-white/70 text-sm mb-3">Draw your signature below:</p>
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={150}
                        className="w-full border-2 border-dashed border-white/20 rounded-lg bg-black/80 cursor-crosshair mb-4 touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <div className="flex gap-3">
                        <Button
                          onClick={clearSignature}
                          variant="outline"
                          className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent"
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={handleSignAgreement}
                          disabled={isSigningLoading || !agreement?.id}
                          className="flex-1 bg-red-500 hover:bg-red-600"
                        >
                          {isSigningLoading ? "Signing..." : "Sign Contract"}
                        </Button>
                      </div>
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
                      {(agreement.signed_agreement_url || (agreement as any).signedAgreementUrl) && (
                        <a
                          href={agreement.signed_agreement_url || (agreement as any).signedAgreementUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium w-full md:w-auto justify-center"
                        >
                          <Download className="h-4 w-4" />
                          Download Signed Agreement PDF
                        </a>
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
