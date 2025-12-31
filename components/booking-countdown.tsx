'use client'

import { useState, useEffect } from 'react'
import { differenceInDays, differenceInMonths, addMonths, parseISO, isPast, isToday, format } from 'date-fns'
import { Clock, AlertTriangle, Calendar } from 'lucide-react'

interface BookingCountdownProps {
  pickupDate: string
  dropoffDate: string
  status: string
}

export function BookingCountdown({ pickupDate, dropoffDate, status }: BookingCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const [isEndingToday, setIsEndingToday] = useState(false)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      try {
        const now = new Date('2025-11-18') // Current date: 18 November 2025
        const pickup = parseISO(pickupDate)
        const dropoff = parseISO(dropoffDate)
        
        // Check if booking has ended
        if (isPast(dropoff) && !isToday(dropoff)) {
          const rentalDays = differenceInDays(dropoff, pickup) + 1
          const formattedPickup = format(pickup, 'd MMM yyyy')
          const formattedDropoff = format(dropoff, 'd MMM yyyy')
          setTimeRemaining(`Rental period: ${formattedPickup} - ${formattedDropoff} (${rentalDays} day${rentalDays !== 1 ? 's' : ''})`)
          setIsEnded(true)
          setIsUrgent(false)
          setIsEndingToday(false)
          return
        }
        
        // Check if ending today
        if (isToday(dropoff)) {
          setTimeRemaining('Ends today')
          setIsEndingToday(true)
          setIsUrgent(true)
          setIsEnded(false)
          return
        }
        
        // Calculate future time remaining
        const totalDays = differenceInDays(dropoff, now)
        
        // Check if less than 7 days
        if (totalDays < 7 && totalDays > 0) {
          setIsUrgent(true)
        } else {
          setIsUrgent(false)
        }
        
        setIsEnded(false)
        setIsEndingToday(false)
        
        // Calculate months and remaining days
        const months = differenceInMonths(dropoff, now)
        const afterMonths = addMonths(now, months)
        const days = differenceInDays(dropoff, afterMonths)
        
        // Format the display
        if (months > 0 && days > 0) {
          setTimeRemaining(`${months} month${months !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''} remaining`)
        } else if (months > 0) {
          setTimeRemaining(`${months} month${months !== 1 ? 's' : ''} remaining`)
        } else if (days > 0) {
          setTimeRemaining(`${days} day${days !== 1 ? 's' : ''} remaining`)
        } else {
          setTimeRemaining('Ends today')
          setIsEndingToday(true)
        }
      } catch (error) {
        console.error('[v0] Error calculating countdown:', error)
        setTimeRemaining('')
      }
    }

    // Calculate immediately
    calculateTimeRemaining()
    
    // Update every second for live countdown
    const interval = setInterval(calculateTimeRemaining, 1000)
    
    return () => clearInterval(interval)
  }, [pickupDate, dropoffDate])

  if (!timeRemaining) return null

  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${
      isEnded ? 'text-white/40' :
      isEndingToday ? 'text-red-400 animate-pulse' :
      isUrgent ? 'text-red-400' :
      'text-emerald-400'
    }`}>
      {isEnded ? (
        <Calendar className="w-4 h-4" />
      ) : isUrgent && !isEnded ? (
        <AlertTriangle className={`w-4 h-4 ${isEndingToday ? 'animate-pulse' : 'animate-bounce'}`} />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      <span className={isEndingToday ? 'font-bold' : ''}>
        {timeRemaining}
      </span>
      {isUrgent && !isEnded && !isEndingToday && (
        <span className="text-xs px-2 py-0.5 bg-red-500/20 rounded-full border border-red-500/30 animate-pulse">
          Ending soon!
        </span>
      )}
    </div>
  )
}
