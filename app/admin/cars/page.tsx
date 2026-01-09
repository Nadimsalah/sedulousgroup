"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Edit, Trash2, Eye, Star, Plus, CarIcon, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { getCarsAction, deleteCarAction, type Car } from "@/app/actions/database"

const ITEMS_PER_PAGE = 12

export default function CarsManagementPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [cars, setCars] = useState<Car[]>([])
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  useEffect(() => {
    loadCars()
  }, [])

  const loadCars = async () => {
    setIsLoading(true)
    try {
      const fetchedCars = await getCarsAction()
      const rentCars = fetchedCars.filter((car) => !car.rentalType || car.rentalType === "Rent")
      setCars(rentCars)
      const loadingStates: Record<string, boolean> = {}
      rentCars.forEach((car) => {
        loadingStates[car.id] = true
      })
      setImageLoadingStates(loadingStates)
    } catch (error) {
      console.error("[v0] Error loading cars:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchQuery, selectedCategory])

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE)
  }, [])

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.brand.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || car.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Lazy loading
  const displayedCars = filteredCars.slice(0, displayCount)
  const hasMore = displayedCars.length < filteredCars.length

  const handleDelete = async (carId: string) => {
    if (window.confirm("Are you sure you want to delete this car? This action cannot be undone.")) {
      try {
        const success = await deleteCarAction(carId)

        if (success) {
          await loadCars()
          alert("Car deleted successfully!")
        } else {
          alert("Failed to delete car. Check console for details.")
        }
      } catch (error) {
        console.error("[v0] Error in handleDelete:", error)
        alert(`Error deleting car: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="liquid-glass rounded-2xl overflow-hidden border-white/10">
              <div className="aspect-[16/10] bg-white/5 animate-pulse" />
              <div className="p-5">
                <div className="h-6 bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-4 bg-white/10 rounded animate-pulse w-2/3 mb-4" />
                <div className="h-8 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Car Management</h1>
          <p className="text-white/60 mt-1">Manage your rental car fleet - {cars.length} cars</p>
        </div>
        <Link href="/admin/cars/add">
          <Button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold text-sm">
            <Plus className="h-5 w-5" />
            <span>Add New Car</span>
          </Button>
        </Link>
      </div>

      {cars.length > 0 && (
        <div className="liquid-glass rounded-2xl border-white/10 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <Input
                type="text"
                placeholder="Search by car name or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {["All", "Economy", "Premium", "Luxury"].map((category) => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={
                    selectedCategory === category
                      ? "bg-red-500 hover:bg-red-600 text-white whitespace-nowrap"
                      : "whitespace-nowrap text-white hover:text-white border-white/20 hover:bg-white/10"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {cars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="liquid-glass-enhanced rounded-3xl border-white/20 p-12 max-w-lg w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-red-500/10 p-6 rounded-full">
                <CarIcon className="h-16 w-16 text-red-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Cars Yet</h2>
            <p className="text-white/60 mb-8">
              Start building your rental fleet by adding your first car. Create listings with photos, pricing, and
              specifications.
            </p>
            <Link href="/admin/cars/add">
              <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 rounded-xl flex items-center gap-2 font-semibold mx-auto">
                <Plus className="h-5 w-5" />
                Add Your First Car
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCars.map((car) => (
              <div
                key={car.id}
                className="liquid-glass rounded-2xl border-white/10 overflow-hidden hover:border-red-500/50 transition-all duration-300"
              >
                <div className="relative aspect-[16/10] bg-white/5">
                  {imageLoadingStates[car.id] && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
                  )}
                  <Image
                    src={car.image || "/placeholder.svg"}
                    alt={car.name}
                    fill
                    className="object-cover"
                    onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [car.id]: false }))}
                  />
                  <Badge className="absolute top-4 right-4 bg-white/90 text-black">{car.category}</Badge>
                  <Badge className="absolute top-4 left-4 bg-green-500 text-white">{car.status}</Badge>
                </div>

                <div className="p-5">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-white mb-1">{car.name}</h3>
                    <p className="text-sm text-white/60">
                      {car.brand} • {car.year}
                    </p>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-white">{car.rating}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">£{car.pricePerDay}</div>
                      <div className="text-xs text-white/60">per day</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-white/80">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">👥</span>
                      <span className="font-medium">{car.passengers} Passengers</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">💼</span>
                      <span className="font-medium">{car.luggage} Luggage</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">⚙️</span>
                      <span className="font-medium">{car.transmission}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">⛽</span>
                      <span className="font-medium">{car.fuelType}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a href={`/car/${car.id}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-white/70 hover:text-white border-white/20 hover:bg-white/10 bg-transparent"
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        <span className="font-medium">View</span>
                      </Button>
                    </a>
                    <Link href={`/admin/cars/${car.id}/edit`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-white/70 hover:text-white border-white/20 hover:bg-white/10 bg-transparent"
                      >
                        <Edit className="h-4 w-4 mr-1.5" />
                        <span className="font-medium">Edit</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(car.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCars.length === 0 && cars.length > 0 && (
            <div className="text-center py-12 liquid-glass rounded-2xl border-white/10">
              <Search className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/80 text-lg font-semibold mb-2">No cars found</p>
              <p className="text-white/60">Try adjusting your search or filter criteria</p>
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="col-span-full pt-4">
              <Button
                onClick={handleLoadMore}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Load More ({filteredCars.length - displayedCars.length} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
