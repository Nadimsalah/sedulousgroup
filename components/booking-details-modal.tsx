"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, User, Mail, Phone, CreditCard, Car, Check } from "lucide-react"
import { format, parseISO } from "date-fns"
import { getDurationText, type BookingType } from "@/lib/booking-rules"
import { BookingProgressCircle } from "@/components/booking-progress-circle"
import { BookingCountdown } from "@/components/booking-countdown"

interface Booking {
  id: string
  car_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  pickup_location: string
  dropoff_location: string
  pickup_date: string
  pickup_time: string
  dropoff_date: string
  dropoff_time: string
  total_amount: number
  status: string
  booking_type: BookingType
  created_at: string
  pickupVerifiedAt?: string
  verificationPhotos?: { type: string }[]
}

interface BookingDetailsModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
}

export function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
  if (!booking) return null

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMM yyyy")
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount == null || isNaN(amount)) {
      return "£0.00"
    }
    return `£${amount.toFixed(2)}`
  }

  const durationText = getDurationText(booking.booking_type, booking.total_amount)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-black border-white/20 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Booking Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Booking ID and Status */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-white/10">
            <div>
              <p className="text-sm text-white/60 mb-1">Booking Reference</p>
              <p className="text-2xl font-bold text-white">#{booking.id.slice(0, 12)}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge
                className={`font-semibold px-4 py-2 rounded-full ${
                  booking.booking_type === "Rent"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : booking.booking_type === "Flexi Hire"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : booking.booking_type === "PCO Hire"
                        ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                } border`}
              >
                {booking.booking_type}
              </Badge>
              <Badge
                className={`font-semibold px-4 py-2 rounded-full border ${
                  booking.status?.toLowerCase() === "confirmed"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : booking.status?.toLowerCase() === "pending"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : booking.status?.toLowerCase() === "cancelled"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                }`}
              >
                {booking.status}
              </Badge>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-red-400" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="liquid-glass rounded-2xl p-4">
                <p className="text-sm text-white/60 mb-1">Name</p>
                <p className="font-semibold">{booking.customer_name}</p>
              </div>
              <div className="liquid-glass rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/60 mb-1">Email</p>
                    <p className="font-semibold truncate">{booking.customer_email}</p>
                  </div>
                </div>
              </div>
              <div className="liquid-glass rounded-2xl p-4 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-sm text-white/60 mb-1">Phone</p>
                    <p className="font-semibold">{booking.customer_phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Journey Details */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-red-400" />
              Journey Details
            </h3>
            <div className="space-y-4">
              <div className="liquid-glass rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
                <BookingProgressCircle pickupDate={booking.pickup_date} dropoffDate={booking.dropoff_date} />
                <div className="text-center">
                  <p className="text-sm text-white/60 mb-2">Contract ends on</p>
                  <p className="text-xl font-bold text-white">{formatDate(booking.dropoff_date)}</p>
                </div>
                <BookingCountdown
                  pickupDate={booking.pickup_date}
                  dropoffDate={booking.dropoff_date}
                  status={booking.status}
                />
              </div>

              <div className="liquid-glass rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/60 mb-1">Pickup Location</p>
                    <p className="font-semibold">{booking.pickup_location}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.pickup_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{booking.pickup_time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="liquid-glass rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white/60 mb-1">Dropoff Location</p>
                    <p className="font-semibold">{booking.dropoff_location}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.dropoff_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{booking.dropoff_time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pickup Verification Section */}
          {booking.pickupVerifiedAt && booking.verificationPhotos && booking.verificationPhotos.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                Pickup Verification – Completed ✓
              </h3>
              <div className="liquid-glass rounded-2xl p-4">
                <p className="text-sm text-white/60 mb-4">
                  Verified by agent on{" "}
                  {new Date(booking.pickupVerifiedAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {booking.verificationPhotos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-xs text-white/60 text-center px-2">{photo.type.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-400" />
              Payment Information
            </h3>
            <div className="liquid-glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(booking.total_amount)}</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-4 py-2 rounded-full border text-lg">
                  Paid
                </Badge>
              </div>
            </div>
          </div>

          {/* Booking Date */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-sm text-white/60">Booked on {formatDate(booking.created_at)}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full font-semibold py-6"
            >
              Close
            </Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold py-6 shadow-lg shadow-red-500/30">
              Download Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
