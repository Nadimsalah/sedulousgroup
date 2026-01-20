"use server"

import { createClient } from "@/lib/supabase/server"
import { createCheckoutSession } from "./stripe"

export async function createBookingWithPayment(bookingData: {
    carId: string
    carName: string
    customerName: string
    customerEmail: string
    customerPhone: string
    drivingLicenseNumber: string
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
        const supabase = await createClient()

        // Create booking with pending payment status
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .insert({
                car_id: bookingData.carId,
                customer_name: bookingData.customerName,
                customer_email: bookingData.customerEmail,
                customer_phone: bookingData.customerPhone,
                driving_license_number: bookingData.drivingLicenseNumber,
                pickup_location: bookingData.pickupLocation,
                dropoff_location: bookingData.dropoffLocation,
                pickup_date: bookingData.pickupDate,
                dropoff_date: bookingData.dropoffDate,
                pickup_time: bookingData.pickupTime,
                dropoff_time: bookingData.dropoffTime,
                total_amount: bookingData.totalAmount,
                booking_type: bookingData.bookingType,
                customer_id: bookingData.userId,
                status: "pending",
                payment_status: "pending",
            })
            .select()
            .single()

        if (bookingError || !booking) {
            console.error("Error creating booking:", bookingError)
            throw new Error("Failed to create booking")
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
    niNumber: string
    drivingLicenseFrontUrl: string
    drivingLicenseBackUrl: string
    proofOfAddressUrl: string
    bankStatementUrl?: string | null
    privateHireLicenseFrontUrl?: string | null
    privateHireLicenseBackUrl?: string | null
}) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("bookings")
            .update({
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
        const supabase = await createClient()

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
