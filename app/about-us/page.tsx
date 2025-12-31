"use client"

import { useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Car, FileText, CheckCircle } from "lucide-react"

export default function AboutUsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About Us</h1>
          <div className="w-24 h-1 bg-red-600 mx-auto"></div>
        </div>

        {/* Main Content */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-8">
          <p className="text-gray-300 leading-relaxed mb-6">
            At Sedulous Group, we specialise in providing high-quality car and van hire, as well as luxury vehicle
            rentals, to meet the unique needs of both individuals and businesses. Our fleet features the latest and most
            up-to-date vehicles, ensuring every rental offers modern comfort, style, and reliability.
          </p>
        </Card>

        {/* Our Services */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Car className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-bold text-white">Our Services</h2>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Whether you're looking for a practical car for a short trip, a luxurious vehicle for a special occasion, or
            a dependable van for business, we have the perfect solution. Additionally, we offer flexible short- and
            long-term vehicle hire for businesses, providing efficient fleet solutions tailored to support your
            company's transportation needs.
          </p>
        </Card>

        {/* Getting Started */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-bold text-white">Getting Started</h2>
          </div>
          <p className="text-gray-300 leading-relaxed">
            To get started, simply visit our Process page to submit your application. There, you'll find all the
            necessary documentation required, including proof of address, a valid driving licence, national insurance
            number, DVLA check code, and relevant business details (if applicable). Once your application is reviewed
            and approved, we will work with you to tailor the perfect vehicle solution to meet your individual or
            business requirements.
          </p>
        </Card>

        {/* Why Choose Us */}
        <Card className="bg-zinc-900 border-zinc-800 p-8">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-bold text-white">Why Choose Us?</h2>
          </div>
          <p className="text-gray-300 leading-relaxed">
            At Sedulous Group, customer satisfaction is our top priority. We pride ourselves on delivering a seamless,
            professional service with a commitment to safety, quality, and convenience. With our modern fleet and
            personalised approach, we ensure you have the right vehicle at the right time, whether for personal use or
            as part of your business operations.
          </p>
        </Card>
      </div>
    </div>
  )
}
