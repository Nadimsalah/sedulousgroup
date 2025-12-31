"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Search,
  Edit,
  Eye,
  CarIcon,
  Home,
  FileText,
  LogOut,
  Menu,
  Bell,
  User,
  AlertCircle,
  FileCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("rent")
  const pathname = usePathname()

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

  const Sidebar = () => (
    <>
      <div className="p-6 border-b border-neutral-800">
        <Image src="/images/dna-group-logo.png" alt="Sedulous Logo" width={140} height={40} className="h-10 w-auto" />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4">MENU</p>

          <Link
            href="/admin"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              pathname === "/admin"
                ? "bg-red-500 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/admin/vehicles"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              pathname === "/admin/vehicles"
                ? "bg-red-500 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <CarIcon className="h-5 w-5" />
            <span>Vehicles</span>
          </Link>

          <Link
            href="/admin/requests"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              pathname === "/admin/requests"
                ? "bg-red-500 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Bookings</span>
          </Link>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-800">
        <button
          onClick={() => (window.location.href = "/admin/login")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-[#0f0f0f] border-r border-neutral-800">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="hidden lg:flex w-64 bg-[#0f0f0f] border-r border-neutral-800 flex-col fixed left-0 top-0 h-full z-40">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col lg:ml-64">
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 fixed top-0 right-0 left-0 lg:left-64 z-30">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="lg:hidden text-gray-900" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Vehicles Management</h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">Sami Hamdan</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 lg:p-6 overflow-auto mt-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicles Management</h1>
              <p className="text-gray-600">Manage all vehicles across rental categories</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{filterVehiclesByType("Rent").length}</div>
                <div className="text-sm text-gray-600">Rent Vehicles</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{filterVehiclesByType("Flexi Hire").length}</div>
                <div className="text-sm text-gray-600">Flexi Hire</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{filterVehiclesByType("PCO Hire").length}</div>
                <div className="text-sm text-gray-600">PCO Hire</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{filterVehiclesByType("Sales").length}</div>
                <div className="text-sm text-gray-600">For Sale</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search vehicles by name or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="rent">Rent</TabsTrigger>
                <TabsTrigger value="flexi">Flexi Hire</TabsTrigger>
                <TabsTrigger value="pco">PCO Hire</TabsTrigger>
                <TabsTrigger value="buy">Buy</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {filteredVehicles.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl">
                    <CarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-semibold mb-2">No vehicles found</p>
                    <p className="text-gray-400">Try adjusting your search criteria</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
                      >
                        <div className="relative aspect-[16/10] bg-gray-100">
                          <Image
                            src={vehicle.image || "/placeholder.svg"}
                            alt={vehicle.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-3 right-3">
                            <Badge
                              variant={vehicle.currentRenter ? "destructive" : "default"}
                              className="bg-white/90 backdrop-blur-sm text-gray-900"
                            >
                              {vehicle.currentRenter ? "On Rent" : "Available"}
                            </Badge>
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="mb-3">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{vehicle.name}</h3>
                            <p className="text-sm text-gray-500">
                              {vehicle.brand} • {vehicle.year}
                            </p>
                          </div>

                          {vehicle.currentRenter && (
                            <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-100">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-semibold text-red-900">Current Renter</span>
                              </div>
                              <p className="text-sm text-red-700">{vehicle.currentRenter}</p>
                              {vehicle.currentAgreement && (
                                <p className="text-xs text-red-600 mt-1">Agreement: {vehicle.currentAgreement}</p>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <FileCheck className="h-4 w-4 text-blue-500" />
                              <span className="text-gray-700">{vehicle.inspectionCount || 0} Inspections</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                              <span className="text-gray-700">{vehicle.damageCount || 0} Damages</span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="text-2xl font-bold text-gray-900">£{vehicle.pricePerDay}</div>
                            <div className="text-xs text-gray-500">per day</div>
                          </div>

                          <div className="flex gap-2">
                            <Link href={`/car/${vehicle.id}`} target="_blank" className="flex-1">
                              <Button variant="outline" size="sm" className="w-full bg-transparent">
                                <Eye className="h-4 w-4 mr-1.5" />
                                View
                              </Button>
                            </Link>
                            <Link
                              href={`/admin/${activeTab === "rent" ? "cars" : activeTab === "flexi" ? "flexi-hire" : activeTab === "pco" ? "pco-hire" : "sales"}/${vehicle.id}/edit`}
                              className="flex-1"
                            >
                              <Button variant="outline" size="sm" className="w-full bg-transparent">
                                <Edit className="h-4 w-4 mr-1.5" />
                                Edit
                              </Button>
                            </Link>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2 text-xs">
                            <Link
                              href={`/admin/inspections?vehicle=${vehicle.id}`}
                              className="flex-1 text-center py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
                            >
                              History
                            </Link>
                            <Link
                              href={`/admin/agreements?vehicle=${vehicle.id}`}
                              className="flex-1 text-center py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
                            >
                              Agreements
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
