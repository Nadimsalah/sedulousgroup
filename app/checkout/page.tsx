"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, MapPin, Calendar, Clock, User, Phone, Mail, CreditCard, IdCard, CheckCircle2, AlertTriangle, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCarAction } from "@/app/actions/database"
import { createClient } from "@/lib/supabase/client"
import { RequiredDocuments, type DocumentData } from "@/components/checkout/required-documents"

interface Car {
  id: string
  name: string
  category: string
  image: string
  passengers: number
  luggage: number
  transmission: string
  fuelType: string
  pricePerDay: number
  rating: number
  rentalType?: string
  rental_type?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [car, setCar] = useState<Car | null>(null)
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1) // 1: Personal Info, 2: Documents, 3: Confirm

  // Trip details from URL params
  const [tripDetails, setTripDetails] = useState({
    pickupLocation: "London, UK",
    dropoffLocation: "London, UK",
    pickupDate: "",
    dropoffDate: "",
    pickupTime: "10:00",
    dropoffTime: "10:00",
  })

  // Customer form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    drivingLicense: "",
  })

  // Document upload state
  const [documentsComplete, setDocumentsComplete] = useState(false)
  const [documentData, setDocumentData] = useState<DocumentData | null>(null)

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)

      try {
        // Check auth state
        const supabase = createClient()
        if (supabase) {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser()
          if (authUser) {
            setUser(authUser)
            // Pre-fill email if user is logged in
            setFormData((prev) => ({
              ...prev,
              email: authUser.email || "",
              firstName: authUser.user_metadata?.full_name?.split(" ")[0] || "",
              lastName: authUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
              phone: authUser.user_metadata?.phone || "",
            }))
          }
        }

        // Get car data
        const carId = searchParams.get("carId")
        if (carId) {
          const foundCar = await getCarAction(carId)
          if (foundCar) {
            setCar(foundCar)
          } else {
            setError("Car not found")
            return
          }
        } else {
          setError("No car selected")
          return
        }

        // Get trip details from URL
        const pickup = searchParams.get("pickupLocation")
        const dropoff = searchParams.get("dropoffLocation")
        const pickupDate = searchParams.get("pickupDate")
        const dropoffDate = searchParams.get("dropoffDate")
        const pickupTime = searchParams.get("pickupTime")
        const dropoffTime = searchParams.get("dropoffTime")

        setTripDetails({
          pickupLocation: pickup || "London, UK",
          dropoffLocation: dropoff || "London, UK",
          pickupDate: pickupDate || "",
          dropoffDate: dropoffDate || "",
          pickupTime: pickupTime || "10:00",
          dropoffTime: dropoffTime || "10:00",
        })
      } catch (err) {
        console.error("[v0] Error initializing checkout:", err)
        setError("Failed to load checkout")
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [searchParams])

  const calculateRentalDays = () => {
    if (!tripDetails.pickupDate || !tripDetails.dropoffDate) return 1
    const pickup = new Date(tripDetails.pickupDate)
    const dropoff = new Date(tripDetails.dropoffDate)
    const days = Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 1
  }

  const rentalDays = calculateRentalDays()
  const totalAmount = car ? car.pricePerDay * rentalDays : 0
  const bookingType = (car?.rentalType || car?.rental_type || "Rent") as "Rent" | "Flexi Hire" | "PCO Hire"

  const validatePersonalInfo = () => {
    if (!formData.firstName || !formData.lastName) {
      setError("Please enter your full name")
      return false
    }
    if (!formData.email) {
      setError("Please enter your email address")
      return false
    }
    if (!formData.phone) {
      setError("Please enter your phone number")
      return false
    }
    if (!formData.drivingLicense) {
      setError("Please enter your driving license number")
      return false
    }
    if (!tripDetails.pickupDate || !tripDetails.dropoffDate) {
      setError("Please select pickup and dropoff dates")
      return false
    }
    setError(null)
    return true
  }

  const handleContinueToDocuments = () => {
    if (validatePersonalInfo()) {
      setCurrentStep(2)
    }
  }

  const handleContinueToConfirm = () => {
    if (!documentsComplete) {
      setError("Please complete all required document uploads")
      return
    }
    setError(null)
    setCurrentStep(3)
  }

  const handleDocumentComplete = (isComplete: boolean, data: DocumentData) => {
    setDocumentsComplete(isComplete)
    setDocumentData(data)
  }

  const handleSubmitBooking = async () => {
    if (!car || !documentData) return

    if (!documentsComplete) {
      setError("Please complete all required document uploads")
      return
    }

    setIsCreatingBooking(true)
    setError(null)

    try {
      // Call API to create booking with documents
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: car.id,
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          drivingLicenseNumber: formData.drivingLicense,
          pickupLocation: tripDetails.pickupLocation,
          dropoffLocation: tripDetails.dropoffLocation,
          pickupDate: tripDetails.pickupDate,
          dropoffDate: tripDetails.dropoffDate,
          pickupTime: tripDetails.pickupTime,
          dropoffTime: tripDetails.dropoffTime,
          totalAmount: totalAmount,
          bookingType: bookingType,
          userId: user?.id || null,
          // Document data
          niNumber: documentData.niNumber,
          drivingLicenseFrontUrl: documentData.documents.licenseFront.url,
          drivingLicenseBackUrl: documentData.documents.licenseBack.url,
          proofOfAddressUrl: documentData.documents.proofOfAddress.url,
          bankStatementUrl: documentData.documents.bankStatement?.url || null,
          privateHireLicenseFrontUrl: documentData.documents.privateHireLicenseFront?.url || null,
          privateHireLicenseBackUrl: documentData.documents.privateHireLicenseBack?.url || null,
          status: "Documents Submitted", // Set initial status
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create booking")
      }

      // Redirect to confirmation page
      router.push(`/confirmation?bookingId=${result.booking.id}`)
    } catch (err) {
      console.error("[v0] Error creating booking:", err)
      setError(err instanceof Error ? err.message : "Failed to create booking")
      setIsCreatingBooking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    )
  }

  if (error && !car) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <p className="mb-4 text-red-400">{error}</p>
        <Button onClick={() => router.push("/")} variant="outline">
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.back()}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Complete Your Booking</h1>
            <p className="text-sm text-gray-400">
              {bookingType} • Step {currentStep} of 3
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {[
              { step: 1, label: "Personal Info" },
              { step: 2, label: "Documents" },
              { step: 3, label: "Confirm" },
            ].map(({ step, label }, index) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`flex items-center gap-2 rounded-full px-3 py-2 sm:px-4 ${
                    currentStep >= step 
                      ? "bg-red-500 text-white" 
                      : "bg-zinc-800 text-gray-400"
                  }`}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    currentStep > step ? "bg-white text-red-500" : "bg-white/20"
                  }`}>
                    {currentStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
                  </div>
                  <span className="hidden text-sm font-medium sm:inline">{label}</span>
                </div>
                {index < 2 && (
                  <div className={`mx-2 h-0.5 w-8 sm:w-12 ${
                    currentStep > step ? "bg-red-500" : "bg-zinc-700"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <Card className="border border-zinc-800 bg-zinc-900 p-6">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
                  <User className="h-5 w-5 text-red-500" />
                  Your Information
                </h2>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName" className="text-gray-300">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="mt-2 border-zinc-700 bg-zinc-800 text-white placeholder:text-gray-500"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-gray-300">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="mt-2 border-zinc-700 bg-zinc-800 text-white placeholder:text-gray-500"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-300">
                      <Mail className="mr-2 inline h-4 w-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-2 border-zinc-700 bg-zinc-800 text-white placeholder:text-gray-500"
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-300">
                      <Phone className="mr-2 inline h-4 w-4" />
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-2 border-zinc-700 bg-zinc-800 text-white placeholder:text-gray-500"
                      placeholder="+44 7700 900000"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="drivingLicense" className="text-gray-300">
                      <IdCard className="mr-2 inline h-4 w-4" />
                      Driving License Number *
                    </Label>
                    <Input
                      id="drivingLicense"
                      value={formData.drivingLicense}
                      onChange={(e) => setFormData({ ...formData, drivingLicense: e.target.value })}
                      className="mt-2 border-zinc-700 bg-zinc-800 text-white placeholder:text-gray-500"
                      placeholder="Enter your driving license number"
                      required
                    />
                  </div>
                </div>

                {/* Trip Details Summary */}
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                    <Calendar className="h-5 w-5 text-red-500" />
                    Trip Details
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border border-zinc-700 bg-zinc-800 p-3">
                      <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                      <div className="text-sm">
                        <p className="font-semibold text-white">{tripDetails.pickupLocation}</p>
                        <p className="text-gray-400">to {tripDetails.dropoffLocation}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-zinc-700 bg-zinc-800 p-3">
                      <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                      <div className="text-sm">
                        <p className="font-semibold text-white">
                          {tripDetails.pickupDate || "Select date"} - {tripDetails.dropoffDate || "Select date"}
                        </p>
                        <p className="text-gray-400">
                          {rentalDays} day{rentalDays > 1 ? "s" : ""} rental
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-zinc-700 bg-zinc-800 p-3">
                      <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                      <div className="text-sm">
                        <p className="font-semibold text-white">
                          Pickup: {tripDetails.pickupTime} | Return: {tripDetails.dropoffTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleContinueToDocuments}
                  className="mt-6 w-full rounded-xl bg-red-500 py-6 text-lg font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:bg-red-600"
                >
                  Continue to Documents
                </Button>
              </Card>
            )}

            {/* Step 2: Document Upload */}
            {currentStep === 2 && (
              <>
                <RequiredDocuments
                  bookingType={bookingType}
                  bookingDate={tripDetails.pickupDate}
                  onComplete={handleDocumentComplete}
                />

                <div className="flex gap-4">
                  <Button
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                    className="flex-1 border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleContinueToConfirm}
                    disabled={!documentsComplete}
                    className="flex-1 rounded-xl bg-red-500 py-6 text-lg font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {documentsComplete ? "Continue to Confirm" : "Complete All Documents"}
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <Card className="border border-zinc-800 bg-zinc-900 p-6">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Confirm Your Booking
                </h2>

                {/* Summary */}
                <div className="space-y-4">
                  {/* Personal Info Summary */}
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                    <h3 className="mb-3 font-semibold text-white flex items-center gap-2">
                      <User className="h-4 w-4 text-red-500" />
                      Personal Information
                    </h3>
                    <div className="grid gap-2 text-sm">
                      <p className="text-gray-400">
                        Name: <span className="text-white">{formData.firstName} {formData.lastName}</span>
                      </p>
                      <p className="text-gray-400">
                        Email: <span className="text-white">{formData.email}</span>
                      </p>
                      <p className="text-gray-400">
                        Phone: <span className="text-white">{formData.phone}</span>
                      </p>
                      <p className="text-gray-400">
                        Driving License: <span className="text-white">{formData.drivingLicense}</span>
                      </p>
                      {documentData?.niNumber && (
                        <p className="text-gray-400">
                          NI Number: <span className="text-white">{documentData.niNumber}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Documents Summary */}
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                    <h3 className="mb-3 font-semibold text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Documents Verified
                    </h3>
                    <ul className="space-y-1 text-sm text-green-300">
                      <li>✓ Driving Licence (Front & Back)</li>
                      {(bookingType === "PCO Hire") && (
                        <li>✓ Private Hire Licence (Front & Back)</li>
                      )}
                      <li>✓ National Insurance Number</li>
                      {(bookingType === "Flexi Hire" || bookingType === "PCO Hire") && (
                        <li>✓ Bank Statement (Proof of Affordability)</li>
                      )}
                      <li>✓ Proof of Address</li>
                    </ul>
                  </div>

                  {/* Terms */}
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                    <p className="text-sm text-gray-400">
                      By confirming this booking, you agree to our{" "}
                      <a href="/terms" className="text-red-400 hover:underline">
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" className="text-red-400 hover:underline">
                        Privacy Policy
                      </a>
                      . Your documents will be reviewed by our team.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    variant="outline"
                    className="flex-1 border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmitBooking}
                    disabled={isCreatingBooking}
                    className="flex-1 rounded-xl bg-red-500 py-6 text-lg font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:bg-red-600 disabled:opacity-50"
                  >
                    {isCreatingBooking ? (
                      <span className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Confirm Booking
                      </span>
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-lg font-bold text-white">Booking Summary</h2>

              {car && (
                <>
                  <div className="mb-4 overflow-hidden rounded-lg">
                    <Image
                      src={car.image || "/placeholder.svg"}
                      alt={car.name}
                      width={400}
                      height={200}
                      className="h-40 w-full object-cover"
                    />
                  </div>

                  <h3 className="mb-1 text-xl font-bold text-white">{car.name}</h3>
                  <p className="mb-2 text-sm text-gray-400">{car.category}</p>
                  
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                    bookingType === "Rent" ? "bg-green-500/20 text-green-400" :
                    bookingType === "Flexi Hire" ? "bg-blue-500/20 text-blue-400" :
                    "bg-purple-500/20 text-purple-400"
                  }`}>
                    {bookingType}
                  </div>

                  <div className="space-y-3 border-t border-zinc-700 pt-4">
                    <div className="flex justify-between text-gray-300">
                      <span>Daily Rate</span>
                      <span className="font-semibold text-white">£{car.pricePerDay}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Duration</span>
                      <span className="font-semibold text-white">
                        {rentalDays} day{rentalDays > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="my-3 border-t border-zinc-700"></div>
                    <div className="flex justify-between text-xl font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-red-500">£{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-6 pt-4 border-t border-zinc-700">
                    <p className="text-xs text-gray-400 mb-2">Completion Status</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`h-4 w-4 ${formData.firstName ? "text-green-400" : "text-gray-600"}`} />
                        <span className={formData.firstName ? "text-white" : "text-gray-500"}>
                          Personal Info
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`h-4 w-4 ${documentsComplete ? "text-green-400" : "text-gray-600"}`} />
                        <span className={documentsComplete ? "text-white" : "text-gray-500"}>
                          Documents
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`h-4 w-4 ${currentStep === 3 ? "text-green-400" : "text-gray-600"}`} />
                        <span className={currentStep === 3 ? "text-white" : "text-gray-500"}>
                          Confirmation
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
