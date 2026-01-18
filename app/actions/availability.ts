"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

function createAdminSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing Supabase credentials")
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

export async function checkCarAvailability(
    carId: string,
    startDate: string,
    endDate: string,
    excludeBookingId?: string
): Promise<boolean> {
    try {
        const supabase = createAdminSupabase()

        // Logic: Look for any booking for this car that overlaps with the requested dates
        // Overlap condition: (StartA <= EndB) and (EndA >= StartB)

        let query = supabase
            .from("bookings")
            .select("id")
            .eq("car_id", carId)
            .neq("status", "Cancelled")
            .neq("status", "Rejected")
            .neq("status", "Documents Rejected") // Depending on business logic, maybe these are available? Assuming yes if rejected.
            .lte("pickup_date", endDate)
            .gte("dropoff_date", startDate)

        if (excludeBookingId) {
            query = query.neq("id", excludeBookingId)
        }

        const { data, error } = await query

        if (error) {
            console.error("[Availability] Error checking availability:", error)
            throw new Error(error.message)
        }

        // If any booking found, it's not available
        return data.length === 0
    } catch (error) {
        console.error("[Availability] Exception checking availability:", error)
        // Default to false (unavailable) on error to be safe, or throw
        throw error
    }
}

export async function getAvailableCars(
    startDate: string,
    endDate: string,
    category?: string,
    rentalType?: string
) {
    try {
        const supabase = createAdminSupabase()

        // 1. Get all cars first (or filtered by category/type)
        let carsQuery = supabase.from("cars").select("*")

        if (category && category !== "All") {
            carsQuery = carsQuery.eq("category", category)
        }

        // Note: RentalType filtering usually happens on the client or needs a column check
        // If rental_type column exists and populated:
        if (rentalType && rentalType !== "All") {
            // Check if column exists in schema or handled in app. 
            // Based on previous file reads, `rental_type` is likely in the `cars` table logic or JSON.
            // The `cars` table definition showed: rental_type text not null (implied from getAllBookingsAction or similar)
            // Let's assume it's a column based on `scripts/006_add_rental_type_to_cars.sql` presence.
            carsQuery = carsQuery.eq("rental_type", rentalType)
        }

        const { data: cars, error: carsError } = await carsQuery

        if (carsError || !cars) {
            throw new Error(carsError?.message || "Failed to fetch cars")
        }

        // 2. Get all bookings that overlap with the date range
        const { data: busyBookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("car_id")
            .neq("status", "Cancelled")
            .neq("status", "Rejected")
            .lte("pickup_date", endDate)
            .gte("dropoff_date", startDate)

        if (bookingsError) {
            throw new Error(bookingsError.message)
        }

        const busyCarIds = new Set(busyBookings?.map((b: { car_id: string }) => b.car_id))

        // 3. Filter cars
        const availableCars = cars.filter((car: { id: string }) => !busyCarIds.has(car.id))

        return { success: true, data: availableCars }
    } catch (error) {
        console.error("[Availability] Error fetching available cars:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }
    }
}
