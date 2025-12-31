'use client'

import { useState, useEffect } from 'react'
import { BookingDetailsModal } from '@/components/booking-details-modal'
import { Button } from '@/components/ui/button'
import type { BookingType } from '@/lib/booking-rules'

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
  updated_at: string
}

interface BookingsClientProps {
  bookings: Booking[]
}

export function BookingsClient({ bookings }: BookingsClientProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Add View Details buttons dynamically
    const handleViewDetails = (bookingId: string) => {
      const booking = bookings.find(b => b.id === bookingId)
      if (booking) {
        setSelectedBooking(booking)
        setIsModalOpen(true)
      }
    }

    // Find all booking cards and add click handlers
    const bookingCards = document.querySelectorAll('[data-booking-id]')
    bookingCards.forEach(card => {
      const bookingId = card.getAttribute('data-booking-id')
      const viewButton = card.querySelector('[data-view-details]')
      if (viewButton && bookingId) {
        viewButton.addEventListener('click', () => handleViewDetails(bookingId))
      }
    })

    return () => {
      bookingCards.forEach(card => {
        const viewButton = card.querySelector('[data-view-details]')
        if (viewButton) {
          viewButton.removeEventListener('click', () => {})
        }
      })
    }
  }, [bookings])

  return (
    <>
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedBooking(null)
        }}
      />
      
      {/* Hidden buttons that will be rendered inline */}
      <div className="hidden">
        {bookings.map((booking) => (
          <Button
            key={booking.id}
            data-booking-button={booking.id}
            onClick={() => {
              setSelectedBooking(booking)
              setIsModalOpen(true)
            }}
          >
            View Details
          </Button>
        ))}
      </div>
      
      {/* Inject buttons into the DOM */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const bookings = ${JSON.stringify(bookings.map(b => ({ id: b.id })))};
              bookings.forEach(booking => {
                const card = document.querySelector('[data-booking-id="' + booking.id + '"]');
                if (card) {
                  const button = document.querySelector('[data-booking-button="' + booking.id + '"]');
                  const target = card.querySelector('[data-view-details]');
                  if (button && target) {
                    target.replaceWith(button.cloneNode(true));
                  }
                }
              });
            })();
          `,
        }}
      />
    </>
  )
}
