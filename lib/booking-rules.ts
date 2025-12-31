// Booking type business rules constants
export const BOOKING_RULES = {
  'Flexi Hire': {
    minimumDays: 180,
    displayText: '6 months minimum',
  },
  'PCO Hire': {
    minimumDays: 30,
    displayText: '1 month minimum',
  },
  'Rent': {
    minimumDays: 1,
    displayText: '1 day',
  },
  'Sales': {
    minimumDays: 0,
    displayText: 'Purchase',
  },
} as const

export type BookingType = keyof typeof BOOKING_RULES

export function getDurationText(
  bookingType: BookingType,
  price: number
): string {
  const rule = BOOKING_RULES[bookingType]
  if (!rule) return `£${price.toFixed(2)}`
  
  return `£${price.toFixed(2)} ${rule.displayText}`
}

export function validateBookingDuration(
  bookingType: BookingType,
  days: number
): { valid: boolean; message?: string } {
  const rule = BOOKING_RULES[bookingType]
  if (!rule) return { valid: true }
  
  if (days < rule.minimumDays) {
    return {
      valid: false,
      message: `${bookingType} requires a minimum of ${rule.displayText}`,
    }
  }
  
  return { valid: true }
}
