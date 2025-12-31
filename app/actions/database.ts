"use server"

import { db } from "@/lib/database"
import { createClient } from "@/lib/supabase/server" // Import createClient to get current user
import type { Car, Story, Booking, SalesRequest } from "@/lib/database"

export type { Car, Story, Booking, SalesRequest }

// Car actions
export async function getCarsAction() {
  try {
    return await db.getCars()
  } catch (error) {
    console.error("[v0] Error in getCarsAction:", error)
    return []
  }
}

export async function getCarAction(id: string) {
  try {
    return await db.getCar(id)
  } catch (error) {
    console.error("[v0] Error in getCarAction:", error)
    return null
  }
}

export async function addCarAction(car: Omit<Car, "id">) {
  try {
    console.log("[v0] addCarAction called with:", car)
    const result = await db.addCar(car)
    console.log("[v0] addCarAction result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in addCarAction:", error)
    throw error
  }
}

export async function updateCarAction(id: string, updates: Partial<Car>) {
  try {
    console.log("[v0] updateCarAction called with id:", id, "updates:", updates)
    const result = await db.updateCar(id, updates)
    console.log("[v0] updateCarAction result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in updateCarAction:", error)
    throw error
  }
}

export async function deleteCarAction(id: string) {
  try {
    console.log("[v0] deleteCarAction called with id:", id)
    const result = await db.deleteCar(id)
    console.log("[v0] deleteCarAction result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in deleteCarAction:", error)
    return false
  }
}

// Car images actions
export async function saveCarImagesAction(carId: string, imageUrls: string[]) {
  try {
    console.log("[v0] saveCarImagesAction called with carId:", carId, "imageUrls count:", imageUrls.length)

    const supabase = await createClient()
    if (!supabase) {
      console.error("[v0] saveCarImagesAction: Supabase not configured")
      return { success: false, error: "Database not configured" }
    }

    // First, delete existing images for this car
    const { error: deleteError } = await supabase.from("car_images").delete().eq("car_id", carId)

    if (deleteError) {
      console.error("[v0] Error deleting existing images:", deleteError)
      // Continue anyway, might not have existing images
    }

    // Insert new images
    if (imageUrls.length > 0) {
      const imagesToInsert = imageUrls.map((url, index) => ({
        car_id: carId,
        image_url: url,
        display_order: index,
        is_primary: index === 0,
      }))

      console.log("[v0] Inserting images:", imagesToInsert)

      const { data, error: insertError } = await supabase.from("car_images").insert(imagesToInsert).select()

      if (insertError) {
        console.error("[v0] Error inserting images:", insertError)
        return { success: false, error: insertError.message }
      }

      console.log("[v0] Images saved successfully:", data)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Exception in saveCarImagesAction:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getCarImagesAction(carId: string) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return []
    }

    const { data, error } = await supabase
      .from("car_images")
      .select("*")
      .eq("car_id", carId)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching car images:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[v0] Exception in getCarImagesAction:", error)
    return []
  }
}

// Story actions
export async function getStoriesAction() {
  try {
    return await db.getStories()
  } catch (error) {
    console.error("[v0] Error in getStoriesAction:", error)
    return []
  }
}

export async function getStoryAction(id: string) {
  try {
    return await db.getStory(id)
  } catch (error) {
    console.error("[v0] Error in getStoryAction:", error)
    return null
  }
}

export async function addStoryAction(story: Omit<Story, "id">) {
  try {
    console.log("[v0] addStoryAction called with:", story)
    const result = await db.addStory(story)
    console.log("[v0] addStoryAction result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in addStoryAction:", error)
    throw error
  }
}

export async function updateStoryAction(id: string, updates: Partial<Story>) {
  try {
    console.log("[v0] updateStoryAction called with id:", id, "updates:", updates)
    const result = await db.updateStory(id, updates)
    console.log("[v0] updateStoryAction result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in updateStoryAction:", error)
    throw error
  }
}

