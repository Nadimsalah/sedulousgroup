'use client'

import { useEffect, useState } from 'react'
import { differenceInDays, parseISO } from 'date-fns'

interface BookingProgressCircleProps {
  pickupDate: string
  dropoffDate: string
}

export function BookingProgressCircle({ pickupDate, dropoffDate }: BookingProgressCircleProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    try {
      const now = new Date('2025-11-18') // Current date: 18 November 2025
      const pickup = parseISO(pickupDate)
      const dropoff = parseISO(dropoffDate)
      
      const totalDays = differenceInDays(dropoff, pickup)
      const elapsedDays = differenceInDays(now, pickup)
      
      const percentage = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100)
      setProgress(percentage)
    } catch (error) {
      console.error('[v0] Error calculating progress:', error)
      setProgress(0)
    }
  }, [pickupDate, dropoffDate])

  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-white/10"
        />
        {/* Progress circle */}
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ${
            progress >= 90 ? 'text-red-400' :
            progress >= 70 ? 'text-amber-400' :
            'text-emerald-400'
          }`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}
