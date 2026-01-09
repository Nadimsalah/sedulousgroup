"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft, Upload, CheckCircle2, AlertCircle, X, FileText, 
  CreditCard, Home, Loader2, Eye, AlertTriangle, Send
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { resubmitBookingDocumentsAction, getBookingForResubmitAction } from "@/app/actions/bookings"

interface BookingData {
  id: string
  status: string
  booking_type: string
  rejection_reason?: string
  rejection_notes?: string
  can_resubmit?: boolean
  customer_name: string
  car_name?: string
  car_brand?: string
  driving_license_front_url?: string
  driving_license_back_url?: string
  proof_of_address_url?: string
  bank_statement_url?: string
  private_hire_license_front_url?: string
  private_hire_license_back_url?: string
  ni_number?: string
}

interface DocumentState {
  url: string
  uploading: boolean
  error: string | null
}

export default function ResubmitDocumentsPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.bookingId as string
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [niNumber, setNiNumber] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [documents, setDocuments] = useState<Record<string, DocumentState>>({
    licenseFront: { url: "", uploading: false, error: null },
    licenseBack: { url: "", uploading: false, error: null },
    proofOfAddress: { url: "", uploading: false, error: null },
    bankStatement: { url: "", uploading: false, error: null },
    privateHireFront: { url: "", uploading: false, error: null },
    privateHireBack: { url: "", uploading: false, error: null },
  })

  useEffect(() => {
    loadBooking()
  }, [bookingId])

  const loadBooking = async () => {
    try {
      setLoading(true)
      console.log("[v0] ========== RESUBMIT PAGE ==========")
      console.log("[v0] Loading booking for resubmit:", bookingId)
      
      const result = await getBookingForResubmitAction(bookingId)
      console.log("[v0] Booking result:", JSON.stringify({
        success: result.success, 
        error: result.error,
        hasBooking: !!result.booking,
        status: result.booking?.status,
        can_resubmit: result.booking?.can_resubmit
      }))

      if (!result.success || !result.booking) {
        console.log("[v0] Setting error:", result.error || "Booking not found")
        setError(result.error || "Booking not found")
        return
      }

      const bookingData = result.booking
      console.log("[v0] Booking loaded successfully, setting state")
      setBooking(bookingData)
      setNiNumber(bookingData.ni_number || "")

      // Pre-fill existing documents
      setDocuments({
        licenseFront: { url: bookingData.driving_license_front_url || "", uploading: false, error: null },
        licenseBack: { url: bookingData.driving_license_back_url || "", uploading: false, error: null },
        proofOfAddress: { url: bookingData.proof_of_address_url || "", uploading: false, error: null },
        bankStatement: { url: bookingData.bank_statement_url || "", uploading: false, error: null },
        privateHireFront: { url: bookingData.private_hire_license_front_url || "", uploading: false, error: null },
        privateHireBack: { url: bookingData.private_hire_license_back_url || "", uploading: false, error: null },
      })
    } catch (err) {
      console.error("[v0] Error loading booking:", err)
      setError("Failed to load booking details")
    } finally {
      setLoading(false)
    }
  }

  const handleUploadClick = (docId: string) => {
    fileInputRefs.current[docId]?.click()
  }

  const handleFileChange = async (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ""

    // Validate file
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setDocuments(prev => ({
        ...prev,
        [docId]: { ...prev[docId], error: "File size exceeds 10MB limit" }
      }))
      return
    }

    setDocuments(prev => ({
      ...prev,
      [docId]: { ...prev[docId], uploading: true, error: null }
    }))

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setDocuments(prev => ({
        ...prev,
        [docId]: { url: data.url, uploading: false, error: null }
      }))
    } catch (err) {
      setDocuments(prev => ({
        ...prev,
        [docId]: { ...prev[docId], uploading: false, error: err instanceof Error ? err.message : "Upload failed" }
      }))
    }
  }

  const handleRemoveFile = (docId: string) => {
    setDocuments(prev => ({
      ...prev,
      [docId]: { url: "", uploading: false, error: null }
    }))
  }

  const getRequiredDocs = () => {
    const bookingType = booking?.booking_type || "Rent"
    const docs = [
      { id: "licenseFront", label: "Driving License (Front)", required: true, icon: CreditCard },
      { id: "licenseBack", label: "Driving License (Back)", required: true, icon: CreditCard },
      { id: "proofOfAddress", label: "Proof of Address", required: true, icon: Home },
    ]

    if (bookingType === "Flexi Hire" || bookingType === "PCO Hire") {
      docs.push({ id: "bankStatement", label: "Bank Statement", required: true, icon: FileText })
    }

    if (bookingType === "PCO Hire") {
      docs.push({ id: "privateHireFront", label: "Private Hire License (Front)", required: true, icon: CreditCard })
      docs.push({ id: "privateHireBack", label: "Private Hire License (Back)", required: true, icon: CreditCard })
    }

    return docs
  }

  const isComplete = () => {
    if (!niNumber.trim()) return false
    const requiredDocs = getRequiredDocs()
    return requiredDocs.every(doc => documents[doc.id]?.url)
  }

  const handleSubmit = async () => {
    if (!isComplete()) {
      setError("Please fill in all required documents")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await resubmitBookingDocumentsAction(bookingId, {
        driving_license_front_url: documents.licenseFront.url,
        driving_license_back_url: documents.licenseBack.url,
        proof_of_address_url: documents.proofOfAddress.url,
        bank_statement_url: documents.bankStatement.url || undefined,
        private_hire_license_front_url: documents.privateHireFront.url || undefined,
        private_hire_license_back_url: documents.privateHireBack.url || undefined,
        ni_number: niNumber,
      })

      if (result.success) {
        router.push(`/my-bookings/${bookingId}?resubmitted=true`)
      } else {
        setError(result.error || "Failed to resubmit documents")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading booking details...</p>
        </div>
      </div>
    )
  }

  // Check if resubmission is allowed:
  // - Status must be "Documents Rejected" (not permanently "Rejected")
  // - can_resubmit field should not be explicitly false
  const statusLower = booking?.status?.toLowerCase() || ""
  const isDocumentsRejected = statusLower === "documents rejected"
  const canResubmit = booking && isDocumentsRejected && booking.can_resubmit !== false

  if (!booking || !canResubmit) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Cannot Resubmit Documents</h2>
            <p className="text-gray-400 mb-6">
              {!booking 
                ? "Booking not found or you don't have permission to view it."
                : statusLower === "rejected"
                  ? "This booking has been permanently rejected and cannot accept new documents. Please contact support for assistance."
                  : "This booking is not eligible for document resubmission. Please contact support."}
            </p>
            <Link href="/dashboard">
              <Button className="bg-red-500 hover:bg-red-600">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const requiredDocs = getRequiredDocs()

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Resubmit Documents</h1>
            <p className="text-sm text-gray-400">
              {booking.car_brand} {booking.car_name} - {booking.id.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Rejection Reason Alert */}
        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-400">Why was your booking rejected?</p>
              <p className="text-gray-300 text-sm mt-1">
                {booking.rejection_reason || "Documents were not accepted. Please re-upload clearer documents."}
              </p>
              {booking.rejection_notes && (
                <p className="text-gray-400 text-xs mt-2 italic">
                  Additional notes: {booking.rejection_notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Documents Card */}
        <Card className="border border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              Upload New Documents
            </CardTitle>
            <p className="text-sm text-gray-400">
              Please upload clear, readable copies of all required documents
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* NI Number */}
            <div>
              <Label htmlFor="niNumber" className="text-gray-300 flex items-center gap-2">
                National Insurance Number *
                {niNumber.trim() && <CheckCircle2 className="h-4 w-4 text-green-400" />}
              </Label>
              <Input
                id="niNumber"
                value={niNumber}
                onChange={(e) => setNiNumber(e.target.value.toUpperCase())}
                className="mt-2 border-zinc-700 bg-zinc-800 text-white uppercase"
                placeholder="QQ 12 34 56 A"
              />
            </div>

            {/* Document Uploads */}
            {requiredDocs.map((doc) => {
              const docState = documents[doc.id]
              const Icon = doc.icon

              return (
                <div key={doc.id} className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {doc.label} *
                    {docState.url && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                  </Label>

                  <input
                    ref={(el) => { fileInputRefs.current[doc.id] = el }}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(doc.id, e)}
                    className="hidden"
                  />

                  {!docState.url ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleUploadClick(doc.id)}
                      disabled={docState.uploading}
                      className="w-full h-auto py-6 flex flex-col items-center gap-2 border-2 border-dashed border-zinc-600 bg-zinc-800 hover:border-red-500"
                    >
                      {docState.uploading ? (
                        <>
                          <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                          <span className="text-gray-300">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400" />
                          <span className="text-gray-300">Click to Upload</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-green-500/30">
                      {docState.url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                        <div 
                          className="relative w-16 h-16 rounded overflow-hidden cursor-pointer"
                          onClick={() => setPreviewImage(docState.url)}
                        >
                          <Image src={docState.url} alt={doc.label} fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Eye className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded bg-zinc-700 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-white">Document uploaded</p>
                        <p className="text-xs text-green-400">✓ Ready</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(doc.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {docState.error && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {docState.error}
                    </p>
                  )}
                </div>
              )
            })}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isComplete() || submitting}
              className="w-full py-6 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Documents for Review
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <Button
            variant="ghost"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white"
          >
            <X className="w-8 h-8" />
          </Button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full">
            <Image src={previewImage} alt="Preview" fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

