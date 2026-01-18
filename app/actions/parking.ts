"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ParkingCar {
    id: string // fleet_vehicle id
    carId: string // car model id
    name: string
    brand: string
    image: string
    registrationNumber: string
    status: "AVAILABLE" | "ON_RENT"
    currentAgreement?: {
        id: string
        customerName: string // Requires fetching profile or storing name in agreement? Agreement has customer_id.
        startDate: string
        endDate: string
    }
}

export interface CarModel {
    id: string
    brand: string
    name: string
    image: string
}

export async function getFleetStatusAction(): Promise<{
    success: boolean
    cars: ParkingCar[]
    stats: { total: number; onParking: number; onRent: number }
    error?: string
}> {
    try {
        const supabase = await createAdminClient()
        if (!supabase) {
            return { success: false, cars: [], stats: { total: 0, onParking: 0, onRent: 0 }, error: "Database connection failed" }
        }

        // 1. Fetch all fleet vehicles with car details
        const { data: fleet, error: fleetError } = await supabase
            .from("fleet_vehicles")
            .select(`
        id,
        registration_number,
        status,
        cars (
          id,
          name,
          brand,
          image
        )
      `)
            .order("created_at", { ascending: false })

        if (fleetError) {
            console.error("Error fetching fleet:", fleetError)
            return { success: false, cars: [], stats: { total: 0, onParking: 0, onRent: 0 }, error: fleetError.message }
        }

        // 2. Fetch active agreements to determine status
        // We look for agreements that are active/signed/on_rent AND have a vehicle_registration matching our fleet
        const now = new Date().toISOString()
        const { data: activeAgreements, error: agreementsError } = await supabase
            .from("agreements")
            .select(`
        id,
        vehicle_registration,
        status,
        start_date,
        end_date,
        customer_id,
        user_profiles (
          full_name
        )
      `)
            .in("status", ["active", "signed", "on_rent"])
        // We could ideally filter by date overlap too, but "active"/"signed" usually implies current.
        // Let's rely on status for now.

        const agreementMap = new Map()
        if (activeAgreements) {
            activeAgreements.forEach((a: any) => {
                if (a.vehicle_registration) {
                    // Normalize VRN for matching just in case
                    const key = a.vehicle_registration.toUpperCase().replace(/\s/g, "")
                    agreementMap.set(key, a)
                }
            })
        }

        // 3. Map to result
        const parkingCars: ParkingCar[] = fleet.map((v: any) => {
            const carModel = v.cars
            const vrnKey = v.registration_number.toUpperCase().replace(/\s/g, "")
            const agreement = agreementMap.get(vrnKey)

            return {
                id: v.id,
                carId: carModel?.id,
                name: carModel?.name || "Unknown Model",
                brand: carModel?.brand || "Unknown Brand",
                image: carModel?.image,
                registrationNumber: v.registration_number,
                status: agreement ? "ON_RENT" : "AVAILABLE",
                currentAgreement: agreement
                    ? {
                        id: agreement.id,
                        customerName: agreement.user_profiles?.full_name || "Unknown Customer",
                        startDate: agreement.start_date,
                        endDate: agreement.end_date,
                    }
                    : undefined,
            }
        })

        const stats = {
            total: parkingCars.length,
            onParking: parkingCars.filter((c) => c.status === "AVAILABLE").length,
            onRent: parkingCars.filter((c) => c.status === "ON_RENT").length,
        }

        return { success: true, cars: parkingCars, stats }
    } catch (error: any) {
        console.error("Exception in getFleetStatusAction:", error)
        return { success: false, cars: [], stats: { total: 0, onParking: 0, onRent: 0 }, error: error.message }
    }
}

export async function getAllCarModelsAction(): Promise<{ success: boolean; models: CarModel[] }> {
    try {
        const supabase = await createAdminClient()
        if (!supabase) {
            console.error("[Parking] No Supabase client available")
            return { success: false, models: [] }
        }

        const { data, error } = await supabase.from("cars").select("id, brand, name, image").order("brand")

        if (error) {
            console.error("[Parking] Error fetching car models:", error)
            return { success: false, models: [] }
        }

        return { success: true, models: data as CarModel[] }
    } catch (e) {
        console.error("[Parking] Exception fetching models:", e)
        return { success: false, models: [] }
    }
}

