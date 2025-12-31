"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface CarImageCarouselProps {
  images: string[]
  carName: string
}

export function CarImageCarouselNew({ images, carName }: CarImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious()
      if (e.key === "ArrowRight") goToNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, images.length])

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full aspect-[4/3] bg-muted rounded-2xl flex items-center justify-center">
        <p className="text-muted-foreground">No images available</p>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Main Image Container */}
      <div
        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/5"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Current Image */}
        <Image
          src={images[currentIndex] || "/placeholder.svg"}
          alt={`${carName} - Image ${currentIndex + 1}`}
          fill
          className="object-cover"
          priority={currentIndex === 0}
        />

        {/* Navigation Buttons - Desktop */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors z-10 hidden sm:flex"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors z-10 hidden sm:flex"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border text-sm font-medium z-10">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Dots Indicators */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all ${
                index === currentIndex
                  ? "w-8 h-2 bg-primary rounded-full"
                  : "w-2 h-2 bg-muted-foreground/30 rounded-full hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail Strip - Mobile */}
      {images.length > 1 && images.length <= 6 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 sm:hidden">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={image || "/placeholder.svg"} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
