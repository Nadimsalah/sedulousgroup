"use server"

import { createAdminSupabase } from "@/lib/supabase/admin"

export async function getBookingInspectionDetails(bookingId: string) {
    const supabase = createAdminSupabase()

    try {
        // 1. Fetch Booking Details
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", bookingId)
            .single()

        if (bookingError) throw new Error(`Booking error: ${bookingError.message}`)

        // 2. Fetch Inspections
        const { data: inspections, error: inspectionsError } = await supabase
            .from("vehicle_inspections")
            .select("*")
            .eq("booking_id", bookingId)
            .order("created_at", { ascending: true })

        if (inspectionsError) throw new Error(`Inspections error: ${inspectionsError.message}`)

        // 3. Fetch Agreement
        const { data: agreements, error: agreementsError } = await supabase
            .from("agreements")
            .select("*")
            .eq("booking_id", bookingId)
            .order("created_at", { ascending: false })
            .limit(1)

        const agreement = agreements && agreements.length > 0 ? agreements[0] : null
        if (agreementsError) console.error("Agreement fetch error:", agreementsError)

        // 4. Fetch Vehicle History (Previous Bookings)
        // Only if we have a car_id
        let vehicleHistory = []
        if (booking.car_id) {
            const { data: history, error: historyError } = await supabase
                .from("bookings")
                .select("id, pickup_date, dropoff_date, customer_name, status, created_at")
                .eq("car_id", booking.car_id)
                .neq("id", bookingId) // Exclude current
                .order("pickup_date", { ascending: false })
                .limit(10)

            if (!historyError) vehicleHistory = history
        }

        // 5. Categorize Inspections
        const handover = inspections.find(i => i.inspection_type === "handover")
        const returnInspection = inspections.find(i => i.inspection_type === "return")

        return {
            success: true,
            data: {
                booking,
                handover,
                return: returnInspection,
                agreement,
                vehicleHistory,
                timeline: [
                    { type: 'created', date: booking.created_at, author: 'System' },
                    agreement ? { type: 'agreement_created', date: agreement.created_at, author: 'Admin' } : null,
                    handover ? { type: 'handover', date: handover.created_at, author: handover.inspector_name || 'Admin' } : null,
                    returnInspection ? { type: 'return', date: returnInspection.created_at, author: returnInspection.inspector_name || 'Admin' } : null,
                ].filter(Boolean).sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime())
            }
        }

    } catch (error: any) {
        console.error("getBookingInspectionDetails failed:", error)
        return { success: false, error: error.message }
    }
}
