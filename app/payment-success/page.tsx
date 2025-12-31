"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { getPaymentStatus } from "@/app/actions/stripe"
import { createBookingWithStripeAction } from "@/app/actions/database"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams.get("session_id")

      if (!sessionId) {
        router.push("/")
        return
      }

      try {
        // Verify payment status with Stripe
        const { status, paymentIntentId } = await getPaymentStatus(sessionId)

        if (status === "paid") {
          const booking = await createBookingWithStripeAction({
            carId: searchParams.get("carId") || "",
            stripeSessionId: sessionId,
            stripePaymentIntentId: paymentIntentId,
            totalAmount: Number.parseFloat(searchParams.get("amount") || "0"),
            pickupLocation: searchParams.get("pickup") || "London, UK",
            dropoffLocation: searchParams.get("dropoff") || "London, UK",
            pickupDate: searchParams.get("pickupDate") || "",
            dropoffDate: searchParams.get("dropoffDate") || "",
            pickupTime: searchParams.get("pickupTime") || "10:00",
            dropoffTime: searchParams.get("dropoffTime") || "10:00",
            bookingType: searchParams.get("bookingType") || "Rent",
          })

          if (booking) {
            router.push(`/booking-details?bookingId=${booking.id}`)
          } else {
            throw new Error("Failed to create booking")
          }
        } else {
          throw new Error("Payment not completed")
        }
      } catch (error) {
        console.error("[v0] Error processing payment:", error)
        alert("There was an issue processing your payment. Please contact support.")
        router.push("/")
      }
    }

    processPayment()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-neutral-900 to-black">
      <div className="text-center">
        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-red-500" />
        <h2 className="text-xl font-semibold text-white mb-2">Processing Your Payment</h2>
        <p className="text-white/60">Please wait while we verify your payment...</p>
      </div>
    </div>
  )
}
