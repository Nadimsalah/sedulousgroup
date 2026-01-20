"use server"

import { db } from "@/lib/database"
import { generateInvoicePDF, type InvoiceData } from "@/lib/pdf-generator"
import { createClient } from "@/lib/supabase/server"
import { getCompanySettings } from "@/app/actions/company-settings"

export async function generateInvoiceAction(bookingId: string) {
    try {
        // 1. Authenticate
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: "Not authenticated" }
        }

        // 2. Fetch Booking
        const booking = await db.getBookingById(bookingId)
        if (!booking) {
            return { success: false, error: "Booking not found" }
        }

        // 3. Verify Ownership
        const isOwner = booking.userId === user.id || booking.customerEmail === user.email
        if (!isOwner) {
            // Optional: admin check could go here
        }

        // 4. Fetch User Profile, Car, and Company Settings
        const [profile, car, companySettings] = await Promise.all([
            db.getUserProfile(user.id),
            booking.carId ? db.getCar(booking.carId) : null,
            getCompanySettings()
        ])

        // 5. Calculate Dates and Durations
        const start = new Date(booking.pickupDate)
        const end = new Date(booking.dropoffDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1

        // 6. Construct Items (Calculate VAT)
        const totalAmount = booking.totalAmount
        // Assuming totalAmount is Gross (inc VAT)
        const vatRate = 0.20
        const subtotal = totalAmount / (1 + vatRate)
        const taxAmount = totalAmount - subtotal
        const dailyRateNet = subtotal / diffDays

        const carDescription = car
            ? `${car.brand} ${car.name}`
            : "Car Rental"

        const items = [
            {
                description: `${carDescription} (${diffDays} days @ £${dailyRateNet.toFixed(2)}/day)`,
                quantity: diffDays,
                unit_price: dailyRateNet,
                total: subtotal
            }
        ]

        // 7. Prepare Invoice Data
        // Extract a unique identifier from the booking ID for the invoice number
        // booking.id format: booking-TIMESTAMP-RANDOM
        const uniqueSuffix = booking.id.split('-').pop() || booking.id.slice(-8)

        const invoiceData: InvoiceData = {
            invoice_number: `SED-${uniqueSuffix.toUpperCase()}`,
            date: new Date().toLocaleDateString('en-GB'),
            due_date: new Date(booking.pickupDate).toLocaleDateString('en-GB'),
            company_name: "Sedulous Group Ltd",
            company_address: "Unit 5, 100 Colindeep Lane\nLondon\nNW9 6HB",
            company_phone: "020 3355 2561",
            company_email: "info@sedulousgroupltd.co.uk",
            company_reg: [
                "Company No: 13272612",
                "FCA No: 964621",
                "ICO Registered"
            ],
            customer_name: profile?.fullName || user.email || "Valued Customer",
            customer_address: booking.pickupLocation || "Address on file", // Fallback to pickup location
            customer_email: user.email || "",
            items: items,
            subtotal: subtotal,
            tax: taxAmount,
            total: totalAmount,
            notes: "Payment settled via platform. Includes 20% VAT."
        }

        // 8. Generate PDF
        // Prioritize the correct logo file
        const logoUrl = "/sedulous-logo-full.jpg"
        const doc = await generateInvoicePDF(invoiceData, logoUrl)
        const pdfBase64 = doc.output('datauristring')

        return { success: true, pdfBase64 }

    } catch (error) {
        console.error("Generate Invoice Error:", error)
        return { success: false, error: "Failed to generate invoice" }
    }
}
