"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface CarImageGalleryProps {
  images: string[]
  carName: string
}

export function CarImageGallery({ images, carName }: CarImageGalleryProps) {
  const [showLightbox, setShowLightbox] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/40 text-center">
            <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">No images available</p>
          </div>
        </div>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Mobile layout: Single large image with swipe
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return (
      <>
        <div className="relative">
          <div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl cursor-pointer group"
            onClick={() => setShowLightbox(true)}
          >
            <Image
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`${carName} - Image ${currentIndex + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />

            <div className="absolute bottom-4 right-4 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white">
              {currentIndex + 1} / {images.length}
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && images.length <= 6 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg ${
                    idx === currentIndex ? "ring-2 ring-red-500" : "opacity-60"
                  }`}
                >
                  <Image
                    src={img || "/placeholder.svg"}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {showLightbox && (
          <div className="fixed inset-0 z-50 bg-black">
            <div className="relative h-full w-full">
              <button
                onClick={() => setShowLightbox(false)}
                className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="absolute top-4 left-4 z-10 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-white">
                {currentIndex + 1} / {images.length}
              </div>

              <div className="relative h-full w-full flex items-center justify-center">
                <Image
                  src={images[currentIndex] || "/placeholder.svg"}
                  alt={`${carName} - Image ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  // Desktop layout: Airbnb-style grid
  if (images.length === 1) {
    return (
      <div
        className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl cursor-pointer group"
        onClick={() => setShowLightbox(true)}
      >
        <Image
          src={images[0] || "/placeholder.svg"}
          alt={carName}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 66vw"
        />
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <>
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-[4/3] cursor-pointer group overflow-hidden"
              onClick={() => {
                setCurrentIndex(idx)
                setShowLightbox(true)
              }}
            >
              <Image
                src={img || "/placeholder.svg"}
                alt={`${carName} - Image ${idx + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
        {renderLightbox()}
      </>
    )
  }

  // 3+ images: Airbnb grid layout
  return (
    <>
      <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden">
        <div
          className="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden"
          onClick={() => {
            setCurrentIndex(0)
            setShowLightbox(true)
          }}
        >
          <Image
            src={images[0] || "/placeholder.svg"}
            alt={`${carName} - Image 1`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 1024px) 50vw, 33vw"
          />
        </div>

        {images.slice(1, 5).map((img, idx) => (
          <div
            key={idx + 1}
            className="relative aspect-square cursor-pointer group overflow-hidden"
            onClick={() => {
              setCurrentIndex(idx + 1)
              setShowLightbox(true)
            }}
          >
            <Image
              src={img || "/placeholder.svg"}
              alt={`${carName} - Image ${idx + 2}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 1024px) 25vw, 16.5vw"
            />

            {idx === 3 && images.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-center text-white">
                  <div className="text-2xl font-bold">+{images.length - 5}</div>
                  <div className="text-sm">More photos</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {renderLightbox()}
    </>
  )

  function renderLightbox() {
    if (!showLightbox) return null

    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div className="relative h-full w-full">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 right-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute top-6 left-6 z-10 rounded-full bg-black/70 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white">
            {currentIndex + 1} / {images.length}
          </div>

          <div className="relative h-full w-full flex items-center justify-center p-12">
            <Image
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`${carName} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-3xl px-6 scrollbar-hide">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                  idx === currentIndex ? "ring-2 ring-white scale-110" : "opacity-50 hover:opacity-75"
                }`}
              >
                <Image
                  src={img || "/placeholder.svg"}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }
}
