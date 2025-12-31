'use client'

import { useEffect } from 'react'
import { SiteHeader } from "@/components/site-header"
import { CarDetail } from "@/components/car-detail"
import { AnimatedGradient } from "@/components/animated-gradient"

export default function CarPage({ params }: { params: { id: string } }) {
  useEffect(() => {
    // Scroll to top multiple times to ensure it works
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    
    // Also do it after a tiny delay to catch any layout shifts
    setTimeout(() => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }, 0)
  }, [params.id])

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <AnimatedGradient />
      <SiteHeader />
      <CarDetail carId={params.id} />
    </div>
  )
}
