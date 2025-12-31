"use server"

import { stripe } from "@/lib/stripe"

export async function createCheckoutSession(bookingData: {
  carId: string
  carName: string
  totalAmount: number
  rentalDays: number
  pickupLocation: string
  dropoffLocation: string
  pickupDate: string
  dropoffDate: string
  pickupTime: string
  dropoffTime: string
  bookingType: string
}) {
  try {
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      redirect_on_completion: "never",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: bookingData.carName,
              description: `${bookingData.bookingType} - ${bookingData.rentalDays} days`,
            },
            unit_amount: Math.round(bookingData.totalAmount * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        carId: bookingData.carId,
        pickupLocation: bookingData.pickupLocation,
        dropoffLocation: bookingData.dropoffLocation,
        pickupDate: bookingData.pickupDate,
        dropoffDate: bookingData.dropoffDate,
        pickupTime: bookingData.pickupTime,
        dropoffTime: bookingData.dropoffTime,
        bookingType: bookingData.bookingType,
      },
    })

    return { clientSecret: session.client_secret, sessionId: session.id }
  } catch (error) {
    console.error("[v0] Error creating checkout session:", error)
    throw error
  }
}

export async function getPaymentStatus(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return {
      status: session.payment_status,
      paymentIntentId: session.payment_intent as string,
    }
  } catch (error) {
    console.error("[v0] Error retrieving payment status:", error)
    throw error
  }
}