export async function deleteStoryAction(id: string) {
  try {
    console.log("[v0] deleteStoryAction called with id:", id)
    const result = await db.deleteStory(id)
    console.log("[v0] deleteStoryAction result:", result)

    if (!result) {
      throw new Error("Database returned false for story deletion")
    }

    return result
  } catch (error) {
    console.error("[v0] Error in deleteStoryAction:", error)
    throw error
  }
}

// Booking actions
export async function createBookingAction(booking: Omit<Booking, "id" | "createdAt" | "updatedAt">) {
  try {
    console.log("[v0] createBookingAction called with:", booking)

    if (!booking.carId) {
      console.error("[v0] Missing carId in booking")
      throw new Error("Car information is missing. Please try again.")
    }
    if (!booking.pickupDate || !booking.dropoffDate) {
      console.error("[v0] Missing rental dates")
      throw new Error("Rental dates are required. Please select your dates.")
    }
    if (!booking.pickupLocation || !booking.dropoffLocation) {
      console.error("[v0] Missing locations")
      throw new Error("Pickup and dropoff locations are required.")
    }

    const supabase = await createClient()
    let userId = booking.userId

    if (supabase && !userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        console.log("[v0] Found logged in user:", user.id)
      } else {
        console.log("[v0] No user logged in, creating guest booking")
      }
    }

    const result = await db.createBooking({
      ...booking,
      userId,
    })

    if (!result) {
      console.error("[v0] db.createBooking returned null")
      throw new Error("Unable to create booking. Please contact support.")
    }

    console.log("[v0] createBookingAction result:", result)
    return result
  } catch (error) {
    console.error("[v0] Exception in createBookingAction:", error)
    if (error instanceof Error) {
      console.error("[v0] Error name:", error.name)
      console.error("[v0] Error message:", error.message)
      throw error
    }
    throw new Error("An unexpected error occurred. Please try again.")
  }
}

export async function updateBookingWithDetailsAction(
  bookingId: string,
  details: {
    customerName: string
    lastName: string
    customerPhone: string
    drivingLicenseNumber: string
    drivingLicenseFrontUrl: string
    drivingLicenseBackUrl: string
    proofOfAddressUrl: string
    niNumber?: string
    bankStatementUrl?: string
  },
) {
  try {
    console.log("[v0] updateBookingWithDetailsAction called with:", { bookingId, details })

    const updateData: any = {
      customerName: `${details.customerName} ${details.lastName}`,
      customerPhone: details.customerPhone,
      drivingLicenseNumber: details.drivingLicenseNumber,
      drivingLicenseFrontUrl: details.drivingLicenseFrontUrl,
      drivingLicenseBackUrl: details.drivingLicenseBackUrl,
      proofOfAddressUrl: details.proofOfAddressUrl,
      documentsSubmittedAt: new Date().toISOString(),
      status: "Pending Review",
    }

    if (details.niNumber) updateData.niNumber = details.niNumber
    if (details.bankStatementUrl) updateData.bankStatementUrl = details.bankStatementUrl

    const result = await db.updateBooking(bookingId, updateData)
    console.log("[v0] updateBookingWithDetailsAction result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in updateBookingWithDetailsAction:", error)
    throw error
  }
}

