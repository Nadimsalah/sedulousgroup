"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car } from "lucide-react"

interface Booking {
  id: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  pickup_date?: string
  dropoff_date?: string
  total_amount?: number | string
  status?: string
  created_at?: string
  cars?: {
    id: string
    make?: string
    model?: string
    year?: string
    brand?: string
    name?: string
    image_url?: string
  }
  car_name?: string
  car_id?: string
}

interface CustomerDetailsClientProps {
  bookings: Booking[]
  customerId: string
  email: string
}

function getCarInfo(booking: Booking): string {
  // Try to get car info from nested cars object
  if (booking.cars) {
    const make = booking.cars.make || booking.cars.brand || ""
    const model = booking.cars.model || booking.cars.name || ""
    const year = booking.cars.year || ""
    const result = `${make} ${model} ${year}`.trim()
    if (result) return result
  }
  // Fallback to car_name if available
  if (booking.car_name) {
    return booking.car_name
  }
  // Fallback to car_id
  if (booking.car_id) {
    return `Vehicle ID: ${booking.car_id.slice(0, 8)}`
  }
  return "Unknown Vehicle"
}

export default function CustomerDetailsClient({ bookings, customerId, email }: CustomerDetailsClientProps) {
  // Calculate statistics
  const activeBookings = bookings.filter((b) => {
    const status = (b.status || "").toLowerCase()
    return ["active", "approved", "pending", "confirmed"].includes(status)
  })

  const totalSpent = bookings.reduce((sum: number, b) => {
    const amount = parseFloat(String(b.total_amount || 0)) || 0
    return sum + amount
  }, 0)

  const lastBooking = bookings.length > 0 ? bookings[0] : null

  return (
    <>
      {/* Statistics Cards - Always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="liquid-glass border-white/10">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{bookings.length}</p>
            {bookings.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No bookings found</p>
            )}
          </CardContent>
        </Card>
        <Card className="liquid-glass border-white/10">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Active Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">{activeBookings.length}</p>
            {activeBookings.length === 0 && bookings.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">No active bookings</p>
            )}
          </CardContent>
        </Card>
        <Card className="liquid-glass border-white/10">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">£{totalSpent.toFixed(2)}</p>
            {totalSpent === 0 && bookings.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">No amount recorded</p>
            )}
          </CardContent>
        </Card>
        <Card className="liquid-glass border-white/10">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Last Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-bold text-white">
              {lastBooking?.created_at ? new Date(lastBooking.created_at).toLocaleDateString() : "N/A"}
            </p>
            {lastBooking && (
              <p className="text-xs text-gray-500 mt-1">
                {lastBooking.status || "No status"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking History - Always visible */}
      <div className="liquid-glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Booking History</h2>
          <Badge className="bg-white/10 text-white border-white/20">
            {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
          </Badge>
        </div>
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No bookings found for this customer</p>
            <p className="text-gray-500 text-sm">Customer ID: {customerId}</p>
            <p className="text-gray-500 text-sm">Email: {email}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{getCarInfo(booking)}</h3>
                  <Badge
                    className={
                      booking.status === "active" || booking.status === "approved"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : booking.status === "completed"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : booking.status === "cancelled"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    }
                  >
                    {booking.status || "pending"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Pickup</p>
                    <p className="text-white">
                      {booking.pickup_date
                        ? new Date(booking.pickup_date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Dropoff</p>
                    <p className="text-white">
                      {booking.dropoff_date
                        ? new Date(booking.dropoff_date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Amount</p>
                    <p className="text-white">£{parseFloat(String(booking.total_amount || 0)).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Booked</p>
                    <p className="text-white">
                      {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

