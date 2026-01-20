"use server"

import { createClient } from "@supabase/supabase-js"
import { createCheckoutSession } from "./stripe"

// Create admin client to bypass RLS policies
function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

export async function createBookingWithPayment(bookingData: {
    carId: string
    carName: string
    customerName: string
    customerEmail: string
    customerPhone: string
    drivingLicenseNumber?: string // Made optional
    pickupLocation: string
    dropoffLocation: string
    pickupDate: string
    dropoffDate: string
    pickupTime: string
    dropoffTime: string
    totalAmount: number
    bookingType: string
    userId: string | null
    rentalDays: number
}) {
    try {
        const supabase = createAdminClient()

        // Generate unique booking ID (matching existing format)
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        let shortCode = ""
        for (let i = 0; i < 6; i++) {
            shortCode += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        const bookingId = `SED-${shortCode}`

        // Create booking with pending payment status
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .insert({
                id: bookingId,
                car_id: bookingData.carId,
                user_id: bookingData.userId,
                customer_name: bookingData.customerName,
                customer_email: bookingData.customerEmail,
                customer_phone: bookingData.customerPhone,
                driving_license_number: bookingData.drivingLicenseNumber || null,
                pickup_location: bookingData.pickupLocation,
                dropoff_location: bookingData.dropoffLocation,
                pickup_date: bookingData.pickupDate,
                dropoff_date: bookingData.dropoffDate,
                pickup_time: bookingData.pickupTime,
                dropoff_time: bookingData.dropoffTime,
                total_amount: bookingData.totalAmount,
                booking_type: bookingData.bookingType,
                status: "pending",
                payment_status: "pending",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (bookingError || !booking) {
            console.error("Error creating booking:", bookingError)
            throw new Error(bookingError?.message || "Failed to create booking")
        }

        // Create Stripe checkout session with booking ID
        const stripeSession = await createCheckoutSession({
            bookingId: booking.id,
            carId: bookingData.carId,
            carName: bookingData.carName,
            totalAmount: bookingData.totalAmount,
            rentalDays: bookingData.rentalDays,
            pickupLocation: bookingData.pickupLocation,
            dropoffLocation: bookingData.dropoffLocation,
            pickupDate: bookingData.pickupDate,
            dropoffDate: bookingData.dropoffDate,
            pickupTime: bookingData.pickupTime,
            dropoffTime: bookingData.dropoffTime,
            bookingType: bookingData.bookingType,
        })

        // Update booking with stripe session ID
        await supabase
            .from("bookings")
            .update({ stripe_session_id: stripeSession.sessionId })
            .eq("id", booking.id)

        return {
            success: true,
            bookingId: booking.id,
            clientSecret: stripeSession.clientSecret,
            sessionId: stripeSession.sessionId,
        }
    } catch (error) {
        console.error("Error in createBookingWithPayment:", error)
        throw error
    }
}

export async function updateBookingDocuments(bookingId: string, documentData: {
    drivingLicenseNumber: string // Required here now
    niNumber: string
    drivingLicenseFrontUrl: string
    drivingLicenseBackUrl: string
    proofOfAddressUrl: string
    bankStatementUrl?: string | null
    privateHireLicenseFrontUrl?: string | null
    privateHireLicenseBackUrl?: string | null
}) {
    try {
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from("bookings")
            .update({
                driving_license_number: documentData.drivingLicenseNumber,
                ni_number: documentData.niNumber,
                driving_license_front_url: documentData.drivingLicenseFrontUrl,
                driving_license_back_url: documentData.drivingLicenseBackUrl,
                proof_of_address_url: documentData.proofOfAddressUrl,
                bank_statement_url: documentData.bankStatementUrl,
                private_hire_license_front_url: documentData.privateHireLicenseFrontUrl,
                private_hire_license_back_url: documentData.privateHireLicenseBackUrl,
                status: "Documents Submitted",
            })
            .eq("id", bookingId)
            .select()
            .single()

        if (error) {
            console.error("Error updating booking documents:", error)
            throw new Error("Failed to update booking documents")
        }

        return { success: true, booking: data }
    } catch (error) {
        console.error("Error in updateBookingDocuments:", error)
        throw error
    }
}

export async function checkPaymentStatus(bookingId: string) {
    try {
        const supabase = createAdminClient()

        const { data: booking, error } = await supabase
            .from("bookings")
            .select("payment_status, stripe_session_id")
            .eq("id", bookingId)
            .single()

        if (error || !booking) {
            throw new Error("Booking not found")
        }

        return {
            success: true,
            paymentStatus: booking.payment_status,
            sessionId: booking.stripe_session_id,
        }
    } catch (error) {
        console.error("Error checking payment status:", error)
        throw error
    }
}
