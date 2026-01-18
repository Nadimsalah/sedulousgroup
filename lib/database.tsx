import { createClient, createAdminClient } from "./supabase/server"

export interface Car {
  id: string
  name: string
  category: string
  brand: string
  year: string
  image: string
  images?: string[]
  pricePerDay: number
  passengers: number
  luggage: number
  transmission: string
  fuelType: string
  rating: number
  status?: "Published" | "Draft"
  description?: string
  features?: {
    passengers: number
    luggage: number
    transmission: string
    fuelType: string
  }
  safetyFeatures?: string[]
  deviceFeatures?: string[]
  convenienceFeatures?: string[]
  rentalType?: "Rent" | "Flexi Hire" | "PCO Hire" | "Sales" // Added Sales to rental type options
}

export interface Story {
  id: string
  title: string
  linkedCarId: string
  carName: string
  thumbnail: string
  stories: {
    image: string
    duration: number
  }[]
  status?: "Published" | "Draft"
  rentalType?: "Rent" | "Flexi Hire" | "PCO Hire" | "Sales" // Added rental type to Story interface
}

export interface Booking {
  id: string
  carId: string
  userId?: string // Added userId to Booking interface
  customerName: string
  customerEmail: string
  customerPhone: string
  pickupLocation: string
  dropoffLocation: string
  pickupDate: string
  dropoffDate: string
  pickupTime: string
  dropoffTime: string
  totalAmount: number
  status: string
  bookingType?: "Rent" | "Flexi Hire" | "PCO Hire" | "Sales"
  createdAt: string
  updatedAt: string
  pickupVerifiedAt?: string | null
  verificationPhotos?: Array<{
    type: "client_with_car" | "mileage_front" | "condition_rear" | "licence" | "insurance"
    url: string
    uploadedAt: string
  }>
  documentsSubmittedAt?: string
  drivingLicenseNumber?: string
  drivingLicenseFrontUrl?: string
  drivingLicenseBackUrl?: string
  proofOfAddressUrl?: string
  niNumber?: string
  bankStatementUrl?: string
  privateHireLicenseFrontUrl?: string
  privateHireLicenseBackUrl?: string
  stripeSessionId?: string
  stripePaymentIntentId?: string
  verifiedBy?: string
}

export interface SalesRequest {
  id: string
  carId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  preferredDate: string
  message?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  username?: string
  fullName?: string
  avatarUrl?: string
  phone?: string
  drivingLicenseNumber?: string
  drivingLicenseFrontUrl?: string
  drivingLicenseBackUrl?: string
  proofOfAddressUrl?: string
  niNumber?: string
  bankStatementUrl?: string
  privateHireLicenseFrontUrl?: string
  privateHireLicenseBackUrl?: string
  documentsUpdatedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Agreement {
  id: string
  agreementNumber: string
  bookingId: string
  customerId?: string
  vehicleId?: string
  status: "pending" | "sent" | "signed" | "active" | "completed" | "cancelled"
  agreementType: "rent" | "flexi_hire" | "pco_hire"
  startDate: string
  endDate: string
  totalAmount: number
  depositAmount?: number
  unsignedAgreementUrl?: string
  signedAgreementUrl?: string
  customerSignatureData?: string
  signedAt?: string
  sentToCustomerAt?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  mediaUrls?: string[] // Added for media URLs
  fuelLevel?: string // Added for fuel level
  odometerReading?: number // Added for odometer reading
  vehiclePhotos?: string[] // Car condition photos taken at handover
}

export interface VehicleInspection {
  id: string
  agreementId: string
  bookingId: string
  vehicleId: string
  inspectionType: "handover" | "return"
  odometerReading: number
  fuelLevel: "full" | "3/4" | "1/2" | "1/4" | "empty"
  exteriorPhotos: string[]
  interiorPhotos: string[]
  damagePhotos: string[]
  videoUrls: string[]
  damageNotes?: string
  overallCondition: "excellent" | "good" | "fair" | "poor"
  inspectedBy?: string
  inspectedAt: string
  createdAt: string
  updatedAt: string
}

export interface PCNTicket {
  id: string
  agreementId: string
  bookingId: string
  customerId?: string
  vehicleId?: string
  ticketType: "parking" | "speeding" | "congestion" | "other"
  ticketNumber?: string
  issueDate: string
  dueDate?: string
  amount: number
  status: "pending" | "sent_to_customer" | "paid" | "disputed" | "cancelled"
  paidBy?: "customer" | "company"
  paidAt?: string
  ticketDocumentUrl: string
  proofOfPaymentUrl?: string
  sentToCustomerAt?: string
  customerNotified: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  uploadedBy?: string
}

export interface PCNTicketWithDetails extends PCNTicket {
  customerName?: string
  customerEmail?: string
  carName?: string
  registrationNumber?: string
  agreementNumber?: string
}

export interface DamageReport {
  id: string
  agreementId?: string
  bookingId?: string
  vehicleId: string
  customerId?: string
  damageType: "accident" | "scratch" | "dent" | "mechanical" | "interior" | "other"
  severity: "minor" | "moderate" | "severe"
  description: string
  locationOnVehicle?: string
  incidentDate: string
  reportedDate: string
  damagePhotos: string[]
  damageVideos: string[]
  estimatedCost?: number
  actualCost?: number
  repairStatus: "pending" | "in_progress" | "completed" | "no_repair_needed"
  repairedBy?: string
  repairedAt?: string
  responsibleParty?: "customer" | "company" | "third_party"
  insuranceClaimNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
  reportedBy?: string
}

export interface Vendor {
  id: string
  name: string
  vendorType: "mechanic" | "body_shop" | "supplier" | "insurance" | "other"
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  rating?: number
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Deposit {
  id: string
  agreementId: string
  bookingId: string
  customerId: string
  amount: number
  paymentMethod?: "card" | "cash" | "bank_transfer"
  transactionId?: string
  status: "held" | "refunded" | "deducted" | "partially_refunded"
  refundAmount?: number
  deductionAmount?: number
  deductionReason?: string
  refundedAt?: string
  refundTransactionId?: string
  notes?: string
  createdAt: string
  updatedAt: string
  processedBy?: string
}

class Database {
  private async getSupabaseClient() {
    const client = await createClient()
    if (!client) {
      console.log("[v0] Database: Supabase not configured, operations will return empty results")
    }
    return client
  }

  private async getAdminClient() {
    const client = await createAdminClient()
    if (!client) {
      console.log("[v0] Database: Supabase admin not configured, operations will return empty results")
    }
    return client
  }

  // Cars operations
  async getCars(): Promise<Car[]> {
    const supabase = await this.getSupabaseClient()

    if (!supabase) {
      console.log("[v0] Database.getCars: Supabase not configured, returning empty array")
      return []
    }

    console.log("[v0] Database.getCars: Fetching cars from Supabase...")

    const { data, error } = await supabase.from("cars").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching cars:", error)
      console.error("[v0] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return []
    }

    console.log(`[v0] Database.getCars: Successfully fetched ${data?.length || 0} cars`)

    return (data || []).map((car) => {
      const features = car.features || {}
      return {
        id: car.id,
        name: car.name,
        category: car.category,
        brand: car.brand,
        year: car.year?.toString() || "",
        image: car.image || "",
        pricePerDay: Number(car.price) || 0,
        passengers: car.passengers || 0,
        luggage: car.luggage || 0,
        transmission: car.transmission || "",
        fuelType: car.fuel_type || "",
        rating: Number(car.rating) || 4.5,
        description: car.description || "",
        safetyFeatures: features.safety || [],
        deviceFeatures: features.deviceConnectivity || [],
        convenienceFeatures: features.convenience || [],
        status: "Published" as const,
        rentalType: car.rental_type || "Rent", // Added rental type mapping
      }
    })
  }

  async getCar(id: string): Promise<Car | null> {
    const supabase = await this.getSupabaseClient()

    if (!supabase) {
      console.log("[v0] Database.getCar: Supabase not configured, returning null")
      return null
    }

    const { data, error } = await supabase.from("cars").select("*").eq("id", id).single()

    if (error || !data) {
      console.error("[v0] Error fetching car:", error)
      return null
    }

    const features = data.features || {}
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      brand: data.brand,
      year: data.year?.toString() || "",
      image: data.image || "",
      pricePerDay: Number(data.price) || 0,
      passengers: data.passengers || 0,
      luggage: data.luggage || 0,
      transmission: data.transmission || "",
      fuelType: data.fuel_type || "",
      rating: Number(data.rating) || 4.5,
      description: data.description || "",
      safetyFeatures: features.safety || [],
      deviceFeatures: features.deviceConnectivity || [],
      convenienceFeatures: features.convenience || [],
      status: "Published" as const,
      rentalType: data.rental_type || "Rent", // Added rental type mapping
    }
  }

  async addCar(car: Omit<Car, "id">): Promise<Car | null> {
    console.log("[v0] Database.addCar called with:", car)

    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.addCar: Supabase admin not configured")
      return null
    }

    const carData = {
      id: `car-${Date.now()}`,
      name: car.name,
      brand: car.brand,
      category: car.category,
      year: Number.parseInt(car.year),
      price: car.pricePerDay,
      rating: car.rating || 4.5,
      image: car.image,
      passengers: car.passengers,
      luggage: car.luggage,
      transmission: car.transmission,
      fuel_type: car.fuelType,
      description: car.description || "",
      features: {
        safety: car.safetyFeatures || [],
        deviceConnectivity: car.deviceFeatures || [],
        convenience: car.convenienceFeatures || [],
      },
      rental_type: car.rentalType || "Rent", // Added rental type to insert
    }