export async function addFleetVehicleAction(carId: string, vrn: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createAdminClient()
        if (!supabase) return { success: false, error: "Database connection failed" }

        console.log(`[Parking] Adding vehicle: CarID=${carId}, VRN=${vrn}`)

        // Check if VRN exists (case-insensitive check would be better but let's stick to exact for now)
        const { data: existing } = await supabase.from("fleet_vehicles").select("id").eq("registration_number", vrn).single()
        if (existing) {
            return { success: false, error: "Vehicle with this registration number already exists." }
        }

        const { error } = await supabase
            .from("fleet_vehicles")
            .insert({
                car_id: carId,
                registration_number: vrn,
                status: 'active'
            })

        if (error) {
            console.error("[Parking] Error adding fleet vehicle:", error)
            console.error("[Parking] Details:", error.details, error.hint, error.message)
            return { success: false, error: `Database Error: ${error.message}` }
        }

        revalidatePath("/admin/parking")
        return { success: true }
    } catch (error: any) {
        console.error("[Parking] Critical Exception:", error)
        return { success: false, error: error.message }
    }
}

export async function deleteFleetVehicleAction(vehicleId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createAdminClient()
        if (!supabase) {
            console.error("[Parking] No Supabase client available for deleteFleetVehicleAction")
            return { success: false, error: "Database connection failed" }
        }

        console.log(`[Parking] Deleting vehicle with ID: ${vehicleId}`)

        const { error } = await supabase
            .from("fleet_vehicles")
            .delete()
            .eq("id", vehicleId)

        if (error) {
            return { success: false, error: error.message }
        }

        revalidatePath("/admin/parking")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
export interface FleetOption {
    id: string
    registrationNumber: string
    brand: string
    model: string
}

export async function getAvailableFleetVehiclesAction(
    carId: string,
    bookingDates?: { start: string; end: string }
): Promise<{ success: boolean; vehicles: FleetOption[]; error?: string }> {
    try {
        const supabase = await createAdminClient()
        if (!supabase) return { success: false, vehicles: [], error: "Database connection failed" }

        console.log(`[Parking] Fetching available fleet (Flexible Mode) for carId request: ${carId}`, bookingDates)

        // 1. Fetch ALL active fleet vehicles (Flexible Mode)
        // Removed sibling search and car_id filtering to allow picking ANY car.
        const { data: fleetData, error: fleetError } = await supabase
            .from("fleet_vehicles")
            .select(`
                id,
                registration_number,
                cars (
                   brand,
                   name
                )
            `)
            .eq("status", "active") // Only active vehicles

        if (fleetError) {
            console.error("[Parking] Error fetching fleet:", fleetError)
            return { success: false, vehicles: [], error: fleetError.message }
        }

        let availableFleet = fleetData || []

        // 3. Filter by overlapping agreements if dates provided
        if (bookingDates?.start && bookingDates?.end) {
            const reqStart = new Date(bookingDates.start)
            const reqEnd = new Date(bookingDates.end)

            // Fetch agreements that might conflict
            // We fetch any agreement that is "active" or "future" for the candidate vehicles
            // Filtering by vehicle_registration IN (list)
            const candidateVrns = availableFleet.map((v: any) => v.registration_number)

            if (candidateVrns.length > 0) {
                const { data: agreements, error: agError } = await supabase
                    .from("agreements")
                    .select("vehicle_registration, start_date, end_date, status")
                    .in("vehicle_registration", candidateVrns)
                    .in("status", ["active", "signed", "pending", "on_rent", "confirmed"]) // Blocking statuses

                if (agreements) {
                    const unavailableVrns = new Set<string>()

                    agreements.forEach((a: any) => {
                        const agStart = new Date(a.start_date)
                        const agEnd = new Date(a.end_date)

                        // Check overlap
                        // Overlap exists if (StartA <= EndB) and (EndA >= StartB)
                        if (agStart <= reqEnd && agEnd >= reqStart) {
                            unavailableVrns.add(a.vehicle_registration)
                        }
                    })

                    console.log("[Parking] Unavailable VRNs due to overlap:", Array.from(unavailableVrns))
                    availableFleet = availableFleet.filter((v: any) => !unavailableVrns.has(v.registration_number))
                }
            }
        }

        // 4. Map to result
        const options: FleetOption[] = availableFleet.map((v: any) => ({
            id: v.id,
            registrationNumber: v.registration_number,
            brand: v.cars?.brand || "Unknown",
            model: v.cars?.name || "Unknown",
        }))

        // Deduplicate by VRN (if multiple fleet entries point to same VRN?) logic stays simple for now
        // But map distinct just in case
        const distinctOptions = options.filter((v, i, a) => a.findIndex(t => t.registrationNumber === v.registrationNumber) === i)

        return { success: true, vehicles: distinctOptions }

    } catch (e: any) {
        console.error("[Parking] Exception fetching available fleet:", e)
        return { success: false, vehicles: [], error: e.message }
    }
}
