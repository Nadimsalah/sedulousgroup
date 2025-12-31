"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateBookingWithDetailsAction, getUserProfileAction } from "@/app/actions/database"
import { sendBookingConfirmationEmail } from "@/app/actions/email"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function BookingDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [carName, setCarName] = useState("")
  const [bookingType, setBookingType] = useState<string>("")
  const [savedProfile, setSavedProfile] = useState<any>(null)
  const [licenseNumberChanged, setLicenseNumberChanged] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    drivingLicense: "",
    niNumber: "",
  })

  const [documents, setDocuments] = useState({
    licenseFront: null as File | null,
    licenseBack: null as File | null,
    proofOfAddress: null as File | null,
    bankStatement: null as File | null,
    privateHireLicenseFront: null as File | null,
    privateHireLicenseBack: null as File | null,
  })

  const [uploadedUrls, setUploadedUrls] = useState({
    licenseFront: "",
    licenseBack: "",
    proofOfAddress: "",
    bankStatement: "",
    privateHireLicenseFront: "",
    privateHireLicenseBack: "",
  })

  useEffect(() => {
    async function loadBookingAndProfile() {
      const storedBookingId = searchParams.get("bookingId")
      const carNameStored = searchParams.get("pendingBookingCarName")
      const bookingTypeStored = searchParams.get("pendingBookingType") || ""

      if (!storedBookingId) {
        router.push("/")
        return
      }

      setBookingId(storedBookingId)
      setCarName(carNameStored || "")
      setBookingType(bookingTypeStored)

      // Load user profile
      try {
        const profile = await getUserProfileAction()
        console.log("[v0] Loaded user profile:", profile)

        if (profile) {
          setSavedProfile(profile)

          // Auto-fill form with saved data
          const nameParts = profile.fullName?.split(" ") || ["", ""]
          setFormData({
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            phone: profile.phone || "",
            drivingLicense: profile.drivingLicenseNumber || "",
            niNumber: profile.niNumber || "",
          })

          // Auto-fill document URLs if they exist
          if (profile.drivingLicenseFrontUrl && profile.drivingLicenseBackUrl && profile.proofOfAddressUrl) {
            setUploadedUrls({
              licenseFront: profile.drivingLicenseFrontUrl,
              licenseBack: profile.drivingLicenseBackUrl,
              proofOfAddress: profile.proofOfAddressUrl,
              bankStatement: profile.bankStatementUrl || "",
              privateHireLicenseFront: profile.privateHireLicenseFrontUrl || "",
              privateHireLicenseBack: profile.privateHireLicenseBackUrl || "",
            })
          }
        }
      } catch (error) {
        console.error("[v0] Error loading profile:", error)
      }

      setIsLoading(false)
    }

    loadBookingAndProfile()
  }, [router, searchParams])

  useEffect(() => {
    if (savedProfile?.drivingLicenseNumber && formData.drivingLicense !== savedProfile.drivingLicenseNumber) {
      setLicenseNumberChanged(true)
      // Clear document URLs when license changes
      setUploadedUrls({
        licenseFront: "",
        licenseBack: "",
        proofOfAddress: "",
        bankStatement: "",
        privateHireLicenseFront: "",
        privateHireLicenseBack: "",
      })
    } else {
      setLicenseNumberChanged(false)
    }
  }, [formData.drivingLicense, savedProfile])

  const handleFileChange = async (field: keyof typeof documents, file: File | null) => {
    if (!file) return

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert("File size exceeds 10MB limit. Please choose a smaller file.")
      return
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload a JPEG, PNG, WEBP, or PDF file.")
      return
    }

    setDocuments((prev) => ({ ...prev, [field]: file }))

    // Upload immediately via API route
    try {
      console.log("[v0] Starting upload for:", field, file.name)

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

      console.log("[v0] Upload successful:", data.url)
      setUploadedUrls((prev) => ({ ...prev, [field]: data.url }))

      alert(`${field} uploaded successfully!`)
    } catch (error) {
      console.error("[v0] Error uploading document:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload document"
      alert(`Failed to upload document: ${errorMessage}. Please try again.`)
      setDocuments((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bookingId) {
      alert("Booking not found. Please contact support.")
      return
    }

    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.drivingLicense) {
      alert("Please fill in all required fields")
      return
    }

    const isFlexiHire = bookingType === "Flexi Hire"
    const isPCOHire = bookingType === "PCO Hire"

    if ((isFlexiHire || isPCOHire) && !formData.niNumber) {
      alert("National Insurance number is required for Flexi Hire and PCO Hire bookings")
      return
    }

    if (!uploadedUrls.licenseFront || !uploadedUrls.licenseBack || !uploadedUrls.proofOfAddress) {
      alert("Please upload all required documents")
      return
    }

    if ((isFlexiHire || isPCOHire) && !uploadedUrls.bankStatement) {
      alert("Bank statement is required for Flexi Hire and PCO Hire bookings (proof of affordability)")
      return
    }

    if (isPCOHire && (!uploadedUrls.privateHireLicenseFront || !uploadedUrls.privateHireLicenseBack)) {
      alert("Private hire license (front and back) is required for PCO Hire bookings")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = await createClient()
      let customerEmail = ""

      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        customerEmail = user?.email || ""
      }

      await updateBookingWithDetailsAction(bookingId, {
        customerName: formData.firstName,
        lastName: formData.lastName,
        customerPhone: formData.phone,
        drivingLicenseNumber: formData.drivingLicense,
        drivingLicenseFrontUrl: uploadedUrls.licenseFront,
        drivingLicenseBackUrl: uploadedUrls.licenseBack,
        proofOfAddressUrl: uploadedUrls.proofOfAddress,
        ...((isFlexiHire || isPCOHire) && {
          niNumber: formData.niNumber,
          bankStatementUrl: uploadedUrls.bankStatement,
        }),
        ...(isPCOHire && {
          privateHireLicenseFrontUrl: uploadedUrls.privateHireLicenseFront,
          privateHireLicenseBackUrl: uploadedUrls.privateHireLicenseBack,
        }),
      })

      await sendBookingConfirmationEmail(bookingId, customerEmail)

      // Clear session storage
      sessionStorage.removeItem("bookingId")
      sessionStorage.removeItem("pendingBookingCarId")
      sessionStorage.removeItem("pendingBookingCarName")
      sessionStorage.removeItem("pendingBookingAmount")
      sessionStorage.removeItem("pendingBookingPickup")
      sessionStorage.removeItem("pendingBookingDropoff")
      sessionStorage.removeItem("pendingBookingPickupDate")
      sessionStorage.removeItem("pendingBookingDropoffDate")
      sessionStorage.removeItem("pendingBookingPickupTime")
      sessionStorage.removeItem("pendingBookingDropoffTime")
      sessionStorage.removeItem("pendingBookingType")

      router.push(`/confirmation?bookingId=${bookingId}`)
    } catch (error) {
      console.error("[v0] Error submitting booking details:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-neutral-900 to-black">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          <p className="text-white/70">Loading booking details...</p>
        </div>
      </div>
    )
  }

  const isFlexiHire = bookingType === "Flexi Hire"
  const isPCOHire = bookingType === "PCO Hire"

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black pb-20">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">Complete Your Booking</h1>
            <p className="text-lg text-white/70">
              {carName && `Booking for: ${carName}`}
              {bookingType && ` (${bookingType})`}
            </p>
            <p className="mt-2 text-sm text-white/60">
              Please provide your details and upload required documents to complete your booking request.
            </p>
            {isFlexiHire && (
              <div className="mt-4 rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
                <h3 className="font-semibold text-blue-400 mb-2">Flexi Hire Requirements</h3>
                <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
                  <li>Driving licence (front and back photos)</li>
                  <li>National Insurance (NI) number</li>
                  <li>Bank statement (proof of affordability - max 3 months old)</li>
                  <li>Proof of address - NOT bank statement (max 3 months old)</li>
                </ul>
              </div>
            )}
            {isPCOHire && (
              <div className="mt-4 rounded-lg bg-purple-500/10 border border-purple-500/30 p-4">
                <h3 className="font-semibold text-purple-400 mb-2">PCO Hire Requirements</h3>
                <ul className="text-sm text-purple-300 space-y-1 list-disc list-inside">
                  <li>Driving licence (front and back photos)</li>
                  <li>Private hire licence (front and back photos)</li>
                  <li>National Insurance (NI) number</li>
                  <li>Bank statement (proof of affordability - max 3 months old)</li>
                  <li>Proof of address - NOT bank statement (max 3 months old)</li>
                </ul>
              </div>
            )}
            {savedProfile && !licenseNumberChanged && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <p className="text-sm text-green-400">Your saved information has been loaded automatically</p>
              </div>
            )}
            {licenseNumberChanged && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-orange-500/10 border border-orange-500/30 p-3">
                <AlertCircle className="h-5 w-5 text-orange-400" />
                <p className="text-sm text-orange-400">
                  License number changed. Please upload new documents for verification.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="mb-6 border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-md shadow-black/30">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Personal Information</CardTitle>
                <CardDescription className="text-white/80">Please provide your details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName" className="text-white/80">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-white/80">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="phone" className="text-white/80">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                      placeholder="+44 7700 900000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="license" className="text-white/80">
                      Driving Licence Number *
                    </Label>
                    <Input
                      id="license"
                      value={formData.drivingLicense}
                      onChange={(e) => setFormData({ ...formData, drivingLicense: e.target.value })}
                      className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                      placeholder="Licence number"
                      required
                    />
                  </div>
                </div>

                {(isFlexiHire || isPCOHire) && (
                  <div>
                    <Label htmlFor="niNumber" className="text-white/80">
                      National Insurance (NI) Number *
                    </Label>
                    <Input
                      id="niNumber"
                      value={formData.niNumber}
                      onChange={(e) => setFormData({ ...formData, niNumber: e.target.value })}
                      className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                      placeholder="QQ 12 34 56 A"
                      required
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mb-6 border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-md shadow-black/30">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Upload Documents</CardTitle>
                <CardDescription className="text-white/80">Please upload required documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white/80">Driving Licence (Front) *</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange("licenseFront", e.target.files?.[0] || null)}
                      className="border-white/20 bg-white/10 text-white file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-white"
                      required={!uploadedUrls.licenseFront || licenseNumberChanged}
                    />
                    {uploadedUrls.licenseFront && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                  </div>
                </div>

                <div>
                  <Label className="text-white/80">Driving Licence (Back) *</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange("licenseBack", e.target.files?.[0] || null)}
                      className="border-white/20 bg-white/10 text-white file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-white"
                      required={!uploadedUrls.licenseBack || licenseNumberChanged}
                    />
                    {uploadedUrls.licenseBack && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                  </div>
                </div>

                <div>
                  <Label className="text-white/80">Proof of Address *</Label>
                  <p className="mt-1 text-xs text-white/60">
                    {isFlexiHire || isPCOHire
                      ? "Official letter (NOT bank statement) dated within the last 3 months"
                      : "Bank statement or official letter dated within the last 3 months"}
                  </p>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange("proofOfAddress", e.target.files?.[0] || null)}
                      className="border-white/20 bg-white/10 text-white file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-white"
                      required={!uploadedUrls.proofOfAddress || licenseNumberChanged}
                    />
                    {uploadedUrls.proofOfAddress && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                  </div>
                </div>

                {(isFlexiHire || isPCOHire) && (
                  <div>
                    <Label className="text-white/80">Bank Statement (Proof of Affordability) *</Label>
                    <p className="mt-1 text-xs text-white/60">Bank statement dated within the last 3 months</p>
                    <div className="mt-2 flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange("bankStatement", e.target.files?.[0] || null)}
                        className="border-white/20 bg-white/10 text-white file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-white"
                        required={!uploadedUrls.bankStatement}
                      />
                      {uploadedUrls.bankStatement && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                    </div>
                  </div>
                )}

                {isPCOHire && (
                  <>
                    <div>
                      <Label className="text-white/80">Private Hire Licence (Front) *</Label>
                      <p className="mt-1 text-xs text-white/60">Front photo of your private hire licence</p>
                      <div className="mt-2 flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange("privateHireLicenseFront", e.target.files?.[0] || null)}
                          className="border-white/20 bg-white/10 text-white file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-white"
                          required={!uploadedUrls.privateHireLicenseFront}
                        />
                        {uploadedUrls.privateHireLicenseFront && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                      </div>
                    </div>

                    <div>
                      <Label className="text-white/80">Private Hire Licence (Back) *</Label>
                      <p className="mt-1 text-xs text-white/60">Back photo of your private hire licence</p>
                      <div className="mt-2 flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange("privateHireLicenseBack", e.target.files?.[0] || null)}
                          className="border-white/20 bg-white/10 text-white file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-white"
                          required={!uploadedUrls.privateHireLicenseBack}
                        />
                        {uploadedUrls.privateHireLicenseBack && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-red-500 py-6 text-lg font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:bg-red-600 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Booking Request"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