    console.log("[v0] Prepared database car data:", carData)

    const { data, error } = await supabase.from("cars").insert(carData).select().single()

    if (error) {
      console.error("[v0] Error adding car to Supabase:", error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      return null
    }

    console.log("[v0] Car successfully inserted into database:", data)

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      brand: data.brand,
      year: data.year.toString(),
      image: data.image,
      pricePerDay: Number(data.price),
      passengers: data.passengers,
      luggage: data.luggage,
      transmission: data.transmission,
      fuelType: data.fuel_type,
      rating: Number(data.rating),
      description: data.description,
      safetyFeatures: data.features?.safety || [],
      deviceFeatures: data.features?.deviceConnectivity || [],
      convenienceFeatures: data.features?.convenience || [],
      status: "Published" as const,
      rentalType: data.rental_type || "Rent", // Added rental type to return
    }
  }

  async updateCar(id: string, updates: Partial<Car>): Promise<Car | null> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.updateCar: Supabase admin not configured")
      return null
    }

    const updateData: any = {}

    if (updates.name) updateData.name = updates.name
    if (updates.brand) updateData.brand = updates.brand
    if (updates.category) updateData.category = updates.category
    if (updates.year) updateData.year = Number.parseInt(updates.year)
    if (updates.pricePerDay) updateData.price = updates.pricePerDay
    if (updates.rating) updateData.rating = updates.rating
    if (updates.image) updateData.image = updates.image
    if (updates.passengers) updateData.passengers = updates.passengers
    if (updates.luggage) updateData.luggage = updates.luggage
    if (updates.transmission) updateData.transmission = updates.transmission
    if (updates.fuelType) updateData.fuel_type = updates.fuelType
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.rentalType) updateData.rental_type = updates.rentalType // Added rental type to update

    if (updates.safetyFeatures || updates.deviceFeatures || updates.convenienceFeatures) {
      updateData.features = {
        safety: updates.safetyFeatures || [],
        deviceConnectivity: updates.deviceFeatures || [],
        convenience: updates.convenienceFeatures || [],
      }
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("cars").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating car:", error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      brand: data.brand,
      year: data.year.toString(),
      image: data.image,
      pricePerDay: Number(data.price),
      passengers: data.passengers,
      luggage: data.luggage,
      transmission: data.transmission,
      fuelType: data.fuel_type,
      rating: Number(data.rating),
      description: data.description,
      safetyFeatures: data.features?.safety || [],
      deviceFeatures: data.features?.deviceConnectivity || [],
      convenienceFeatures: data.features?.convenience || [],
      status: "Published" as const,
      rentalType: data.rental_type || "Rent", // Added rental type to return
    }
  }

  async deleteCar(id: string): Promise<boolean> {
    console.log("[v0] Database.deleteCar called with id:", id)
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.deleteCar: Supabase admin not configured")
      return false
    }

    console.log("[v0] Admin client obtained for car deletion")

    const { error } = await supabase.from("cars").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting car from Supabase:", error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      return false
    }

    console.log("[v0] Car successfully deleted from database")
    return true
  }

  // Stories operations
  async getStories(): Promise<Story[]> {
    const supabase = await this.getSupabaseClient()

    if (!supabase) {
      console.log("[v0] Database.getStories: Supabase not configured, returning empty array")
      return []
    }

    try {
      const { data, error } = await supabase.from("stories").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching stories:", error)
        return []
      }

      const stories = await Promise.all(
        (data || []).map(async (story) => {
          let carName = story.title
          if (story.linked_car_id) {
            const car = await this.getCar(story.linked_car_id)
            if (car) {
              carName = car.name
            }
          }

          let storiesArray: { image: string; duration: number }[] = []
          if (Array.isArray(story.images)) {
            storiesArray = story.images
              .map((img: any) => {
                if (typeof img === "string") {
                  return { image: img, duration: 5000 }
                } else if (img && typeof img === "object") {
                  return {
                    image: img.image || img.url || "",
                    duration: img.duration || 5000,
                  }
                }
                return { image: "", duration: 5000 }
              })
              .filter((s: any) => s.image && !s.image.startsWith("blob:")) // Filter out blob URLs
          }

          const thumbnail =
            story.thumbnail && !story.thumbnail.startsWith("blob:") ? story.thumbnail : storiesArray[0]?.image || ""

          return {
            id: story.id,
            title: story.title,
            linkedCarId: story.linked_car_id || "",
            carName: carName,
            thumbnail: thumbnail,
            stories: storiesArray,
            status: "Published" as const,
            rentalType: story.rental_type || "Rent", // Added rental type mapping from database
          }
        }),
      )

      return stories.filter((story) => {
        const hasValidThumbnail = story.thumbnail && !story.thumbnail.startsWith("blob:")
        const hasValidStories =
          story.stories &&
          story.stories.length > 0 &&
          story.stories.every((s) => s.image && !s.image.startsWith("blob:"))
        return hasValidThumbnail && hasValidStories
      })
    } catch (error) {
      console.error("[v0] Exception in getStories:", error)
      return []
    }
  }

  async getStory(id: string): Promise<Story | null> {
    const supabase = await this.getSupabaseClient()

    if (!supabase) {
      console.log("[v0] Database.getStory: Supabase not configured, returning null")
      return null
    }

    const { data, error } = await supabase.from("stories").select("*").eq("id", id).single()

    if (error || !data) {
      console.error("[v0] Error fetching story:", error)
      return null
    }

    let carName = data.title
    if (data.linked_car_id) {
      const car = await this.getCar(data.linked_car_id)
      if (car) {
        carName = car.name
      }
    }

    let storiesArray: { image: string; duration: number }[] = []
    if (Array.isArray(data.images)) {
      storiesArray = data.images
        .map((img: any) => {
          if (typeof img === "string") {
            return { image: img, duration: 5000 }
          } else if (img && typeof img === "object") {
            return {
              image: img.image || img.url || "",
              duration: img.duration || 5000,
            }
          }
          return { image: "", duration: 5000 }
        })
        .filter((s: any) => s.image)
    }

    const thumbnail = data.thumbnail || storiesArray[0]?.image || ""
    console.log("[v0] Story thumbnail:", { id: data.id, thumbnail, hasImages: storiesArray.length })

    return {
      id: data.id,
      title: data.title,
      linkedCarId: data.linked_car_id || "",
      carName: carName,
      thumbnail: thumbnail,
      stories: Array.isArray(data.images)
        ? data.images.map((img: any) => ({
          image: typeof img === "string" ? img : img.image || "",
          duration: typeof img === "object" ? img.duration || 5000 : 5000,
        }))
        : [],
      status: "Published" as const,
      rentalType: data.rental_type || "Rent", // Added rental type to return value
    }
  }

  async addStory(story: Omit<Story, "id">): Promise<Story | null> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.addStory: Supabase admin not configured")
      return null
    }

    const storyData = {
      id: `story-${Date.now()}`,
      title: story.title,
      thumbnail: story.thumbnail,
      images: story.stories.map((s) => ({
        image: s.image,
        duration: s.duration || 5000,
      })),
      linked_car_id: story.linkedCarId || null,
      rental_type: story.rentalType || "Rent", // Added rental type to database insert
    }

    const { data, error } = await supabase.from("stories").insert(storyData).select().single()

    if (error) {
      console.error("[v0] Error adding story:", error)
      return null
    }

    let carName = data.title
    if (data.linked_car_id) {
      const car = await this.getCar(data.linked_car_id)
      if (car) {
        carName = car.name
      }
    }

    return {
      id: data.id,
      title: data.title,
      linkedCarId: data.linked_car_id || "",
      carName: carName,
      thumbnail: data.thumbnail,
      stories: Array.isArray(data.images)
        ? data.images.map((img: any) => ({
          image: typeof img === "string" ? img : img.image || "",
          duration: typeof img === "object" ? img.duration || 5000 : 5000,
        }))
        : [],
      status: "Published" as const,
      rentalType: data.rental_type || "Rent", // Added rental type to return value
    }
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<Story | null> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.updateStory: Supabase admin not configured")
      return null
    }

    const updateData: any = { updated_at: new Date().toISOString() }

    if (updates.title) updateData.title = updates.title
    if (updates.thumbnail) updateData.thumbnail = updates.thumbnail
    if (updates.linkedCarId !== undefined) updateData.linked_car_id = updates.linkedCarId || null
    if (updates.stories) {
      updateData.images = updates.stories.map((s) => ({
        image: s.image,
        duration: s.duration || 5000,
      }))
    }

    const { data, error } = await supabase.from("stories").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating story:", error)
      return null
    }

    let carName = data.title
    if (data.linked_car_id) {
      const car = await this.getCar(data.linked_car_id)
      if (car) {
        carName = car.name
      }
    }

    let storiesArray: { image: string; duration: number }[] = []
    if (Array.isArray(data.images)) {
      storiesArray = data.images
        .map((img: any) => {
          if (typeof img === "string") {
            return { image: img, duration: 5000 }
          } else if (img && typeof img === "object") {
            return {
              image: img.image || img.url || "",
              duration: img.duration || 5000,
            }
          }
          return { image: "", duration: 5000 }
        })
        .filter((s: any) => s.image)
    }

    const thumbnail = data.thumbnail || storiesArray[0]?.image || ""
    console.log("[v0] Story thumbnail:", { id: data.id, thumbnail, hasImages: storiesArray.length })

    return {
      id: data.id,
      title: data.title,
      linkedCarId: data.linked_car_id || "",
      carName: carName,
      thumbnail: thumbnail,
      stories: storiesArray,
      status: "Published" as const,
      rentalType: data.rental_type || "Rent", // Added rental type to return value
    }
  }

  async deleteStory(id: string): Promise<boolean> {
    console.log("[v0] Database.deleteStory called with id:", id)
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.deleteStory: Supabase admin not configured")
      return false
    }

    console.log("[v0] Admin client obtained for story deletion")

    const { error } = await supabase.from("stories").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting story from Supabase:", error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      return false
    }

    console.log("[v0] Story successfully deleted from database")
    return true
  }

  // Bookings operations
  async createBooking(booking: Omit<Booking, "id" | "createdAt" | "updatedAt">): Promise<Booking | null> {
    console.log("[v0] Database.createBooking called with:", booking)

    try {
      let supabase = await this.getAdminClient()

      if (!supabase) {
        console.log("[v0] Admin client not available, using regular client")
        supabase = await this.getSupabaseClient()
      }

      if (!supabase) {
        console.error("[v0] Database.createBooking: No Supabase client available")
        throw new Error("Unable to process booking. Please contact support.")
      }

      console.log("[v0] Supabase client obtained")

      let customerName = booking.customerName
      let customerEmail = booking.customerEmail
      let customerPhone = booking.customerPhone
      let userId = booking.userId

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        console.log("[v0] User is logged in:", user.id)
        userId = user.id

        if (!customerEmail || customerEmail === "") {
          customerEmail = user.email || "pending@booking.com"
          console.log("[v0] Using user email from auth:", customerEmail)
        }

        if (user.user_metadata) {
          if (!customerName || customerName === "") {
            customerName = user.user_metadata.full_name || user.user_metadata.name || "Pending"
            console.log("[v0] Using user name from metadata:", customerName)
          }
          if (!customerPhone || customerPhone === "") {
            customerPhone = user.user_metadata.phone || "Pending"
            console.log("[v0] Using user phone from metadata:", customerPhone)
          }
        }
      } else {
        console.log("[v0] No user logged in, creating booking without user_id")
      }

      if (!booking.carId) {
        console.error("[v0] Missing required booking field: carId")
        throw new Error("Car information is missing")
      }

      if (booking.status !== "Pending Details" && booking.status !== "Payment Completed - Awaiting Details") {
        if (!customerName || !customerEmail || !customerPhone) {
          console.error("[v0] Missing required customer information for non-pending booking")
          throw new Error("Customer information is incomplete")
        }
      }

      const bookingData = {
        id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        car_id: booking.carId,
        user_id: userId || null,
        customer_name: customerName || "Pending",
        customer_email: customerEmail || "pending@booking.com",
        customer_phone: customerPhone || "Pending",
        pickup_location: booking.pickupLocation,
        dropoff_location: booking.dropoffLocation,
        pickup_date: booking.pickupDate,
        dropoff_date: booking.dropoffDate,
        pickup_time: booking.pickupTime,
        dropoff_time: booking.dropoffTime,
        total_amount: booking.totalAmount,
        status: booking.status || "Pending",
        booking_type: booking.bookingType || "Rent",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pickup_verified_at: booking.pickupVerifiedAt || null,
        verification_photos:
          booking.verificationPhotos?.map((photo) => ({
            type: photo.type,
            url: photo.url,
            uploaded_at: photo.uploadedAt,
          })) || [],
        verified_by: booking.verifiedBy || null,
        stripe_session_id: booking.stripeSessionId || null,
        stripe_payment_intent_id: booking.stripePaymentIntentId || null,
        driving_license_number: booking.drivingLicenseNumber || null,
        driving_license_front_url: booking.drivingLicenseFrontUrl || null,
        driving_license_back_url: booking.drivingLicenseBackUrl || null,
        proof_of_address_url: booking.proofOfAddressUrl || null,
        documents_submitted_at: booking.documentsSubmittedAt || null,
        ni_number: booking.niNumber || null,
        bank_statement_url: booking.bankStatementUrl || null,
        private_hire_license_front_url: booking.privateHireLicenseFrontUrl || null,
        private_hire_license_back_url: booking.privateHireLicenseBackUrl || null,
      }

      console.log("[v0] Prepared booking data for insert:", bookingData)

      const { data, error } = await supabase.from("bookings").insert(bookingData).select().single()

      if (error) {
        console.error("[v0] Supabase error creating booking:", error)
        console.error("[v0] Error code:", error.code)
        console.error("[v0] Error message:", error.message)
        console.error("[v0] Error details:", error.details)
        console.error("[v0] Error hint:", error.hint)

        if (error.code === "42501") {
          throw new Error("Permission denied. Please try again or contact support.")
        } else if (error.code === "23505") {
          throw new Error("This booking already exists. Please refresh the page.")
        } else {
          throw new Error(`Database error: ${error.message}`)
        }
      }

      if (!data) {
        console.error("[v0] No data returned from booking insert")
        throw new Error("Booking was not created. Please try again.")
      }

      console.log("[v0] Booking successfully created in database:", data)

      return {
        id: data.id,
        carId: data.car_id,
        userId: data.user_id,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        customerPhone: data.customer_phone,
        pickupLocation: data.pickup_location,
        dropoffLocation: data.dropoff_location,
        pickupDate: data.pickup_date,
        dropoffDate: data.dropoff_date,
        pickupTime: data.pickup_time,
        dropoffTime: data.dropoff_time,
        totalAmount: Number(data.total_amount),
        status: data.status,
        bookingType: data.booking_type || "Rent",
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        pickupVerifiedAt: data.pickup_verified_at,
        verificationPhotos: data.verification_photos?.map((photo) => ({
          type: photo.type,
          url: photo.url,
          uploadedAt: photo.uploaded_at,
        })),
        verifiedBy: data.verified_by,
        stripeSessionId: data.stripe_session_id,
        stripePaymentIntentId: data.stripe_payment_intent_id,
        drivingLicenseNumber: data.driving_license_number,
        drivingLicenseFrontUrl: data.driving_license_front_url,
        drivingLicenseBackUrl: data.driving_license_back_url,
        proofOfAddressUrl: data.proof_of_address_url,
        documentsSubmittedAt: data.documents_submitted_at,
        niNumber: data.ni_number,
        bankStatementUrl: data.bank_statement_url,
        privateHireLicenseFrontUrl: data.private_hire_license_front_url,
        privateHireLicenseBackUrl: data.private_hire_license_back_url,
      }
    } catch (error) {
      console.error("[v0] Exception in createBooking:", error)
      if (error instanceof Error) {
        console.error("[v0] Error message:", error.message)
        console.error("[v0] Error stack:", error.stack)
        throw error
      }
      throw new Error("An unexpected error occurred while creating the booking.")
    }
  }

  async getBookings(userId?: string): Promise<Booking[]> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.getBookings: Supabase admin client is NULL")
      console.error("[v0] This means SUPABASE_SERVICE_ROLE_KEY environment variable is missing")
      console.error("[v0] The admin dashboard needs this key to fetch bookings from the database")
      // </CHANGE>
      return []
    }

    console.log("[v0] Fetching bookings from database...")

    let query = supabase.from("bookings").select("*").order("created_at", { ascending: false })

    if (userId) {
      // Filter by userId if provided
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching bookings:", error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      return []
    }

    console.log("[v0] Bookings fetched successfully. Count:", data?.length || 0)

    return (data || []).map((booking) => ({
      id: booking.id,
      carId: booking.car_id,
      userId: booking.user_id, // Added userId to return
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
      pickupLocation: booking.pickup_location,
      dropoffLocation: booking.dropoff_location,
      pickupDate: booking.pickup_date,
      dropoffDate: booking.dropoff_date,
      pickupTime: booking.pickup_time,
      dropoffTime: booking.dropoff_time,
      totalAmount: Number(booking.total_amount) || 0,
      status: booking.status || "Pending",
      bookingType: booking.booking_type || "Rent",
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      pickupVerifiedAt: booking.pickup_verified_at,
      verificationPhotos: booking.verification_photos?.map((photo) => ({
        type: photo.type,
        url: photo.url,
        uploadedAt: photo.uploaded_at,
      })),
      verifiedBy: booking.verifiedBy,
      stripeSessionId: booking.stripe_session_id,
      stripePaymentIntentId: booking.stripe_payment_intent_id,
      drivingLicenseNumber: booking.driving_license_number,
      drivingLicenseFrontUrl: booking.driving_license_front_url,
      drivingLicenseBackUrl: booking.driving_license_back_url,
      proofOfAddressUrl: booking.proof_of_address_url,
      documentsSubmittedAt: booking.documents_submitted_at,
      niNumber: booking.ni_number,
      bankStatementUrl: booking.bank_statement_url,
      privateHireLicenseFrontUrl: booking.private_hire_license_front_url,
      privateHireLicenseBackUrl: booking.private_hire_license_back_url,
    }))
  }

  async getAllBookings(): Promise<Booking[]> {
    return this.getBookings() // Call getBookings without userId to get all bookings
  }

  async updateBookingStatus(id: string, status: string): Promise<boolean> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.updateBookingStatus: Supabase admin not configured")
      return false
    }

    const { error } = await supabase
      .from("bookings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error updating booking status:", error)
      return false
    }

    return true
  }

  async updateBooking(
    bookingId: string,
    updates: Partial<{
      customerName: string
      lastName: string
      customerPhone: string
      drivingLicenseNumber: string
      drivingLicenseFrontUrl: string
      drivingLicenseBackUrl: string
      proofOfAddressUrl: string
      niNumber: string
      bankStatementUrl: string
      status: string
      pickupVerifiedAt: string
      verificationPhotos: Array<{ type: string; url: string }>
      documentsSubmittedAt: string
      verifiedBy: string
      privateHireLicenseFrontUrl: string
      privateHireLicenseBackUrl: string
    }>,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.updateBooking: Supabase admin not configured")
      return { success: false, error: "Database not configured" }
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName
    if (updates.customerPhone !== undefined) dbUpdates.customer_phone = updates.customerPhone
    if (updates.drivingLicenseNumber !== undefined) dbUpdates.driving_license_number = updates.drivingLicenseNumber
    if (updates.drivingLicenseFrontUrl !== undefined)
      dbUpdates.driving_license_front_url = updates.drivingLicenseFrontUrl
    if (updates.drivingLicenseBackUrl !== undefined) dbUpdates.driving_license_back_url = updates.drivingLicenseBackUrl
    if (updates.proofOfAddressUrl !== undefined) dbUpdates.proof_of_address_url = updates.proofOfAddressUrl
    if (updates.niNumber !== undefined) dbUpdates.ni_number = updates.niNumber
    if (updates.bankStatementUrl !== undefined) dbUpdates.bank_statement_url = updates.bankStatementUrl
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.pickupVerifiedAt !== undefined) dbUpdates.pickup_verified_at = updates.pickupVerifiedAt
    if (updates.verificationPhotos !== undefined) dbUpdates.verification_photos = updates.verificationPhotos
    if (updates.documentsSubmittedAt !== undefined) dbUpdates.documents_submitted_at = updates.documentsSubmittedAt
    if (updates.verifiedBy !== undefined) dbUpdates.verified_by = updates.verifiedBy
    if (updates.privateHireLicenseFrontUrl !== undefined)
      dbUpdates.private_hire_license_front_url = updates.privateHireLicenseFrontUrl
    if (updates.privateHireLicenseBackUrl !== undefined)
      dbUpdates.private_hire_license_back_url = updates.privateHireLicenseBackUrl

    const { error } = await supabase.from("bookings").update(dbUpdates).eq("id", bookingId)

    if (error) {
      console.error("[v0] Error updating booking:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  async deleteBooking(id: string): Promise<boolean> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.deleteBooking: Supabase admin not configured")
      return false
    }

    const { error } = await supabase.from("bookings").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting booking:", error)
      return false
    }

    return true
  }

  async getBookingByStripeSession(sessionId: string): Promise<Booking | null> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.getBookingByStripeSession: Supabase admin not configured")
      return null
    }

    const { data, error } = await supabase.from("bookings").select("*").eq("stripe_session_id", sessionId).single()

    if (error) {
      console.error("[v0] Error getting booking by stripe session:", error)
      return null
    }

    if (!data) {
      return null
    }

    return {
      id: data.id,
      carId: data.car_id,
      userId: data.user_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      pickupLocation: data.pickup_location,
      dropoffLocation: data.dropoff_location,
      pickupDate: data.pickup_date,
      dropoffDate: data.dropoff_date,
      pickupTime: data.pickup_time,
      dropoffTime: data.dropoff_time,
      totalAmount: Number(data.total_amount),
      status: data.status,
      bookingType: data.booking_type || "Rent",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      stripeSessionId: data.stripe_session_id,
      stripePaymentIntentId: data.stripe_payment_intent_id,
      drivingLicenseNumber: data.driving_license_number,
      drivingLicenseFrontUrl: data.driving_license_front_url,
      drivingLicenseBackUrl: data.driving_license_back_url,
      proofOfAddressUrl: data.proof_of_address_url,
      documentsSubmittedAt: data.documents_submitted_at,
      niNumber: data.ni_number,
      bankStatementUrl: data.bank_statement_url,
      privateHireLicenseFrontUrl: data.private_hire_license_front_url,
      privateHireLicenseBackUrl: data.private_hire_license_back_url,
    }
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.getBookingById: Supabase admin not configured")
      return null
    }

    const { data, error } = await supabase.from("bookings").select("*").eq("id", id).single()

    if (error) {
      console.error("[v0] Error getting booking by ID:", error)
      return null
    }

    if (!data) return null

    return {
      id: data.id,
      carId: data.car_id,
      userId: data.user_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      pickupLocation: data.pickup_location,
      dropoffLocation: data.dropoff_location,
      pickupDate: data.pickup_date,
      dropoffDate: data.dropoff_date,
      pickupTime: data.pickup_time,
      dropoffTime: data.dropoff_time,
      totalAmount: Number(data.total_amount) || 0,
      status: data.status || "Pending",
      bookingType: data.booking_type || "Rent",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      pickupVerifiedAt: data.pickup_verified_at,
      verificationPhotos: data.verification_photos?.map((photo) => ({
        type: photo.type,
        url: photo.url,
        uploadedAt: photo.uploaded_at,
      })),
      verifiedBy: data.verified_by,
      stripeSessionId: data.stripe_session_id,
      stripePaymentIntentId: data.stripe_payment_intent_id,
      drivingLicenseNumber: data.driving_license_number,
      drivingLicenseFrontUrl: data.driving_license_front_url,
      drivingLicenseBackUrl: data.driving_license_back_url,
      proofOfAddressUrl: data.proof_of_address_url,
      documentsSubmittedAt: data.documents_submitted_at,
      niNumber: data.ni_number,
      bankStatementUrl: data.bank_statement_url,
      privateHireLicenseFrontUrl: data.private_hire_license_front_url,
      privateHireLicenseBackUrl: data.private_hire_license_back_url,
    }
  }

  // Sales Requests operations
  async createSalesRequest(
    request: Omit<SalesRequest, "id" | "createdAt" | "updatedAt">,
  ): Promise<SalesRequest | null> {
    const supabase = await this.getSupabaseClient()

    if (!supabase) {
      console.error("[v0] Database.createSalesRequest: Supabase not configured")
      return null
    }

    const requestData = {
      id: `sales-request-${Date.now()}`,
      car_id: request.carId,
      customer_name: request.customerName,
      customer_email: request.customerEmail,
      customer_phone: request.customerPhone,
      preferred_date: request.preferredDate,
      message: request.message,
      status: request.status || "Pending",
    }

    const { data, error } = await supabase.from("sales_requests").insert(requestData).select().single()

    if (error) {
      console.error("[v0] Error creating sales request:", error)
      return null
    }

    return {
      id: data.id,
      carId: data.car_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      preferredDate: data.preferred_date,
      message: data.message,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  async getSalesRequests(): Promise<SalesRequest[]> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.log("[v0] Database.getSalesRequests: Supabase admin not configured, returning empty array")
      return []
    }

    console.log("[v0] Fetching sales requests from database...")

    const { data, error } = await supabase.from("sales_requests").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching sales requests:", error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      return []
    }

    console.log("[v0] Sales requests fetched successfully. Count:", data?.length || 0)

    return (data || []).map((request) => ({
      id: request.id,
      carId: request.car_id,
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      customerPhone: request.customer_phone,
      preferredDate: request.preferred_date,
      message: request.message,
      status: request.status || "Pending",
      createdAt: request.created_at,
      updatedAt: request.updated_at,
    }))
  }

  async updateSalesRequestStatus(id: string, status: string): Promise<boolean> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.updateSalesRequestStatus: Supabase admin not configured")
      return false
    }

    const { error } = await supabase
      .from("sales_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error updating sales request status:", error)
      return false
    }

    return true
  }

  async deleteSalesRequest(id: string): Promise<boolean> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.deleteSalesRequest: Supabase admin not configured")
      return false
    }

    const { error } = await supabase.from("sales_requests").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting sales request:", error)
      return false
    }

    return true
  }

  // User Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = await this.getSupabaseClient()

    if (!supabase) {
      console.error("[v0] Database.getUserProfile: Supabase not configured")
      return null
    }

    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("[v0] Error fetching user profile:", error)
      return null
    }

    return data
      ? {
        id: data.id,
        username: data.username,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        phone: data.phone,
        drivingLicenseNumber: data.driving_license_number,
        drivingLicenseFrontUrl: data.driving_license_front_url,
        drivingLicenseBackUrl: data.driving_license_back_url,
        proofOfAddressUrl: data.proof_of_address_url,
        niNumber: data.ni_number,
        bankStatementUrl: data.bank_statement_url,
        privateHireLicenseFrontUrl: data.private_hire_license_front_url,
        privateHireLicenseBackUrl: data.private_hire_license_back_url,
        documentsUpdatedAt: data.documents_updated_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
      : null
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await this.getAdminClient()

    if (!supabase) {
      console.error("[v0] Database.updateUserProfile: Supabase admin not configured")
      return { success: false, error: "Supabase admin not configured" }
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.username !== undefined) dbUpdates.username = updates.username
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.drivingLicenseNumber !== undefined) dbUpdates.driving_license_number = updates.drivingLicenseNumber
    if (updates.drivingLicenseFrontUrl !== undefined)
      dbUpdates.driving_license_front_url = updates.drivingLicenseFrontUrl
    if (updates.drivingLicenseBackUrl !== undefined) dbUpdates.driving_license_back_url = updates.drivingLicenseBackUrl
    if (updates.proofOfAddressUrl !== undefined) dbUpdates.proof_of_address_url = updates.proofOfAddressUrl
    if (updates.niNumber !== undefined) dbUpdates.ni_number = updates.niNumber
    if (updates.bankStatementUrl !== undefined) dbUpdates.bank_statement_url = updates.bankStatementUrl
    if (updates.privateHireLicenseFrontUrl !== undefined)
      dbUpdates.private_hire_license_front_url = updates.privateHireLicenseFrontUrl
    if (updates.privateHireLicenseBackUrl !== undefined)
      dbUpdates.private_hire_license_back_url = updates.privateHireLicenseBackUrl

    const { error } = await supabase.from("user_profiles").update(dbUpdates).eq("id", userId)

    if (error) {
      console.error("[v0] Error updating user profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  // Agreement methods
  async getAgreements(): Promise<Agreement[]> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase.from("agreements").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching agreements:", error)
      return []
    }

    return (data || []).map(this.mapAgreementFromDb)
  }

  async getAgreement(id: string): Promise<Agreement | null> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return null

    const { data, error } = await supabase.from("agreements").select("*").eq("id", id).single()

    if (error || !data) {
      console.error("[v0] Error fetching agreement:", error)
      return null
    }

    return this.mapAgreementFromDb(data)
  }

  async getAgreementByBookingId(bookingId: string): Promise<Agreement | null> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return null

    const { data, error } = await supabase.from("agreements").select("*").eq("booking_id", bookingId).single()

    if (error || !data) return null
    return this.mapAgreementFromDb(data)
  }

  async createAgreement(agreement: Omit<Agreement, "id" | "createdAt" | "updatedAt">): Promise<Agreement | null> {
    const supabase = await this.getAdminClient()
    if (!supabase) return null

    const insertData: any = {
      agreement_number: agreement.agreementNumber,
      booking_id: agreement.bookingId,
      customer_id: agreement.customerId || null,
      vehicle_id: agreement.vehicleId || null,
      status: agreement.status,
      agreement_type: agreement.agreementType,
      start_date: agreement.startDate,
      end_date: agreement.endDate,
      total_amount: agreement.totalAmount,
    }

    // Add optional fields only if they exist
    if (agreement.depositAmount !== undefined) insertData.deposit_amount = agreement.depositAmount
    if (agreement.unsignedAgreementUrl) insertData.unsigned_agreement_url = agreement.unsignedAgreementUrl
    if (agreement.signedAgreementUrl) insertData.signed_agreement_url = agreement.signedAgreementUrl
    if (agreement.customerSignatureData) insertData.customer_signature_data = agreement.customerSignatureData
    if (agreement.signedAt) insertData.signed_at = agreement.signedAt
    if (agreement.sentToCustomerAt) insertData.sent_to_customer_at = agreement.sentToCustomerAt
    // Only set created_by if it's a valid UUID, otherwise leave it null
    if (agreement.createdBy) {
      // Check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(agreement.createdBy)) {
        insertData.created_by = agreement.createdBy
      } else {
        console.log("[v0] createdBy is not a valid UUID, setting to null:", agreement.createdBy)
        // Don't set created_by if it's not a valid UUID
      }
    }
    if (agreement.mediaUrls) insertData.media_urls = agreement.mediaUrls
    if (agreement.fuelLevel) insertData.fuel_level = agreement.fuelLevel
    if (agreement.odometerReading !== undefined) insertData.odometer_reading = agreement.odometerReading

    console.log("[v0] Inserting agreement with data:", JSON.stringify(insertData, null, 2))

    const { data, error } = await supabase
      .from("agreements")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating agreement:", error)
      console.error("[v0] Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`Failed to create agreement: ${error.message}`)
    }

    if (!data) {
      console.error("[v0] No data returned from agreement creation")
      throw new Error("Failed to create agreement: No data returned")
    }

    return this.mapAgreementFromDb(data)
  }

  async updateAgreement(id: string, updates: Partial<Agreement> & { vehicle_photos?: string[] }): Promise<Agreement | null> {
    const supabase = await this.getAdminClient()
    if (!supabase) return null

    const updateData: any = { updated_at: new Date().toISOString() }

    if (updates.status) updateData.status = updates.status
    if (updates.signedAgreementUrl) updateData.signed_agreement_url = updates.signedAgreementUrl
    if (updates.customerSignatureData) updateData.customer_signature_data = updates.customerSignatureData
    if (updates.signedAt) updateData.signed_at = updates.signedAt
    if (updates.sentToCustomerAt) updateData.sent_to_customer_at = updates.sentToCustomerAt
    if (updates.mediaUrls) updateData.media_urls = updates.mediaUrls // Added media URLs update
    if (updates.fuelLevel) updateData.fuel_level = updates.fuelLevel // Added fuel level update
    if (updates.odometerReading !== undefined) updateData.odometer_reading = updates.odometerReading // Added odometer reading update
    if (updates.vehiclePhotos) updateData.vehicle_photos = updates.vehiclePhotos // Vehicle photos from handover
    if ((updates as any).vehicle_photos) updateData.vehicle_photos = (updates as any).vehicle_photos // Also handle snake_case

    const { data, error } = await supabase.from("agreements").update(updateData).eq("id", id).select().single()

    if (error || !data) {
      console.error("[v0] Error updating agreement:", error)
      return null
    }

    return this.mapAgreementFromDb(data)
  }

  async updateAgreementMedia(agreementId: string, mediaUrls: string[]) {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return false

    const { error } = await supabase
      .from("agreements")
      .update({ media_urls: mediaUrls, updated_at: new Date().toISOString() })
      .eq("id", agreementId)

    return !error
  }

  async updateAgreementVehicleData(agreementId: string, fuelLevel: string, odometerReading: number) {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return false

    const { error } = await supabase
      .from("agreements")
      .update({
        fuel_level: fuelLevel,
        odometer_reading: odometerReading,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agreementId)

    return !error
  }

  // Agreement methods from updates
  async getAgreementsByBooking(bookingId: string): Promise<Agreement[]> {
    const supabase = await this.getAdminClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from("agreements")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching agreements by booking:", error)
      return []
    }

    return (data || []).map(this.mapAgreementFromDb)
  }

  async getAllAgreements(): Promise<Agreement[]> {
    const supabase = await this.getAdminClient()
    if (!supabase) return []

    const { data, error } = await supabase.from("agreements").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching all agreements:", error)
      return []
    }

    return (data || []).map(this.mapAgreementFromDb)
  }

  async getAgreementById(agreementId: string): Promise<Agreement | null> {
    const supabase = await this.getAdminClient()
    if (!supabase) return null

    const { data, error } = await supabase.from("agreements").select("*").eq("id", agreementId).single()

    if (error || !data) {
      console.error("[v0] Error fetching agreement by ID:", error)
      return null
    }

    return this.mapAgreementFromDb(data)
  }

  async updateAgreementStatus(agreementId: string, status: string): Promise<boolean> {
    const supabase = await this.getAdminClient()
    if (!supabase) return false

    const { error } = await supabase
      .from("agreements")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", agreementId)

    if (error) {
      console.error("[v0] Error updating agreement status:", error)
      return false
    }

    return true
  }

  async updateAgreementSignature(agreementId: string, signatureUrl: string, customerName: string, signatureBase64?: string): Promise<boolean> {
    const supabase = await this.getAdminClient()
    if (!supabase) return false

    // First, get the current agreement to preserve admin signature
    const { data: currentAgreement } = await supabase
      .from("agreements")
      .select("customer_signature_data")
      .eq("id", agreementId)
      .single()

    // Preserve admin signature (stored in customer_signature_data when admin signed)
    const adminSignature = currentAgreement?.customer_signature_data
    const isAdminSignature = adminSignature && (adminSignature.startsWith("data:image") || adminSignature.includes("signatures/"))

    const updateData: any = {
      signed_at: new Date().toISOString(),
      status: "pending", // Will be updated to "signed" when PDF is generated
      updated_at: new Date().toISOString(),
      customer_name_signed: customerName, // Store the customer name who signed
    }

    // Store customer signature - ALWAYS prefer base64 if available (same as admin flow)
    // This avoids storage upload issues and works directly with PDF generation
    const customerSignatureToStore = signatureBase64 || signatureUrl

    // Store signatures - preserve admin signature if it exists
    if (isAdminSignature) {
      // Admin signature exists - store both in JSON structure
      updateData.customer_signature_data = JSON.stringify({
        admin_signature: adminSignature,
        customer_signature: customerSignatureToStore // Store base64 (preferred) or URL
      })
    } else {
      // No admin signature - store customer signature directly as base64 (preferred) or URL
      updateData.customer_signature_data = customerSignatureToStore
    }

    // Only store URL in signed_agreement_url if it's a real URL (not placeholder)
    if (signatureUrl && signatureUrl !== "base64-signature-stored" && signatureUrl.startsWith("http")) {
      updateData.signed_agreement_url = signatureUrl
    }

    console.log("[Database] Storing customer signature:", {
      hasBase64: !!signatureBase64,
      hasUrl: !!signatureUrl,
      isAdminSignature: isAdminSignature,
      customerSignatureType: customerSignatureToStore?.startsWith('data:image') ? 'base64' : 'URL',
      customerSignatureLength: customerSignatureToStore?.length || 0,
      storingAsBase64: !!signatureBase64
    })

    const { error, data } = await supabase
      .from("agreements")
      .update(updateData)
      .eq("id", agreementId)
      .select()

    if (error) {
      console.error("[Database] Error updating agreement signature:", error)
      console.error("[Database] Update data:", JSON.stringify(updateData, null, 2))
      return false
    }

    console.log("[Database] Agreement signature updated successfully:", data?.[0]?.id)
    return true
  }

  async getAgreementsByVehicle(vehicleId: string): Promise<Agreement[]> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from("agreements")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching agreements by vehicle:", error)
      return []
    }

    return (data || []).map(this.mapAgreementFromDb)
  }

  // VehicleInspection methods
  async createVehicleInspection(
    inspection: Omit<VehicleInspection, "id" | "createdAt" | "updatedAt">,
  ): Promise<VehicleInspection | null> {
    const supabase = await this.getAdminClient()
    if (!supabase) {
      console.error("[v0] No admin client available for creating inspection")
      return null
    }

    console.log("[v0] Creating inspection:", {
      agreement_id: inspection.agreementId,
      booking_id: inspection.bookingId,
      vehicle_id: inspection.vehicleId,
      inspection_type: inspection.inspectionType,
      odometer_reading: inspection.odometerReading,
      fuel_level: inspection.fuelLevel,
      exterior_photos_count: inspection.exteriorPhotos?.length || 0,
      interior_photos_count: inspection.interiorPhotos?.length || 0,
      damage_photos_count: inspection.damagePhotos?.length || 0,
    })

    // Prepare insert data
    const insertData: any = {
      agreement_id: inspection.agreementId,
      booking_id: inspection.bookingId,
      vehicle_id: inspection.vehicleId,
      inspection_type: inspection.inspectionType,
      odometer_reading: inspection.odometerReading,
      fuel_level: inspection.fuelLevel,
      exterior_photos: inspection.exteriorPhotos || [],
      interior_photos: inspection.interiorPhotos || [],
      damage_photos: inspection.damagePhotos || [],
      video_urls: inspection.videoUrls || [],
      damage_notes: inspection.damageNotes || null,
      overall_condition: inspection.overallCondition,
      inspected_at: inspection.inspectedAt,
    }

    // Only include inspected_by if it's a valid UUID string
    if (inspection.inspectedBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspection.inspectedBy)) {
      insertData.inspected_by = inspection.inspectedBy
    } else {
      insertData.inspected_by = null
    }

    console.log("[v0] Inserting inspection with data:", {
      ...insertData,
      exterior_photos: `[${insertData.exterior_photos.length} photos]`,
      interior_photos: `[${insertData.interior_photos.length} photos]`,
      damage_photos: `[${insertData.damage_photos.length} photos]`,
    })

    const { data, error } = await supabase
      .from("vehicle_inspections")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating inspection:", error)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error details:", error.details)
      console.error("[v0] Error hint:", error.hint)
      throw new Error(`Failed to create inspection: ${error.message}${error.details ? ` (${error.details})` : ""}${error.hint ? ` Hint: ${error.hint}` : ""}`)
    }

    if (!data) {
      console.error("[v0] No data returned from inspection creation")
      throw new Error("Failed to create inspection: No data returned from database")
    }

    console.log("[v0] Inspection created successfully:", data.id)
    return this.mapInspectionFromDb(data)
  }

  async getInspectionsByAgreementId(agreementId: string): Promise<VehicleInspection[]> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from("vehicle_inspections")
      .select("*")
      .eq("agreement_id", agreementId)
      .order("inspected_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching inspections:", error)
      return []
    }

    return (data || []).map(this.mapInspectionFromDb)
  }

  async getInspectionsByVehicleId(vehicleId: string): Promise<VehicleInspection[]> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from("vehicle_inspections")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("inspected_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching inspections by vehicle:", error)
      return []
    }

    return (data || []).map(this.mapInspectionFromDb)
  }

  async getInspectionsByBooking(bookingId: string): Promise<VehicleInspection[]> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from("vehicle_inspections")
      .select("*")
      .eq("booking_id", bookingId)
      .order("inspected_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching inspections by booking:", error)
      return []
    }

    return (data || []).map(this.mapInspectionFromDb)
  }

  async getInspectionsByAgreement(agreementId: string): Promise<VehicleInspection[]> {
    return this.getInspectionsByAgreementId(agreementId)
  }

  async getInspectionById(inspectionId: string): Promise<VehicleInspection | null> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return null

    const { data, error } = await supabase
      .from("vehicle_inspections")
      .select("*")
      .eq("id", inspectionId)
      .single()

    if (error || !data) {
      console.error("[v0] Error fetching inspection by ID:", error)
      return null
    }

    return this.mapInspectionFromDb(data)
  }

  // PCNTicket methods
  async createPCNTicket(ticket: Omit<PCNTicket, "id" | "createdAt" | "updatedAt">): Promise<PCNTicket | null> {
    const supabase = await this.getAdminClient()
    if (!supabase) {
      console.error("[v0] No admin client available for creating PCN ticket")
      throw new Error("No admin client available")
    }

    console.log("[v0] Creating PCN ticket:", {
      agreement_id: ticket.agreementId,
      booking_id: ticket.bookingId,
      ticket_type: ticket.ticketType,
      amount: ticket.amount,
    })

    // Format dates properly - ensure issue_date is in YYYY-MM-DD format
    let issueDate = ticket.issueDate
    if (issueDate && issueDate.includes("T")) {
      // If it's a datetime string, extract just the date part
      issueDate = issueDate.split("T")[0]
    }

    let dueDate = ticket.dueDate
    if (dueDate && dueDate.includes("T")) {
      dueDate = dueDate.split("T")[0]
    }

    const insertData: any = {
      agreement_id: ticket.agreementId,
      booking_id: ticket.bookingId,
      ticket_type: ticket.ticketType,
      issue_date: issueDate,
      amount: ticket.amount,
      status: ticket.status || "pending",
      ticket_document_url: ticket.ticketDocumentUrl,
    }

    // Only include optional fields if they have values
    if (ticket.customerId) insertData.customer_id = ticket.customerId
    if (ticket.vehicleId) insertData.vehicle_id = ticket.vehicleId
    if (ticket.ticketNumber) insertData.ticket_number = ticket.ticketNumber
    if (dueDate) insertData.due_date = dueDate
    if (ticket.notes) insertData.notes = ticket.notes
    if (ticket.uploadedBy) insertData.uploaded_by = ticket.uploadedBy

    const { data, error } = await supabase
      .from("pcn_tickets")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating PCN ticket:", error)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error details:", error.details)
      throw new Error(`Failed to create PCN ticket: ${error.message}${error.details ? ` (${error.details})` : ""}`)
    }

    if (!data) {
      console.error("[v0] No data returned from PCN ticket creation")
      throw new Error("Failed to create PCN ticket: No data returned from database")
    }

    console.log("[v0] PCN ticket created successfully:", data.id)
    return this.mapPCNFromDb(data)
  }

  // Get all PCN tickets (no pagination - like deposits page)
  async getAllPCNTickets(filters?: { status?: string; searchTerm?: string }): Promise<PCNTicket[]> {
    const supabase = await this.getAdminClient()
    if (!supabase) {
      console.error("[Database] No admin client available for fetching PCN tickets")
      return []
    }

    let query = supabase
      .from("pcn_tickets")
      .select("id, agreement_id, booking_id, customer_id, vehicle_id, ticket_type, ticket_number, issue_date, due_date, amount, status, paid_by, paid_at, ticket_document_url, proof_of_payment_url, sent_to_customer_at, customer_notified, notes, created_at, updated_at, uploaded_by")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    // Apply search
    if (filters?.searchTerm) {
      query = query.or(`ticket_number.ilike.%${filters.searchTerm}%,notes.ilike.%${filters.searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Database] Error fetching all PCN tickets:", error)
      return []
    }

    console.log(`[Database] Found ${data?.length || 0} PCN tickets`)
    return (data || []).map((ticket) => {
      try {
        return this.mapPCNFromDb(ticket)
      } catch (err) {
        console.error("[Database] Error mapping PCN ticket:", err, ticket)
        return null
      }
    }).filter((ticket): ticket is PCNTicket => ticket !== null)
  }

  async getPCNsByAgreementId(agreementId: string, limit?: number): Promise<PCNTicket[]> {
    const supabase = await this.getAdminClient()
    if (!supabase) {
      console.error("[Database] No admin client available for fetching PCN tickets")
      return []
    }

    if (!agreementId) {
      console.warn("[Database] No agreement ID provided to getPCNsByAgreementId")
      return []
    }

    console.log("[Database] Fetching PCN tickets for agreement:", agreementId, limit ? `(limit: ${limit})` : "")

    let query = supabase
      .from("pcn_tickets")
      .select("*")
      .eq("agreement_id", agreementId)
      .order("created_at", { ascending: false })

    // Apply limit if provided
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Database] Error fetching PCN tickets:", error)
      console.error("[Database] Error code:", error.code)
      console.error("[Database] Error message:", error.message)
      console.error("[Database] Error details:", error.details)
      console.error("[Database] Error hint:", error.hint)
      return []
    }

    console.log(`[Database] Found ${data?.length || 0} PCN tickets for agreement ${agreementId}`)
    return (data || []).map((ticket) => {
      try {
        return this.mapPCNFromDb(ticket)
      } catch (err) {
        console.error("[Database] Error mapping PCN ticket:", err, ticket)
        return null
      }
    }).filter((ticket): ticket is PCNTicket => ticket !== null)
  }

  // Cursor pagination helper: encode cursor from ticket
  private encodeCursor(createdAt: string, id: string): string {
    return Buffer.from(`${createdAt}|${id}`).toString("base64")
  }

  // Cursor pagination helper: decode cursor to createdAt and id
  private decodeCursor(cursor: string): { createdAt: string; id: string } | null {
    try {
      const decoded = Buffer.from(cursor, "base64").toString("utf-8")
      const [createdAt, id] = decoded.split("|")
      if (!createdAt || !id) return null
      return { createdAt, id }
    } catch {
      return null
    }
  }

  // Get all PCN tickets with cursor pagination (for list view)
  async getAllPCNTicketsPaginated(
    limit: number = 5,
    cursor?: string,
    filters?: { status?: string; searchTerm?: string }
  ): Promise<{ items: PCNTicket[]; nextCursor: string | null; hasMore: boolean }> {
    const supabase = await this.getAdminClient()
    if (!supabase) {
      console.error("[Database] No admin client available for fetching PCN tickets")
      return { items: [], nextCursor: null, hasMore: false }
    }

    // Clamp limit between 1 and 50
    const clampedLimit = Math.min(Math.max(limit, 1), 50)
    // Fetch one extra to check if there's more
    const fetchLimit = clampedLimit + 1

    let query = supabase
      .from("pcn_tickets")
      .select("id, agreement_id, booking_id, customer_id, vehicle_id, ticket_type, ticket_number, issue_date, due_date, amount, status, paid_by, paid_at, ticket_document_url, proof_of_payment_url, sent_to_customer_at, customer_notified, notes, created_at, updated_at, uploaded_by")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })

    // Apply cursor if provided
    if (cursor) {
      const decoded = this.decodeCursor(cursor)
      if (decoded) {
        // For cursor pagination with DESC order:
        // We want tickets where created_at < cursor.createdAt OR (created_at = cursor.createdAt AND id < cursor.id)
        // Since Supabase doesn't support complex OR easily, we use:
        // created_at <= cursor.createdAt AND (created_at < cursor.createdAt OR id < cursor.id)
        // But simpler: created_at < cursor.createdAt OR (created_at = cursor.createdAt AND id < cursor.id)
        // Actually, we can use: created_at.lte.${decoded.createdAt} and then filter in memory for exact matches
        // Or better: use two queries or use a simpler approach
        // For now, use: created_at <= decoded.createdAt, then filter
        query = query.lte("created_at", decoded.createdAt)
        // We'll need to filter further in code for exact created_at matches
      }
    }

    // Apply filters
    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    // Apply search (if needed, search in ticket_number or notes)
    if (filters?.searchTerm) {
      query = query.or(`ticket_number.ilike.%${filters.searchTerm}%,notes.ilike.%${filters.searchTerm}%`)
    }

    // Fetch limit + 1 to check if there's more
    const { data, error } = await query.limit(fetchLimit)

    if (error) {
      console.error("[Database] Error fetching paginated PCN tickets:", error)
      return { items: [], nextCursor: null, hasMore: false }
    }

    let allItems = data || []

    // If cursor exists, filter out items that should be before the cursor
    if (cursor) {
      const decoded = this.decodeCursor(cursor)
      if (decoded) {
        allItems = allItems.filter((item) => {
          const itemCreatedAt = item.created_at
          const itemId = item.id
          // Keep items where: created_at < cursor.createdAt OR (created_at = cursor.createdAt AND id < cursor.id)
          if (itemCreatedAt < decoded.createdAt) {
            return true
          }
          if (itemCreatedAt === decoded.createdAt && itemId < decoded.id) {
            return true
          }
          return false
        })
      }
    }

    // Sort to ensure correct order (created_at DESC, id DESC)
    allItems.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      if (dateB !== dateA) {
        return dateB - dateA // DESC
      }
      return b.id.localeCompare(a.id) // DESC by id
    })

    const hasMore = allItems.length > clampedLimit
    const items = hasMore ? allItems.slice(0, clampedLimit) : allItems

    // Map to PCNTicket objects
    const mappedItems = items
      .map((ticket) => {
        try {
          return this.mapPCNFromDb(ticket)
        } catch (err) {
          console.error("[Database] Error mapping PCN ticket:", err, ticket)
          return null
        }
      })
      .filter((ticket): ticket is PCNTicket => ticket !== null)

    // Generate next cursor from last item
    let nextCursor: string | null = null
    if (hasMore && mappedItems.length > 0) {
      const lastItem = mappedItems[mappedItems.length - 1]
      nextCursor = this.encodeCursor(lastItem.createdAt, lastItem.id)
    }

    console.log(
      `[Database] Paginated PCN tickets: fetched ${mappedItems.length}, hasMore: ${hasMore}, nextCursor: ${nextCursor ? "yes" : "no"}`
    )

    return {
      items: mappedItems,
      nextCursor,
      hasMore,
    }
  }

  // Batch method to get tickets for multiple agreements (performance optimization)
  async getPCNsByAgreementIds(agreementIds: string[]): Promise<Record<string, PCNTicket[]>> {
    const supabase = await this.getAdminClient()
    if (!supabase) {
      console.error("[Database] No admin client available for fetching PCN tickets")
      return {}
    }

    if (!agreementIds || agreementIds.length === 0) {
      return {}
    }

    console.log(`[Database] Batch fetching PCN tickets for ${agreementIds.length} agreements`)

    const { data, error } = await supabase
      .from("pcn_tickets")
      .select("*")
      .in("agreement_id", agreementIds)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Database] Error batch fetching PCN tickets:", error)
      return {}
    }

    // Group tickets by agreement_id
    const ticketsByAgreement: Record<string, PCNTicket[]> = {}
    agreementIds.forEach((id) => {
      ticketsByAgreement[id] = []
    })

      ; (data || []).forEach((ticket) => {
        try {
          const mapped = this.mapPCNFromDb(ticket)
          const agreementId = ticket.agreement_id
          if (!ticketsByAgreement[agreementId]) {
            ticketsByAgreement[agreementId] = []
          }
          ticketsByAgreement[agreementId].push(mapped)
        } catch (err) {
          console.error("[Database] Error mapping PCN ticket:", err, ticket)
        }
      })

    console.log(`[Database] Batch found ${data?.length || 0} PCN tickets across ${agreementIds.length} agreements`)
    return ticketsByAgreement
  }

  async updatePCNTicket(id: string, updates: Partial<PCNTicket>): Promise<PCNTicket | null> {
    const supabase = await this.getAdminClient()
    if (!supabase) return null

    const updateData: any = { updated_at: new Date().toISOString() }

    if (updates.status) updateData.status = updates.status
    if (updates.paidBy) updateData.paid_by = updates.paidBy
    if (updates.paidAt) updateData.paid_at = updates.paidAt
    if (updates.proofOfPaymentUrl) updateData.proof_of_payment_url = updates.proofOfPaymentUrl
    if (updates.sentToCustomerAt) updateData.sent_to_customer_at = updates.sentToCustomerAt
    if (updates.customerNotified !== undefined) updateData.customer_notified = updates.customerNotified

    const { data, error } = await supabase.from("pcn_tickets").update(updateData).eq("id", id).select().single()

    if (error || !data) {
      console.error("[v0] Error updating PCN ticket:", error)
      return null
    }

    return this.mapPCNFromDb(data)
  }

  // DamageReport methods
  async createDamageReport(report: Omit<DamageReport, "id" | "createdAt" | "updatedAt">): Promise<DamageReport | null> {
    const supabase = await this.getAdminClient()
    if (!supabase) {
      console.error("[v0] No admin client available for creating damage report")
      throw new Error("No admin client available")
    }

    console.log("[v0] Creating damage report:", {
      vehicle_id: report.vehicleId,
      damage_type: report.damageType,
      severity: report.severity,
      description: report.description?.substring(0, 50),
      photos_count: report.damagePhotos?.length || 0,
    })

    const insertData: any = {
      vehicle_id: report.vehicleId,
      damage_type: report.damageType,
      severity: report.severity,
      description: report.description,
      incident_date: report.incidentDate,
      reported_date: report.reportedDate,
      damage_photos: report.damagePhotos || [],
      damage_videos: report.damageVideos || [],
      repair_status: report.repairStatus || "pending",
    }

    // Only include optional fields if they have values
    if (report.agreementId) insertData.agreement_id = report.agreementId
    if (report.bookingId) insertData.booking_id = report.bookingId
    if (report.customerId) insertData.customer_id = report.customerId
    if (report.locationOnVehicle) insertData.location_on_vehicle = report.locationOnVehicle
    if (report.estimatedCost !== undefined) insertData.estimated_cost = report.estimatedCost
    if (report.responsibleParty) insertData.responsible_party = report.responsibleParty
    if (report.notes) insertData.notes = report.notes
    if (report.reportedBy) insertData.reported_by = report.reportedBy

    const { data, error } = await supabase
      .from("damage_reports")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating damage report:", error)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error details:", error.details)
      console.error("[v0] Error hint:", error.hint)
      throw new Error(`Failed to create damage report: ${error.message}${error.details ? ` (${error.details})` : ""}${error.hint ? ` Hint: ${error.hint}` : ""}`)
    }

    if (!data) {
      console.error("[v0] No data returned from damage report creation")
      throw new Error("Failed to create damage report: No data returned from database")
    }

    console.log("[v0] Damage report created successfully:", data.id)
    return this.mapDamageReportFromDb(data)
  }

  async getDamageReportsByVehicleId(vehicleId: string): Promise<DamageReport[]> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from("damage_reports")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("incident_date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching damage reports:", error)
      return []
    }

    return (data || []).map(this.mapDamageReportFromDb)
  }

  // Vendor methods
  async getVendors(): Promise<Vendor[]> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase.from("vendors").select("*").order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching vendors:", error)
      return []
    }

    return (data || []).map(this.mapVendorFromDb)
  }

  async createVendor(vendor: Omit<Vendor, "id" | "createdAt" | "updatedAt">): Promise<Vendor | null> {
    const supabase = await this.getAdminClient()
    if (!supabase) {
      console.error("[v0] No admin client available for creating vendor")
      throw new Error("No admin client available")
    }

    console.log("[v0] Creating vendor:", {
      name: vendor.name,
      vendor_type: vendor.vendorType,
      email: vendor.email,
    })

    const insertData: any = {
      name: vendor.name,
      vendor_type: vendor.vendorType,
      is_active: vendor.isActive !== undefined ? vendor.isActive : true,
    }

    // Only include optional fields if they have values
    if (vendor.contactPerson) insertData.contact_person = vendor.contactPerson
    if (vendor.email) insertData.email = vendor.email
    if (vendor.phone) insertData.phone = vendor.phone
    if (vendor.address) insertData.address = vendor.address
    if (vendor.rating !== undefined) insertData.rating = vendor.rating
    if (vendor.notes) insertData.notes = vendor.notes

    const { data, error } = await supabase
      .from("vendors")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating vendor:", error)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error details:", error.details)
      throw new Error(`Failed to create vendor: ${error.message}${error.details ? ` (${error.details})` : ""}`)
    }

    if (!data) {
      console.error("[v0] No data returned from vendor creation")
      throw new Error("Failed to create vendor: No data returned from database")
    }

    console.log("[v0] Vendor created successfully:", data.id)
    return this.mapVendorFromDb(data)
  }

  // Deposit methods
  async getDepositsByAgreementId(agreementId: string): Promise<Deposit[]> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase.from("deposits").select("*").eq("agreement_id", agreementId)

    if (error) {
      console.error("[v0] Error fetching deposits:", error)
      return []
    }

    return (data || []).map(this.mapDepositFromDb)
  }

  async createDeposit(deposit: Omit<Deposit, "id" | "createdAt" | "updatedAt">): Promise<Deposit | null> {
    const supabase = await this.getAdminClient()
    if (!supabase) return null

    const { data, error } = await supabase
      .from("deposits")
      .insert({
        agreement_id: deposit.agreementId,
        booking_id: deposit.bookingId,
        customer_id: deposit.customerId,
        amount: deposit.amount,
        payment_method: deposit.paymentMethod,
        transaction_id: deposit.transactionId,
        status: deposit.status,
        notes: deposit.notes,
        processed_by: deposit.processedBy,
      })
      .select()
      .single()

    if (error || !data) {
      console.error("[v0] Error creating deposit:", error)
      return null
    }

    return this.mapDepositFromDb(data)
  }

  private mapAgreementFromDb(data: any): Agreement {
    return {
      id: data.id,
      agreementNumber: data.agreement_number,
      bookingId: data.booking_id,
      customerId: data.customer_id,
      vehicleId: data.vehicle_id,
      status: data.status,
      agreementType: data.agreement_type,
      startDate: data.start_date,
      endDate: data.end_date,
      totalAmount: Number(data.total_amount),
      depositAmount: data.deposit_amount ? Number(data.deposit_amount) : undefined,
      unsignedAgreementUrl: data.unsigned_agreement_url,
      signedAgreementUrl: data.signed_agreement_url,
      customerSignatureData: data.customer_signature_data,
      signedAt: data.signed_at,
      sentToCustomerAt: data.sent_to_customer_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      mediaUrls: data.media_urls, // Map media URLs
      fuelLevel: data.fuel_level, // Map fuel level
      odometerReading: data.odometer_reading, // Map odometer reading
      vehiclePhotos: data.vehicle_photos, // Map vehicle photos (car condition at handover)
    }
  }

  private mapInspectionFromDb(data: any): VehicleInspection {
    return {
      id: data.id,
      agreementId: data.agreement_id,
      bookingId: data.booking_id,
      vehicleId: data.vehicle_id,
      inspectionType: data.inspection_type,
      odometerReading: data.odometer_reading,
      fuelLevel: data.fuel_level,
      exteriorPhotos: data.exterior_photos || [],
      interiorPhotos: data.interior_photos || [],
      damagePhotos: data.damage_photos || [],
      videoUrls: data.video_urls || [],
      damageNotes: data.damage_notes,
      overallCondition: data.overall_condition,
      inspectedBy: data.inspected_by,
      inspectedAt: data.inspected_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  private mapPCNFromDb(data: any): PCNTicket {
    if (!data) {
      console.error("[Database] mapPCNFromDb called with null/undefined data")
      throw new Error("Cannot map null PCN ticket data")
    }

    // Format dates - ensure they're strings
    const formatDate = (date: any): string => {
      if (!date) return ""
      if (typeof date === "string") return date
      if (date instanceof Date) return date.toISOString().split("T")[0]
      return String(date)
    }

    return {
      id: data.id || "",
      agreementId: data.agreement_id || "",
      bookingId: data.booking_id || "",
      customerId: data.customer_id || undefined,
      vehicleId: data.vehicle_id || undefined,
      ticketType: data.ticket_type || "other",
      ticketNumber: data.ticket_number || undefined,
      issueDate: formatDate(data.issue_date),
      dueDate: data.due_date ? formatDate(data.due_date) : undefined,
      amount: Number(data.amount) || 0,
      status: data.status || "pending",
      paidBy: data.paid_by || undefined,
      paidAt: data.paid_at || undefined,
      ticketDocumentUrl: data.ticket_document_url || "",
      proofOfPaymentUrl: data.proof_of_payment_url || undefined,
      sentToCustomerAt: data.sent_to_customer_at || undefined,
      customerNotified: Boolean(data.customer_notified),
      notes: data.notes || undefined,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
      uploadedBy: data.uploaded_by || undefined,
    }
  }

  private mapPCNWithDetailsFromDb(data: any): PCNTicketWithDetails {
    const ticket = this.mapPCNFromDb(data)
    return {
      ...ticket,
      customerName: data.user_profiles?.full_name,
      customerEmail: data.user_profiles?.email,
      carName: data.cars?.name,
      registrationNumber: data.cars?.registration_number,
      agreementNumber: data.agreements?.agreement_number,
    }
  }

  async getPCNTicketsWithDetails(filters?: { status?: string; searchTerm?: string }): Promise<PCNTicketWithDetails[]> {
    const supabase = await this.getAdminClient()
    if (!supabase) return []

    let query = supabase
      .from("pcn_tickets")
      .select(`
        *,
        cars (name, registration_number),
        user_profiles (full_name, email),
        agreements (agreement_number)
      `)
      .order("created_at", { ascending: false })

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.searchTerm) {
      query = query.or(`ticket_number.ilike.%${filters.searchTerm}%,notes.ilike.%${filters.searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Database] Error fetching PCN tickets with details:", error)
      return []
    }

    return (data || []).map((t: any) => this.mapPCNWithDetailsFromDb(t))
  }


  private mapDamageReportFromDb(data: any): DamageReport {
    return {
      id: data.id,
      agreementId: data.agreement_id,
      bookingId: data.booking_id,
      vehicleId: data.vehicle_id,
      customerId: data.customer_id,
      damageType: data.damage_type,
      severity: data.severity,
      description: data.description,
      locationOnVehicle: data.location_on_vehicle,
      incidentDate: data.incident_date,
      reportedDate: data.reported_date,
      damagePhotos: data.damage_photos || [],
      damageVideos: data.damage_videos || [],
      estimatedCost: data.estimated_cost ? Number(data.estimated_cost) : undefined,
      actualCost: data.actual_cost ? Number(data.actual_cost) : undefined,
      repairStatus: data.repair_status,
      repairedBy: data.repaired_by,
      repairedAt: data.repaired_at,
      responsibleParty: data.responsible_party,
      insuranceClaimNumber: data.insurance_claim_number,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      reportedBy: data.reported_by,
    }
  }

  private mapVendorFromDb(data: any): Vendor {
    return {
      id: data.id,
      name: data.name,
      vendorType: data.vendor_type,
      contactPerson: data.contact_person,
      email: data.email,
      phone: data.phone,
      address: data.address,
      rating: data.rating ? Number(data.rating) : undefined,
      notes: data.notes,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  private mapDepositFromDb(data: any): Deposit {
    return {
      id: data.id,
      agreementId: data.agreement_id,
      bookingId: data.booking_id,
      customerId: data.customer_id,
      amount: Number(data.amount),
      paymentMethod: data.payment_method,
      transactionId: data.transaction_id,
      status: data.status,
      refundAmount: data.refund_amount ? Number(data.refund_amount) : undefined,
      deductionAmount: data.deduction_amount ? Number(data.deduction_amount) : undefined,
      deductionReason: data.deduction_reason,
      refundedAt: data.refunded_at,
      refundTransactionId: data.refund_transaction_id,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      processedBy: data.processed_by,
    }
  }
}

export const db = new Database()
