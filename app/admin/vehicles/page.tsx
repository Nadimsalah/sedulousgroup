"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Edit,
  Eye,
  CarIcon,
  Plus,
  Filter,
  RefreshCw,
  User,
  AlertCircle,
  FileCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { getCarsAction, getBookingsAction, type Car } from "@/app/actions/database"
import { getAgreementsByVehicleId } from "@/app/actions/agreements"
import { getInspectionsByVehicleId } from "@/app/actions/inspections"

interface VehicleWithDetails extends Car {
  currentRenter?: string
  currentAgreement?: string
  inspectionCount?: number
  damageCount?: number
  nextMaintenance?: string
}

export default function VehiclesManagementPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("rent")

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    setIsLoading(true)
    try {
      const fetchedCars = await getCarsAction()
      const bookings = await getBookingsAction()

      // Enrich vehicles with additional details
      const enrichedVehicles = await Promise.all(
        fetchedCars.map(async (car) => {
          // Find current booking
          const currentBooking = bookings.find((b) => b.carId === car.id && b.status === "On Rent")

          // Get agreements for this vehicle
          const agreements = await getAgreementsByVehicleId(car.id)

          // Get inspections for this vehicle
          const inspections = await getInspectionsByVehicleId(car.id)

          return {
            ...car,
            currentRenter: currentBooking?.customerName,
            currentAgreement: agreements.find((a) => a.status === "signed")?.agreementNumber,
            inspectionCount: inspections.length,
            damageCount: inspections.filter((i) => i.damageNotes).length,
          } as VehicleWithDetails
        }),
      )

      setVehicles(enrichedVehicles)
    } catch (error) {
      console.error("[v0] Error loading vehicles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterVehiclesByType = (type: string) => {
    return vehicles.filter((v) => {
      const rentalType = v.rentalType || "Rent"
      if (type === "buy") return rentalType === "Sales"
      return rentalType === type
    })
  }

  const filteredVehicles = filterVehiclesByType(
    activeTab === "rent" ? "Rent" : activeTab === "flexi" ? "Flexi Hire" : activeTab === "pco" ? "PCO Hire" : "Sales",
  ).filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Vehicles Management</h1>
          <p className="text-gray-400 mt-1">Manage all vehicles across rental categories</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/cars/add">
            <Button className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </Link>
          <Button
            onClick={loadVehicles}
            variant="outline"
            className="bg-zinc-900 border-zinc-800 text-gray-300 hover:text-white hover:bg-zinc-800"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Rent Vehicles</p>
              <p className="text-2xl font-bold text-white">{filterVehiclesByType("Rent").length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CarIcon className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Flexi Hire</p>
              <p className="text-2xl font-bold text-white">{filterVehiclesByType("Flexi Hire").length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CarIcon className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">PCO Hire</p>
              <p className="text-2xl font-bold text-white">{filterVehiclesByType("PCO Hire").length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <CarIcon className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">For Sale</p>
              <p className="text-2xl font-bold text-white">{filterVehiclesByType("Sales").length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <CarIcon className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vehicles by name or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black border-zinc-700 text-white placeholder-gray-500 focus:ring-red-500/50"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-black border border-zinc-800">
              <TabsTrigger value="rent" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Rent</TabsTrigger>
              <TabsTrigger value="flexi" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Flexi</TabsTrigger>
              <TabsTrigger value="pco" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">PCO</TabsTrigger>
              <TabsTrigger value="buy" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Buy</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i: number) => (
              <div key={i} className="bg-zinc-900 rounded-xl border border-zinc-800 h-[400px] animate-pulse"></div>
            ))}
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
            <CarIcon className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-semibold mb-2">No vehicles found</p>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 hover:shadow-xl transition-all duration-300"
              >
                {/* Image Section */}
                <div className="relative aspect-[16/10] bg-zinc-950">
                  <Image
                    src={vehicle.image || "/placeholder.svg"}
                    alt={vehicle.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge
                      variant="outline"
                      className={`backdrop-blur-md border-0 ${vehicle.currentRenter
                        ? "bg-red-500/90 text-white"
                        : "bg-green-500/90 text-white"
                        }`}
                    >
                      {vehicle.currentRenter ? "On Rent" : "Available"}
                    </Badge>
                  </div>
                  {vehicle.registrationNumber && (
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className="bg-black/70 text-white border-zinc-700 backdrop-blur-md uppercase tracking-wider font-mono">
                        {vehicle.registrationNumber}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-1">{vehicle.name}</h3>
                    <p className="text-sm text-gray-400">
                      {vehicle.brand} • {vehicle.year}
                    </p>
                  </div>

                  {vehicle.currentRenter && (
                    <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-red-400" />
                        <span className="text-sm font-semibold text-red-200">Current Renter</span>
                      </div>
                      <p className="text-sm text-red-100/80">{vehicle.currentRenter}</p>
                      {vehicle.currentAgreement && (
                        <p className="text-xs text-red-400 mt-1">Ref: {vehicle.currentAgreement}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm bg-zinc-950 p-2 rounded border border-zinc-800">
                      <FileCheck className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-400">{vehicle.inspectionCount || 0} Insp.</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-zinc-950 p-2 rounded border border-zinc-800">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-400">{vehicle.damageCount || 0} dmg</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mb-4 pb-4 border-b border-zinc-800">
                    <div>
                      <div className="text-2xl font-bold text-white">£{vehicle.pricePerDay}</div>
                      <div className="text-xs text-gray-500">per day</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/car/${vehicle.id}`} target="_blank" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-transparent border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-800">
                        <Eye className="h-4 w-4 mr-1.5" />
                        View
                      </Button>
                    </Link>
                    <Link
                      href={`/admin/${activeTab === "rent" ? "cars" : activeTab === "flexi" ? "flexi-hire" : activeTab === "pco" ? "pco-hire" : "sales"}/${vehicle.id}/edit`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full bg-transparent border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-800">
                        <Edit className="h-4 w-4 mr-1.5" />
                        Edit
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-3 flex gap-2 text-xs">
                    <Link
                      href={`/admin/inspections?vehicle=${vehicle.id}`}
                      className="flex-1 text-center py-2 px-3 bg-zinc-950 rounded border border-zinc-800 hover:bg-zinc-800 transition-colors text-gray-400 hover:text-white"
                    >
                      History
                    </Link>
                    <Link
                      href={`/admin/agreements?vehicle=${vehicle.id}`}
                      className="flex-1 text-center py-2 px-3 bg-zinc-950 rounded border border-zinc-800 hover:bg-zinc-800 transition-colors text-gray-400 hover:text-white"
                    >
                      Agreements
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
