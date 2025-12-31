"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CarImageCarouselProps {
  images: string[]
  carName: string
}

export function CarImageCarousel({ images, carName }: CarImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-lg bg-muted">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No images available</p>
        </div>
      </div>
    )
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && images.length > 1) {
      goToNext()
    }
    if (isRightSwipe && images.length > 1) {
      goToPrevious()
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  return (
    <div
      className="relative aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-lg bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Image
        src={images[currentIndex] || "/placeholder.svg"}
        alt={`${carName} - Image ${currentIndex + 1}`}
        fill
        className="object-cover"
        priority={currentIndex === 0}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8 text-white" strokeWidth={2.5} />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8 text-white" strokeWidth={2.5} />
          </button>

          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-black/70 backdrop-blur-sm rounded-md px-3 py-1.5 text-sm font-medium text-white z-10">
            {currentIndex + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  )
}
