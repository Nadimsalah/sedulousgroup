"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Users,
  Briefcase,
  Fuel,
  Settings,
  Star,
  ArrowRight,
  Calendar,
  MapPin,
  Filter,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CarStories } from "./car-stories"
import { getCarsAction } from "@/app/actions/database"
import type { Car } from "@/lib/database"

export function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [selectedRentalType, setSelectedRentalType] = useState<string>("All")
  const [sortBy, setSortBy] = useState<string>("recommended")
  const [pickupLocation, setPickupLocation] = useState("")
  const [pickupDate, setPickupDate] = useState("")
  const [returnDate, setReturnDate] = useState("")

  useEffect(() => {
    const loadCars = async () => {
      try {
        setLoading(true)
        const allCars = await getCarsAction()
        setCars(allCars.filter((car) => car.status === "Published"))
      } catch (error) {
        console.error("Error loading cars:", error)
      } finally {
        setLoading(false)
      }
    }
    loadCars()
  }, [])

  useEffect(() => {
    setPickupLocation(searchParams.get("location") || "")
    setPickupDate(searchParams.get("pickup") || "")
    setReturnDate(searchParams.get("return") || "")
    const typeParam = searchParams.get("type")
    if (typeParam) {
      setSelectedRentalType(typeParam)
    }
  }, [searchParams])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (pickupLocation) params.set("location", pickupLocation)
    if (pickupDate) params.set("pickup", pickupDate)
    if (returnDate) params.set("return", returnDate)
    if (selectedRentalType !== "All") params.set("type", selectedRentalType)
    router.push(`/search?${params.toString()}`)
  }

  let filteredCars = cars.filter((car) => {
    const categoryMatch = selectedCategory === "All" || car.category === selectedCategory
    const carRentalType = car.rentalType || "Rent"
    const rentalTypeMatch = selectedRentalType === "All" || carRentalType === selectedRentalType
    return categoryMatch && rentalTypeMatch
  })

  // Apply sorting
  if (sortBy === "price-low") {
    filteredCars = [...filteredCars].sort((a, b) => a.pricePerDay - b.pricePerDay)
  } else if (sortBy === "price-high") {
    filteredCars = [...filteredCars].sort((a, b) => b.pricePerDay - a.pricePerDay)
  } else if (sortBy === "rating") {
    filteredCars = [...filteredCars].sort((a, b) => b.rating - a.rating)
  }

  const totalCars = filteredCars.length

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
        <p className="mt-4 text-white/70">Loading vehicles...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="relative mx-auto max-w-7xl mb-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-red-600/20 to-red-500/20 blur-2xl opacity-50" />

        <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl shadow-2xl shadow-black/40 p-4">
          <div className="flex flex-col lg:flex-row items-stretch gap-2">
            {/* Location */}
            <div className="flex-1 min-w-0">
              <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
                <MapPin className="inline h-2.5 w-2.5 mr-1" />
                Pickup Location
              </label>
              <input
                type="text"
                placeholder="City or Airport"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white placeholder:text-white/50 font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 transition-all hover:bg-white/15"
              />
            </div>

            {/* Pickup Date */}
            <div className="flex-1 min-w-0">
              <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
                <Calendar className="inline h-2.5 w-2.5 mr-1" />
                Pickup Date
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 cursor-pointer [color-scheme:dark] transition-all hover:bg-white/15 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(248 113 113)'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.25em 1.25em",
                }}
              />
            </div>

            {/* Return Date */}
            <div className="flex-1 min-w-0">
              <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
                <Calendar className="inline h-2.5 w-2.5 mr-1" />
                Return Date
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={pickupDate || new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 cursor-pointer [color-scheme:dark] transition-all hover:bg-white/15 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(248 113 113)'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.25em 1.25em",
                }}
              />
            </div>

            {/* Update Search Button */}
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 whitespace-nowrap"
              >
                Update Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Available Vehicles
              {selectedRentalType !== "All" && <span className="ml-2 text-red-400">({selectedRentalType})</span>}
            </h1>
            <p className="mt-2 text-neutral-400">
              {totalCars} {totalCars === 1 ? "vehicle" : "vehicles"} found
              {pickupLocation && ` in ${pickupLocation}`}
            </p>
          </div>

          {/* Sort & Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] border-white/10 bg-black/40 pl-10 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/90 text-white">
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Rental Type Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["All", "Rent", "Flexi Hire"].map((type) => (
          <Button
            key={type}
            onClick={() => setSelectedRentalType(type)}
            variant={selectedRentalType === type ? "default" : "outline"}
            className={
              selectedRentalType === type
                ? "rounded-full bg-red-500 text-white hover:bg-red-600 px-6 font-semibold"
                : "rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white px-6"
            }
          >
            {type}
          </Button>
        ))}
      </div>

      {/* Category Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {["All", "Economy", "Premium", "Luxury"].map((category) => (
          <Button
            key={category}
            onClick={() => setSelectedCategory(category)}
            variant={selectedCategory === category ? "default" : "outline"}
            className={
              selectedCategory === category
                ? "rounded-full bg-red-500 text-white hover:bg-red-600 px-6"
                : "rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white px-6"
            }
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Instagram-style stories below category filters */}
      <CarStories />

      {/* Car Grid */}
      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredCars.map((car) => (
          <Link href={`/car/${car.id}`} key={car.id}>
            <div className="group liquid-glass relative overflow-hidden rounded-3xl border border-white/10 transition-all duration-300 hover:border-red-500/30 hover:shadow-xl hover:shadow-red-500/10">
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
                <Image
                  src={car.image || "/placeholder.svg"}
                  alt={car.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
                <Badge className="absolute right-4 top-4 border-red-500/30 bg-red-500/20 backdrop-blur-sm text-red-300 text-xs px-3 py-1 z-10">
                  {car.category}
                </Badge>
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-sm px-3 py-1.5 z-10">
                  <Star className="h-3.5 w-3.5 fill-red-400 text-red-400" />
                  <span className="text-sm font-semibold text-white">{car.rating}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{car.name}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {car.features?.slice(0, 2).map((feature) => (
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
            </div>
          </Link>
        ))}
      </div>

      {filteredCars.length === 0 && (
        <div className="py-20 text-center">
          <div className="mx-auto max-w-md">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-500/10 p-4">
                <Filter className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No vehicles found</h3>
            <p className="text-neutral-400 mb-6">Try adjusting your filters or search criteria</p>
            <Button
              onClick={() => setSelectedCategory("All")}
              className="rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
