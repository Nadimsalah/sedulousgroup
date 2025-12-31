"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Phone, Mail, Clock, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const bookingNumber =
    searchParams.get("bookingId") || `DNA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Success Header */}
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20"></div>
                <div className="relative rounded-full bg-gradient-to-br from-green-500 to-green-600 p-4">
                  <CheckCircle className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
            <h1 className="mb-3 text-4xl font-bold text-white sm:text-5xl">Booking Confirmed!</h1>
            <p className="mb-2 text-xl text-gray-300">Your booking request has been submitted</p>
            <p className="text-lg text-gray-400">We will review your request and get back to you shortly</p>
          </div>

          {/* Booking Reference */}
          <Card className="mb-6 border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-400">Booking Reference</p>
              <p className="text-3xl font-bold text-red-500 break-all">{bookingNumber}</p>
              <p className="mt-3 text-sm text-gray-400">Please save this reference number for your records</p>
            </div>
          </Card>

          {/* What Happens Next */}
          <Card className="mb-6 border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xl font-bold text-white">What Happens Next?</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-white">Review Process</h3>
                  <p className="text-sm text-gray-400">Our team will review your booking request within a few hours.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-white">Confirmation Email</h3>
                  <p className="text-sm text-gray-400">
                    Once approved, you will receive a confirmation email with all the details.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-white">Vehicle Collection</h3>
                  <p className="text-sm text-gray-400">
                    Arrive at your scheduled time to collect your vehicle and start your journey!
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="mb-6 border-2 border-red-500/30 bg-red-500/5 p-6">
            <h2 className="mb-4 text-xl font-bold text-white">Need Immediate Support?</h2>
            <p className="mb-6 text-sm text-gray-300">
              Our team is here to help. Contact us directly for any questions:
            </p>

            <div className="space-y-4">
              <a
                href="tel:02033552561"
                className="flex items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4 transition-all hover:bg-zinc-700"
              >
                <div className="rounded-full bg-red-500 p-3">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Call Us Now</p>
                  <p className="text-xl font-bold text-white">020 3355 2561</p>
                </div>
              </a>

              <a
                href="mailto:info@sedulousgroupltd.co.uk"
                className="flex items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4 transition-all hover:bg-zinc-700"
              >
                <div className="rounded-full bg-red-500 p-3">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Email Us</p>
                  <p className="text-lg font-semibold text-white">info@sedulousgroupltd.co.uk</p>
                </div>
              </a>

              <div className="flex items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                <div className="rounded-full bg-red-500 p-3">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Office Hours</p>
                  <p className="text-lg font-semibold text-white">Mon-Fri: 09:00 - 18:00</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Button */}
          <Button
            onClick={() => router.push("/")}
            className="w-full rounded-xl bg-red-500 py-6 text-base font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:bg-red-600"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
