"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getCarAction, type Car, createSalesRequestAction } from "@/app/actions/database"
import { Star, ArrowLeft, MapPin, Clock, Heart, Gauge, Navigation, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CarImageGallery } from "@/components/car-image-gallery"
import { createClient } from "@/lib/supabase/client"
import { getBookingConstraints } from "@/app/actions/booking-validation"

export function CarDetail({ carId }: { carId: string }) {
  const router = useRouter()
  const [car, setCar] = useState<Car | null>(null)
  const [carImages, setCarImages] = useState<string[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [pickupLocation, setPickupLocation] = useState("London, UK")
  const [dropoffLocation, setDropoffLocation] = useState("London, UK")
  const [pickupDate, setPickupDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [pickupTime, setPickupTime] = useState("10:00")
  const [returnTime, setReturnTime] = useState("10:00")

  const [showVisitForm, setShowVisitForm] = useState(false)
  const [visitFormData, setVisitFormData] = useState({
    name: "",
    email: "",
    phone: "",
    visitDate: "",
    message: "",
  })
  const [visitRequestSubmitted, setVisitRequestSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [bookingConstraints, setBookingConstraints] = useState<any>(null)

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const fetchedCar = await getCarAction(carId)
        setCar(fetchedCar || null)

        if (fetchedCar) {
          const supabase = createClient()
          const { data: images } = await supabase.from("car_images").select("image_url").eq("car_id", carId)
          setCarImages(images?.map((img) => img.image_url) || [])

          // Fetch booking constraints for this rental type
          const rentalType = (fetchedCar.rentalType || "Rent") as "Rent" | "Flexi Hire" | "PCO Hire"
          const constraints = await getBookingConstraints(rentalType)
          setBookingConstraints(constraints)
        }
      } catch (error) {
        console.error("Error fetching car:", error)
      } finally {
        setImageLoading(false)
      }
    }
    fetchCar()
  }, [carId])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [])

  const handleConfirmOrder = () => {
    if (!car) return

    if (!user) {
      router.push("/login")
      return
    }

    setValidationError("")

    if (!pickupLocation) {
      setValidationError("Please select a pickup location")
      return
    }

    if (!pickupDate || !returnDate) {
      setValidationError("Please select pickup and drop-off dates")
      return
    }

    if (new Date(pickupDate) >= new Date(returnDate)) {
      setValidationError("Drop-off date must be after pickup date")
      return
    }

    // Validate against booking constraints
    if (bookingConstraints) {
      const days = Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24))

      if (days < bookingConstraints.minDays) {
        setValidationError(`Minimum booking duration for ${car.rentalType} is ${bookingConstraints.minDays} day${bookingConstraints.minDays > 1 ? "s" : ""}`)
        return
      }

      if (days > bookingConstraints.maxDays) {
        setValidationError(`Maximum booking duration for ${car.rentalType} is ${bookingConstraints.maxDays} days`)
        return
      }
    }

    // Proceed directly to checkout for all users
    proceedToCheckout()
  }

  const proceedToCheckout = () => {
    if (!car) return

    const params = new URLSearchParams({
      carId: car.id,
      pickupLocation: pickupLocation,
      dropoffLocation: dropoffLocation,
      pickupDate: pickupDate,
      dropoffDate: returnDate,
      pickupTime: pickupTime,
      dropoffTime: returnTime,
    })
    router.push(`/checkout?${params.toString()}`)
  }

  const handleVisitRequest = async () => {
    if (!car) return

    setIsSubmitting(true)

    const salesRequest = {
      carId: car.id,
      customerName: visitFormData.name,
      customerEmail: visitFormData.email,
      customerPhone: visitFormData.phone,
      preferredDate: visitFormData.visitDate,
      message: visitFormData.message,
      status: "Pending",
    }

    const result = await createSalesRequestAction(salesRequest)
    setIsSubmitting(false)

    if (result) {
      setVisitRequestSubmitted(true)
      setTimeout(() => {
        setShowVisitForm(false)
        setVisitRequestSubmitted(false)
        setVisitFormData({ name: "", email: "", phone: "", visitDate: "", message: "" })
      }, 3000)
    } else {
      alert("Failed to submit visit request. Please try again.")
    }
  }

  if (imageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-pulse">
          <div className="h-8 w-64 mx-auto bg-white/10 rounded-lg mb-4"></div>
          <div className="h-4 w-48 mx-auto bg-white/10 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white">Car not found</h1>
        <Button onClick={() => router.push("/")} className="mt-6 rounded-full bg-red-500 text-white hover:bg-red-600">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    )
  }

  const isSalesCar = car.rentalType === "Sales"
  const isFlexiOrPCO = car.rentalType === "Flexi Hire" || car.rentalType === "PCO Hire"
  const priceLabel = isFlexiOrPCO ? "Per Month" : "Per Day"
  const pricePerUnit = car.pricePerDay

  // For monthly rentals, calculate total based on months
  const calculateRentalDays = () => {
    if (!pickupDate || !returnDate) return 0
    const pickup = new Date(pickupDate)
    const returnD = new Date(returnDate)
    const days = Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24))

    // For Flexi Hire and PCO Hire, minimum 30 days
    if (isFlexiOrPCO && days > 0 && days < 30) {
      return 0 // Return 0 to show error state
    }

    return days > 0 ? days : 0
  }

  const rentalDays = calculateRentalDays()

  const totalMonths = isFlexiOrPCO
    ? Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (30 * 24 * 60 * 60 * 1000))
    : 0
  const totalAmount = isFlexiOrPCO
    ? totalMonths > 0
      ? pricePerUnit * totalMonths
      : 0
    : rentalDays > 0
      ? car.pricePerDay * rentalDays
      : 0

  const discount = totalAmount > 0 ? 24 : 0
  const finalAmount = totalAmount - discount

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black pb-20 lg:pb-8">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{car.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsFavorite(!isFavorite)}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10"
            >
              <Navigation className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-6">
          <div className="space-y-6 lg:col-span-2">
            <Card className="overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-md shadow-black/30">
              <div className="p-6">
                <CarImageGallery images={carImages} carName={car.name} />

                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-bold text-white">£{car.pricePerDay}</div>
                    <div className="text-2xl font-semibold text-white/30 line-through">£{car.pricePerDay + 6}</div>
                    <div className="ml-2 text-sm text-white/60">{priceLabel}</div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-white">{car.rating}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-white/60" />
                      <span className="text-white/80">560 miles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-white/60" />
                      <span className="text-white/80">52 Trips</span>
                    </div>
                  </div>
                </div>

                {/* Adding car title below rating section */}
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{car.name}</h2>
                  <p className="text-white/60 mt-1">
                    {car.brand} • {car.year}
                  </p>
                </div>

                {car.description && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-sm text-white/70 leading-relaxed">{car.description}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-md shadow-black/30 p-6">
              <h2 className="mb-6 text-xl font-bold text-white">Vehicle Features</h2>

              <div className="grid gap-8 sm:grid-cols-3">
                <div>
                  <h3 className="mb-4 text-sm font-bold text-white">Safety</h3>
                  <div className="space-y-3">
                    {car.safetyFeatures && car.safetyFeatures.length > 0 ? (
                      car.safetyFeatures.map((feature, index) => (
                        <div key={index} className="text-sm text-white/70">
                          {feature}
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="text-sm text-white/70">Backup camera</div>
                        <div className="text-sm text-white/70">Blind spot warning</div>
                        <div className="text-sm text-white/70">Lane assist</div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-sm font-bold text-white">Device connectivity</h3>
                  <div className="space-y-3">
                    {car.deviceFeatures && car.deviceFeatures.length > 0 ? (
                      car.deviceFeatures.map((feature, index) => (
                        <div key={index} className="text-sm text-white/70">
                          {feature}
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="text-sm text-white/70">AUX input</div>
                        <div className="text-sm text-white/70">Bluetooth</div>
                        <div className="text-sm text-white/70">USB ports</div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-sm font-bold text-white">Convenience</h3>
                  <div className="space-y-3">
                    {car.convenienceFeatures && car.convenienceFeatures.length > 0 ? (
                      car.convenienceFeatures.map((feature, index) => (
                        <div key={index} className="text-sm text-white/70">
                          {feature}
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="text-sm text-white/70">Keyless entry</div>
                        <div className="text-sm text-white/70">Climate control</div>
                        <div className="text-sm text-white/70">Cruise control</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {car.features && car.features.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="mb-4 text-sm font-bold text-white">Additional features</h3>
                  <div className="flex flex-wrap gap-2">
                    {car.features.map((feature) => (
                      <Badge key={feature} className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {isSalesCar ? (
              <Card className="sticky top-6 border border-white/10 bg-white/5 backdrop-blur-xl shadow-md shadow-black/30 p-6">
                <h2 className="mb-6 text-xl font-bold text-white">Request a Visit</h2>

                {!showVisitForm ? (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                      <p className="mb-2 text-sm text-white/60">Call us directly</p>
                      <a
                        href="tel:+441234567890"
                        className="text-2xl font-bold text-white hover:text-red-400 transition-colors"
                      >
                        +44 123 456 7890
                      </a>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-black/50 px-2 text-white/60">Or</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowVisitForm(true)}
                      className="w-full rounded-xl bg-red-500 py-6 text-base font-semibold text-white hover:bg-red-600 transition-all duration-300 shadow-lg shadow-red-500/30"
                    >
                      Request a Visit
                    </Button>

                    <p className="text-xs text-white/50 text-center">Schedule a visit to see this vehicle in person</p>
                  </div>
                ) : visitRequestSubmitted ? (
                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                      <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-white">Request Sent!</h3>
                    <p className="text-sm text-white/70">We'll contact you soon to schedule your visit.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/60">Full Name</label>
                      <input
                        type="text"
                        value={visitFormData.name}
                        onChange={(e) => setVisitFormData({ ...visitFormData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/60">Email Address</label>
                      <input
                        type="email"
                        value={visitFormData.email}
                        onChange={(e) => setVisitFormData({ ...visitFormData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/60">Phone Number</label>
                      <input
                        type="tel"
                        value={visitFormData.phone}
                        onChange={(e) => setVisitFormData({ ...visitFormData, phone: e.target.value })}
                        placeholder="+44 123 456 7890"
                        className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/60">Preferred Visit Date</label>
                      <input
                        type="date"
                        value={visitFormData.visitDate}
                        onChange={(e) => setVisitFormData({ ...visitFormData, visitDate: e.target.value })}
                        className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 resize-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/60">Message (Optional)</label>
                      <textarea
                        value={visitFormData.message}
                        onChange={(e) => setVisitFormData({ ...visitFormData, message: e.target.value })}
                        placeholder="Any specific questions or requirements..."
                        rows={3}
                        className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowVisitForm(false)}
                        variant="outline"
                        className="flex-1 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleVisitRequest}
                        disabled={!visitFormData.name || !visitFormData.email || !visitFormData.phone || isSubmitting}
                        className="flex-1 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Request"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <>
                <Card className="sticky top-6 border border-white/10 bg-white/5 backdrop-blur-xl shadow-md shadow-black/30 p-6">
                  <h2 className="mb-6 text-xl font-bold text-white">Your Trip</h2>

                  {validationError && (
                    <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                      {validationError}
                    </div>
                  )}

                  {isFlexiOrPCO && (
                    <div className="mb-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                      <p className="text-xs text-yellow-200 font-medium">
                        ⚠️ Minimum rental period: {bookingConstraints?.minDays || 30} days ({car.rentalType})
                      </p>
                    </div>
                  )}

                  {bookingConstraints && !isFlexiOrPCO && (
                    <div className="mb-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                      <p className="text-xs text-blue-200 font-medium">
                        ℹ️ Booking duration: {bookingConstraints.minDays}-{bookingConstraints.maxDays} days
                      </p>
                    </div>
                  )}

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/60">Pick Up Location *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60 pointer-events-none z-10" />
                        <select
                          value={pickupLocation}
                          onChange={(e) => setPickupLocation(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 pl-10 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 cursor-pointer"
                        >
                          <option value="" className="bg-neutral-900 text-white">
                            Select location
                          </option>
                          <option value="London, UK" className="bg-neutral-900 text-white">
                            London, UK
                          </option>
                          <option value="Manchester, UK" className="bg-neutral-900 text-white">
                            Manchester, UK
                          </option>
                          <option value="Birmingham, UK" className="bg-neutral-900 text-white">
                            Birmingham, UK
                          </option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/60">Drop Off Location *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60 pointer-events-none z-10" />
                        <select
                          value={dropoffLocation}
                          onChange={(e) => setDropoffLocation(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 pl-10 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 cursor-pointer"
                        >
                          <option value="" className="bg-neutral-900 text-white">
                            Select location
                          </option>
                          <option value="London, UK" className="bg-neutral-900 text-white">
                            London, UK
                          </option>
                          <option value="Manchester, UK" className="bg-neutral-900 text-white">
                            Manchester, UK
                          </option>
                          <option value="Birmingham, UK" className="bg-neutral-900 text-white">
                            Birmingham, UK
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/60">Pick Up Date *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60 pointer-events-none z-10" />
                        <input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          placeholder="25/07/2025"
                          className="w-full appearance-none rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 pl-10 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 cursor-pointer [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/60">Drop Off Date *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60 pointer-events-none z-10" />
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          min={
                            isFlexiOrPCO && pickupDate
                              ? new Date(new Date(pickupDate).getTime() + 30 * 24 * 60 * 60 * 1000)
                                .toISOString()
                                .split("T")[0]
                              : pickupDate || new Date().toISOString().split("T")[0]
                          }
                          placeholder="29/07/2025"
                          className="w-full appearance-none rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 pl-10 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 cursor-pointer [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/60">Pick Up Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60 pointer-events-none z-10" />
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 pl-10 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 cursor-pointer [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/60">Drop Off Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60 pointer-events-none z-10" />
                        <input
                          type="time"
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 pl-10 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 cursor-pointer [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  {isFlexiOrPCO && pickupDate && returnDate && rentalDays === 0 && (
                    <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                      <p className="text-xs text-red-200 font-medium">
                        Please select at least 30 days for {car.rentalType}
                      </p>
                    </div>
                  )}
                </Card>

                <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-md shadow-black/30 p-6">
                  <h2 className="mb-6 text-xl font-bold text-white">Price Details</h2>

                  <div className="space-y-3 text-sm">
                    {rentalDays > 0 ? (
                      <>
                        <div className="flex justify-between text-white/70">
                          <span>
                            {isFlexiOrPCO
                              ? `${car.rentalType} x ${totalMonths} ${totalMonths === 1 ? "month" : "months"} (${rentalDays} days)`
                              : `Car Rent Amount x ${rentalDays} ${rentalDays === 1 ? "day" : "days"}`}
                          </span>
                          <span className="font-semibold text-white">£{totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Discount</span>
                          <span className="font-semibold text-white">- £{discount}</span>
                        </div>
                        <div className="border-t border-white/10 my-3"></div>
                        <div className="flex justify-between text-base font-bold text-white">
                          <span>Total Amount</span>
                          <span>£{finalAmount}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-white/60 py-4">
                        {isFlexiOrPCO ? "Select dates (minimum 30 days)" : "Select dates to see pricing"}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleConfirmOrder}
                    disabled={!pickupLocation || !pickupDate || !returnDate || rentalDays <= 0}
                    className="mt-6 w-full rounded-xl bg-red-500 py-6 text-base font-semibold text-white hover:bg-red-600 transition-all duration-300 shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500"
                  >
                    {rentalDays > 0
                      ? isFlexiOrPCO
                        ? `Book Now - £${car.pricePerDay}/month`
                        : `Book Now - £${car.pricePerDay}/day`
                      : isFlexiOrPCO
                        ? "Select dates (min. 30 days)"
                        : "Select dates to book"}
                  </Button>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {!isSalesCar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-xl p-3 shadow-lg lg:hidden">
          <Button
            onClick={handleConfirmOrder}
            disabled={!pickupLocation || !pickupDate || !returnDate || rentalDays <= 0}
            className="w-full rounded-xl bg-red-500 py-3 text-base font-semibold text-white hover:bg-red-600 shadow-md shadow-red-500/30"
          >
            {rentalDays > 0
              ? isFlexiOrPCO
                ? `Book Now - £${car.pricePerDay}/month`
                : `Book Now - £${car.pricePerDay}/day`
              : isFlexiOrPCO
                ? "Select dates (min. 30 days)"
                : "Select dates to book"}
          </Button>
        </div>
      )}
    </div>
  )
}