export async function createBookingWithStripeAction(booking: {
  carId: string
  stripeSessionId: string
  stripePaymentIntentId: string
  totalAmount: number
  pickupLocation: string
  dropoffLocation: string
  pickupDate: string
  dropoffDate: string
  pickupTime: string
  dropoffTime: string
  bookingType: string
}) {
  try {
    console.log("[v0] createBookingWithStripeAction called with:", booking)

    const supabase = await createClient()
    let userId = undefined

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
      }
    }

    const result = await db.createBooking({
      carId: booking.carId,
      customerName: "Pending", // Will be filled after payment
      customerEmail: "pending@payment.com", // Will be filled after payment
      customerPhone: "Pending", // Will be filled after payment
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      pickupDate: booking.pickupDate,
      dropoffDate: booking.dropoffDate,
      pickupTime: booking.pickupTime,
      dropoffTime: booking.dropoffTime,
      totalAmount: booking.totalAmount,
      status: "Payment Completed - Awaiting Details",
      bookingType: booking.bookingType,
      stripeSessionId: booking.stripeSessionId,
      stripePaymentIntentId: booking.stripePaymentIntentId,
      userId,
    })

    console.log("[v0] createBookingWithStripeAction result:", result)
    return result
  } catch (error) {
    console.error("[v0] Exception in createBookingWithStripeAction:", error)
    return null
  }
}

export async function getUserBookingsAction() {
  try {
    const supabase = await createClient()
    if (!supabase) return []

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    return await db.getBookings(user.id)
  } catch (error) {
    console.error("[v0] Error in getUserBookingsAction:", error)
    return []
  }
}

export async function getBookingByStripeSessionAction(sessionId: string) {
  try {
    return await db.getBookingByStripeSession(sessionId)
  } catch (error) {
    console.error("[v0] Error in getBookingByStripeSessionAction:", error)
    return null
  }
}

export async function updateBookingAction(bookingId: string, updates: Partial<Booking>) {
  try {
    console.log("[v0] updateBookingAction called with:", { bookingId, updates })
    const result = await db.updateBooking(bookingId, updates)
    console.log("[v0] updateBookingAction result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in updateBookingAction:", error)
    throw error
  }
}

export async function updateBookingStatusAction(bookingId: string, status: string) {
  try {
    console.log("[v0] updateBookingStatusAction called with:", { bookingId, status })
    const result = await db.updateBooking(bookingId, { status })
    console.log("[v0] updateBookingStatusAction result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in updateBookingStatusAction:", error)
    throw error
  }
}

export async function getBookingByIdAction(id: string) {
  try {
    return await db.getBookingById(id)
  } catch (error) {
    console.error("[v0] Error in getBookingByIdAction:", error)
    return null
  }
}

// Sales Request actions
export async function createSalesRequestAction(request: Omit<SalesRequest, "id" | "createdAt" | "updatedAt">) {
  try {
    console.log("[v0] createSalesRequestAction called with:", request)
    const result = await db.createSalesRequest(request)
    console.log("[v0] createSalesRequestAction result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in createSalesRequestAction:", error)
    return null
  }
}

// User Profile actions
export async function getUserProfileAction() {
  try {
    const supabase = await createClient()
    if (!supabase) {
      console.error("[v0] getUserProfileAction: Supabase not configured")
      return null
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.log("[v0] getUserProfileAction: No user logged in")
      return null
    }

    return await db.getUserProfile(user.id)
  } catch (error) {
    console.error("[v0] Error in getUserProfileAction:", error)
    return null
  }
}

export async function updateUserProfileAction(updates: {
  fullName?: string
  phone?: string
  drivingLicenseNumber?: string
  drivingLicenseFrontUrl?: string
  drivingLicenseBackUrl?: string
  proofOfAddressUrl?: string
  niNumber?: string
  bankStatementUrl?: string
  privateHireLicenseFrontUrl?: string
  privateHireLicenseBackUrl?: string
}) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      console.error("[v0] updateUserProfileAction: Supabase not configured")
      return { success: false, error: "Supabase not configured" }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.error("[v0] updateUserProfileAction: No user logged in")
      return { success: false, error: "No user logged in" }
    }

    return await db.updateUserProfile(user.id, updates)
  } catch (error) {
    console.error("[v0] Error in updateUserProfileAction:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Additional actions
export async function getBookingsAction() {
  try {
    return await db.getAllBookings()
  } catch (error) {
    console.error("[v0] Error in getBookingsAction:", error)
    return []
  }
}
