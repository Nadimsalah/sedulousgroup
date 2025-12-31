"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Users, Briefcase, Fuel, Settings, Star, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CarStories } from "@/components/car-stories"
import { createClient } from "@/lib/supabase/client"

export function CarListings() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [selectedRentalType, setSelectedRentalType] = useState<string>("Rent")
  const [cars, setCars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({})
  const [displayCount, setDisplayCount] = useState(6)
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({})

  useEffect(() => {
    let isMounted = true

    async function loadCars() {
      try {
        const supabase = createClient()

        if (!supabase) {
          console.warn("[v0] Supabase client not available")
          if (isMounted) setLoading(false)
          return
        }

        const { data: carsData, error } = await supabase
          .from("cars")
          .select("*")
          .order("created_at", { ascending: false })

        if (!isMounted) return

        if (!error && carsData) {
          console.log("[v0] Loaded cars from Supabase:", carsData.length)

          const { data: imagesData } = await supabase
            .from("car_images")
            .select("*")
            .order("display_order", { ascending: true })

          if (!isMounted) return

          const formattedCars = carsData.map((car: any) => {
            const carImages = imagesData?.filter((img) => img.car_id === car.id) || []
            const images =
              carImages.length > 0
                ? carImages.map((img) => img.image_url)
                : car.image
                  ? [car.image]
                  : ["/placeholder.svg"]

            return {
              id: car.id,
              name: car.name || `${car.brand || "Unknown"} Vehicle`,
              images,
              pricePerDay: car.price || 0,
              category: car.category || "Economy",
              rating: car.rating || 4.5,
              passengers: car.passengers || 5,
              luggage: car.luggage || 2,
              transmission: car.transmission || "Automatic",
              fuelType: car.fuel_type || "Petrol",
              rentalType: car.rental_type || "Rent",
              safetyFeatures: car.features?.safety || [],
            }
          })
          setCars(formattedCars)

          const indexes: Record<string, number> = {}
          const loadingStates: Record<string, boolean> = {}
          formattedCars.forEach((car) => {
            indexes[car.id] = 0
            loadingStates[car.id] = true
          })
          setCurrentImageIndexes(indexes)
          setImageLoadingStates(loadingStates)
        } else {
          console.error("[v0] Error loading cars:", error)
        }
      } catch (error) {
        console.error("[v0] Error in loadCars:", error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadCars()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const handleRentalTypeChange = (event: CustomEvent<string>) => {
      setSelectedRentalType(event.detail)
    }

    window.addEventListener("rentalTypeChange", handleRentalTypeChange as EventListener)

    return () => {
      window.removeEventListener("rentalTypeChange", handleRentalTypeChange as EventListener)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const typeParam = params.get("type")
      if (
        typeParam &&
        (typeParam === "Rent" || typeParam === "Flexi Hire" || typeParam === "PCO Hire" || typeParam === "Sales")
      ) {
        setSelectedRentalType(typeParam)
      }
    }
  }, [])

  useEffect(() => {
    setDisplayCount(6)
  }, [selectedCategory, selectedRentalType])

  const handlePrevImage = (e: React.MouseEvent, carId: string, imagesLength: number) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndexes((prev) => ({
      ...prev,
      [carId]: (prev[carId] - 1 + imagesLength) % imagesLength,
    }))
  }

  const handleNextImage = (e: React.MouseEvent, carId: string, imagesLength: number) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndexes((prev) => ({
      ...prev,
      [carId]: (prev[carId] + 1) % imagesLength,
    }))
  }

  const filteredCars = cars.filter((car) => {
    const categoryMatch = selectedCategory === "All" || car.category === selectedCategory
    const carRentalType = car.rentalType || "Rent"
    const rentalTypeMatch = selectedRentalType === "All" || carRentalType === selectedRentalType
    return categoryMatch && rentalTypeMatch
  })

  const displayedCars = filteredCars.slice(0, displayCount)
  const hasMoreCars = filteredCars.length > displayCount

  if (loading) {
    return (
      <section id="cars" className="container mx-auto px-4 py-20 sm:py-24">
        <div className="mb-12 text-center">
          <Badge className="mb-4 border-red-500/30 bg-red-500/10 text-red-400">Premium Selection</Badge>
          <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">Our Fleet</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">Loading available vehicles...</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="liquid-glass rounded-3xl border border-white/10 overflow-hidden">
              <div className="aspect-[16/10] bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
              <div className="p-6 space-y-4">
                <div className="h-6 bg-white/10 rounded animate-pulse" />
                <div className="h-4 bg-white/5 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (cars.length === 0) {
    return (
      <section id="cars" className="container mx-auto px-4 py-20 sm:py-24">
        <div className="mb-12 text-center">
          <Badge className="mb-4 border-red-500/30 bg-red-500/10 text-red-400">Premium Selection</Badge>
          <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">Our Fleet</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">No vehicles available at the moment</p>
        </div>
        <div className="text-center py-12">
          <p className="text-neutral-400 mb-4">Please add vehicles from the admin panel</p>
          <Link href="/admin/cars/add">
            <Button className="rounded-full bg-red-500 text-white hover:bg-red-600 px-6">Add Your First Vehicle</Button>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section id="cars" className="container mx-auto px-4 py-20 sm:py-24">
      <div className="mb-12 text-center">
        <Badge className="mb-4 border-red-500/30 bg-red-500/10 text-red-400">Premium Selection</Badge>
        <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">Our Fleet</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">Discover the perfect vehicle for your journey</p>
      </div>

      <div className="mb-6 flex justify-center">
        <div className="flex gap-2 pb-2 overflow-x-auto hide-scrollbar">
          {["All", "Rent", "Flexi Hire", "PCO Hire", "Sales"].map((type) => (
            <Button
              key={type}
              onClick={() => setSelectedRentalType(type)}
              variant={selectedRentalType === type ? "default" : "outline"}
              className={`flex-shrink-0 whitespace-nowrap ${
                selectedRentalType === type
                  ? "rounded-full bg-red-500 text-white hover:bg-red-600 px-6 font-semibold"
                  : "rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white px-6"
              }`}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-12 flex justify-center">
        <div className="flex gap-2 pb-2 overflow-x-auto hide-scrollbar">
          {["All", "Economy", "Premium", "Luxury"].map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`flex-shrink-0 whitespace-nowrap ${
                selectedCategory === category
                  ? "rounded-full bg-red-500 text-white hover:bg-red-600 px-6"
                  : "rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white px-6"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <CarStories rentalType={selectedRentalType === "All" ? undefined : (selectedRentalType as any)} />

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {displayedCars.map((car) => {
          const currentIndex = currentImageIndexes[car.id] || 0
          const currentImage = car.images[currentIndex]
          const hasMultipleImages = car.images.length > 1

          return (
            <Link
              key={car.id}
              href={`/car/${car.id}`}
              className="group liquid-glass relative overflow-hidden rounded-3xl border border-white/10 transition-all duration-300 hover:border-red-500/30 hover:shadow-xl hover:shadow-red-500/10"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
                {imageLoadingStates[car.id] && (
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
                )}
                {currentImage && currentImage !== "/placeholder.svg" ? (
                  <Image
                    src={currentImage || "/placeholder.svg"}
                    alt={`${car.name} - Image ${currentIndex + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [car.id]: false }))}
                    onError={() => setImageLoadingStates((prev) => ({ ...prev, [car.id]: false }))}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                    <span className="text-neutral-600 text-sm">No image available</span>
                  </div>
                )}

                <Badge className="absolute right-4 top-4 border-red-500/30 bg-red-500/20 backdrop-blur-sm text-red-300 text-xs px-3 py-1 z-10">
                  {car.category}
                </Badge>
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-sm px-3 py-1.5 z-10">
                  <Star className="h-3.5 w-3.5 fill-red-400 text-red-400" />
                  <span className="text-sm font-semibold text-white">{car.rating}</span>
                </div>

                {hasMultipleImages && (
                  <>
                    <button
                      onClick={(e) => handlePrevImage(e, car.id, car.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/80"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => handleNextImage(e, car.id, car.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/80"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 px-2.5 py-1 text-xs font-medium text-white">
                      {currentIndex + 1}/{car.images.length}
                    </div>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                      {car.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setCurrentImageIndexes((prev) => ({ ...prev, [car.id]: index }))
                          }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            index === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{car.name}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {car.safetyFeatures &&
                        Array.isArray(car.safetyFeatures) &&
                        car.safetyFeatures.slice(0, 2).map((feature) => (
                          <span key={feature} className="text-xs text-neutral-400">
                            {feature}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">£{car.pricePerDay}</div>
                    <div className="text-xs text-neutral-500">
                      {car.rentalType === "Flexi Hire" || car.rentalType === "PCO Hire" ? "per month" : "per day"}
                    </div>
                  </div>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                      <Users className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Passengers</div>
                      <div className="text-sm font-semibold text-white">{car.passengers}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                      <Briefcase className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Luggage</div>
                      <div className="text-sm font-semibold text-white">{car.luggage}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                      <Settings className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Transmission</div>
                      <div className="text-sm font-semibold text-white">{car.transmission}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                      <Fuel className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Fuel</div>
                      <div className="text-sm font-semibold text-white">{car.fuelType}</div>
                    </div>
                  </div>
                </div>

                <Button className="group/btn w-full rounded-full bg-red-500 text-white hover:bg-red-600 h-12 text-base font-semibold transition-all duration-300">
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </Link>
          )
        })}
      </div>

      {hasMoreCars && (
        <div className="mt-12 flex justify-center">
          <Button
            onClick={() => setDisplayCount((prev) => prev + 6)}
            className="rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/30 px-6 py-2 h-auto text-sm font-medium shadow-lg transition-all duration-300"
          >
            Show More Cars ({filteredCars.length - displayedCars.length} remaining)
          </Button>
        </div>
      )}
    </section>
  )
}
