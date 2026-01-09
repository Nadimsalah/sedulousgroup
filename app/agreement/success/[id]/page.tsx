"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Download, Car, ArrowRight, Loader2, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getAgreementByIdAction } from "@/app/actions/agreements"
import { getBookingsAction, getCarsAction } from "@/app/actions/database"
import Image from "next/image"
import { toast } from "sonner"

function AgreementSuccessContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const agreementId = params.id as string

  const [agreement, setAgreement] = useState<any>(null)
  const [booking, setBooking] = useState<any>(null)
  const [car, setCar] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null)
  const [unsignedPdfUrl, setUnsignedPdfUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (agreementId) {
      // Check if signed PDF URL was passed via query param
      const signedPdfParam = searchParams.get("signedPdf")
      if (signedPdfParam) {
        setSignedPdfUrl(decodeURIComponent(signedPdfParam))
      }
      
      loadData()
    }
  }, [agreementId, searchParams])

  // Poll for signed PDF URL if not available
  useEffect(() => {
    if (!agreementId || !agreement || signedPdfUrl) return

    const pollInterval = setInterval(async () => {
      try {
        const agreementData = await getAgreementByIdAction(agreementId)
        if (agreementData) {
          const pdfUrl = agreementData.signedAgreementUrl || agreementData.signed_agreement_url
          if (pdfUrl) {
            setSignedPdfUrl(pdfUrl)
            setAgreement(agreementData)
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error("[Success Page] Error polling for PDF:", error)
      }
    }, 2000)

    // Stop polling after 30 seconds
    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
    }, 30000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [agreementId, agreement, signedPdfUrl])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const agreementData = await getAgreementByIdAction(agreementId)
      if (!agreementData) {
        toast.error("Agreement not found")
        router.push("/dashboard")
        return
      }

      setAgreement(agreementData)
      const pdfUrl = agreementData.signedAgreementUrl || agreementData.signed_agreement_url
      if (pdfUrl) {
        setSignedPdfUrl(pdfUrl)
      }

      // Load unsigned PDF for preview (same as signing page)
      const unsignedUrl = agreementData.unsignedAgreementUrl || agreementData.unsigned_agreement_url
      if (unsignedUrl) {
        setUnsignedPdfUrl(unsignedUrl)
      }

      const [bookingsData, carsData] = await Promise.all([getBookingsAction(), getCarsAction()])
      const bookingData = bookingsData.find((b: any) => b.id === agreementData.bookingId)
      const carData = carsData.find((c: any) => c.id === bookingData?.carId || c.id === bookingData?.car_id)

      setBooking(bookingData)
      setCar(carData)
    } catch (error) {
      console.error("[Success Page] Error loading data:", error)
      toast.error("Failed to load agreement data")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-zinc-900/90 border-zinc-800 backdrop-blur-xl p-8 md:p-12">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative bg-green-500 rounded-full p-6">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Agreement Signed Successfully! 🎉
          </h1>
          <p className="text-xl text-zinc-300 mb-2">Enjoy your rental with</p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Car className="h-8 w-8 text-red-500 font-light" />
            <h2 className="text-2xl md:text-3xl font-bold text-red-500">
              {car.brand} {car.name}
            </h2>
          </div>
          <p className="text-lg text-zinc-400">Drive safe and have a wonderful journey! 🚗</p>
        </div>

        {/* Car Image */}
        {car.image && (
          <div className="mb-8 rounded-xl overflow-hidden border border-zinc-700">
            <Image
              src={car.image || "/placeholder.svg"}
              alt={car.name}
              width={800}
              height={400}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Booking Details */}
        <div className="bg-zinc-800/50 rounded-lg p-6 mb-8 border border-zinc-700">
          <h3 className="text-lg font-semibold text-white mb-4">Booking Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-400">Pickup Date</p>
              <p className="text-white font-medium">
                {new Date(booking.pickupDate || booking.pickup_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-zinc-400">Return Date</p>
              <p className="text-white font-medium">
                {new Date(booking.dropoffDate || booking.dropoff_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-zinc-400">Agreement Number</p>
              <p className="text-white font-medium">{agreement.agreementNumber}</p>
            </div>
            <div>
              <p className="text-zinc-400">Status</p>
              <p className="text-green-400 font-medium">Signed & Confirmed</p>
            </div>
          </div>
        </div>

        {/* Preview Agreement Button */}
        {(unsignedPdfUrl || signedPdfUrl) && (
          <div className="mb-6">
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              {signedPdfUrl ? "Preview Signed Agreement" : "Preview Agreement"}
            </Button>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (unsignedPdfUrl || signedPdfUrl) && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-black border border-white/10 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">
                  {signedPdfUrl ? "Signed Agreement Preview" : "Agreement Preview"}
                </h2>
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <iframe
                src={signedPdfUrl || unsignedPdfUrl || ""}
                className="w-full h-[80vh] border border-white/10 rounded-lg"
                title={signedPdfUrl ? "Signed Agreement Preview" : "Agreement Preview"}
              />
            </div>
          </div>
        )}

        {/* Download PDF Button */}
        {signedPdfUrl ? (
          <div className="space-y-4">
            <a href={signedPdfUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white h-14 text-lg font-semibold"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Signed Agreement PDF
              </Button>
            </a>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="w-full border-zinc-700 text-white hover:bg-zinc-800 h-12"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show unsigned PDF download if available while waiting for signed PDF */}
            {unsignedPdfUrl && (
              <a href={unsignedPdfUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 h-12"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Agreement (Unsigned)
                </Button>
              </a>
            )}
            
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-400 mx-auto mb-4" />
              <p className="text-yellow-400 mb-4">Signed PDF is being generated... Please wait a moment.</p>
              <p className="text-zinc-400 text-sm mb-4">
                Your agreement has been signed successfully. The signed PDF will be available shortly.
              </p>
              <Button
                onClick={loadData}
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                Refresh Status
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default function AgreementSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <AgreementSuccessContent />
    </Suspense>
  )
}
