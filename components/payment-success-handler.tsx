"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { updateBookingAction } from "@/app/actions/database"
import { getPaymentStatus } from "@/app/actions/stripe"

export default function PaymentSuccessHandler() {
  const router = useRouter()
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking")

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const sessionId = sessionStorage.getItem("stripeSessionId")
        const bookingId = sessionStorage.getItem("bookingId")

        if (!sessionId || !bookingId) {
          setStatus("error")
          return
        }

        console.log("[v0] Verifying payment status...")

        // Check payment status
        const { status: paymentStatus, paymentIntentId } = await getPaymentStatus(sessionId)

        if (paymentStatus === "paid") {
          console.log("[v0] Payment successful, updating booking...")

          // Update booking with payment info
          await updateBookingAction(bookingId, {
            status: "Payment Completed - Awaiting Details",
            stripePaymentIntentId: paymentIntentId,
          })

          setStatus("success")

          // Redirect to booking details page after a short delay
          setTimeout(() => {
            router.push("/booking-details")
          }, 2000)
        } else {
          setStatus("error")
        }
      } catch (error) {
        console.error("[v0] Error handling payment success:", error)
        setStatus("error")
      }
    }

    handlePaymentSuccess()
  }, [router])

  if (status === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-black via-neutral-900 to-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
        <p className="text-white/70">Verifying payment...</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-black via-neutral-900 to-black p-6">
        <div className="rounded-full bg-red-500/20 p-4">
          <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Payment Verification Failed</h2>
        <p className="text-center text-white/70">There was an issue verifying your payment. Please contact support.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-lg bg-red-500 px-6 py-3 font-semibold text-white hover:bg-red-600"
        >
          Return Home
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-black via-neutral-900 to-black">
      <div className="rounded-full bg-green-500/20 p-4">
        <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
      <p className="text-white/70">Redirecting to complete your booking...</p>
    </div>
  )
}
