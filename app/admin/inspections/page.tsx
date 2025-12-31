"use client"

import { useState, useEffect } from "react"
import { Camera, Upload, X, CheckCircle, Clock, FileText, Car, Search, AlertCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllBookingsAction, type BookingWithDetails } from "@/app/actions/bookings"
import { getCarsAction } from "@/app/actions/database"
import { getAgreementsByBookingAction } from "@/app/actions/agreements"
import { createInspectionAction, getInspectionsByBookingAction } from "@/app/actions/inspections"
import { toast } from "sonner"
import Link from "next/link"

export default function InspectionsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [cars, setCars] = useState<any[]>([])
  const [inspections, setInspections] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "returning-today" | "no-handover" | "no-return" | "completed">("all")
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [showInspectionForm, setShowInspectionForm] = useState(false)

  const [inspectionType, setInspectionType] = useState<"handover" | "return">("handover")
  const [odometerReading, setOdometerReading] = useState("")
  const [fuelLevel, setFuelLevel] = useState<"full" | "3/4" | "1/2" | "1/4" | "empty">("full")
  const [overallCondition, setOverallCondition] = useState<"excellent" | "good" | "fair" | "poor">("excellent")
  const [damageNotes, setDamageNotes] = useState("")
  const [exteriorPhotos, setExteriorPhotos] = useState<string[]>([])
  const [interiorPhotos, setInteriorPhotos] = useState<string[]>([])
  const [damagePhotos, setDamagePhotos] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Fetch all bookings and cars
      const [bookingsResult, carsData] = await Promise.all([
        getAllBookingsAction(),
        getCarsAction(),
      ])

      // Filter for active bookings
      const activeBookings = (bookingsResult?.data || []).filter((b: BookingWithDetails) => {
        const status = (b.status || "").toLowerCase()
        return ["active", "approved", "confirmed", "on rent"].includes(status)
      })

      setBookings(activeBookings)
      setCars(carsData || [])

      // Load inspections for all active bookings
      const inspectionsData: Record<string, any[]> = {}
      for (const booking of activeBookings) {
        try {
          const bookingInspections = await getInspectionsByBookingAction(booking.id)
          inspectionsData[booking.id] = bookingInspections || []
        } catch (error) {
          console.error(`Error loading inspections for booking ${booking.id}:`, error)
          inspectionsData[booking.id] = []
        }
      }
      setInspections(inspectionsData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load inspections data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File, type: "exterior" | "interior" | "damage") => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/upload", { method: "POST", body: formData })
      if (!response.ok) throw new Error("Upload failed")
      const { url } = await response.json()

      if (type === "exterior") setExteriorPhotos([...exteriorPhotos, url])
      else if (type === "interior") setInteriorPhotos([...interiorPhotos, url])
      else setDamagePhotos([...damagePhotos, url])

      toast.success("Photo uploaded")
    } catch (error) {
      toast.error("Failed to upload")
    }
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!selectedBooking) {
      toast.error("No booking selected")
      return
    }

    if (!odometerReading || odometerReading.trim() === "") {
      toast.error("Please enter odometer reading")
      return
    }

    if (exteriorPhotos.length === 0) {
      toast.error("Please upload at least one exterior photo")
      return
    }

    if (interiorPhotos.length === 0) {
      toast.error("Please upload at least one interior photo")
      return
    }

    if (!selectedBooking.car_id) {
      toast.error("Booking is missing vehicle ID")
      return
    }

    setIsSubmitting(true)
    try {
      console.log("[Inspections] Fetching agreements for booking:", selectedBooking.id)
      const agreements = await getAgreementsByBookingAction(selectedBooking.id)
      console.log("[Inspections] Found agreements:", agreements.length)

      const agreement = agreements.find((a) => {
        const status = (a.status || "").toLowerCase()
        return ["signed", "active", "confirmed"].includes(status)
      })

      if (!agreement) {
        console.error("[Inspections] No signed agreement found. Available agreements:", agreements.map((a) => ({ id: a.id, status: a.status })))
        toast.error("No signed agreement found for this booking. Please ensure the agreement is signed first.")
        setIsSubmitting(false)
        return
      }

      console.log("[Inspections] Using agreement:", agreement.id, "Status:", agreement.status)

      console.log("[Inspections] Creating inspection with data:", {
        agreementId: agreement.id,
        bookingId: selectedBooking.id,
        vehicleId: selectedBooking.car_id,
        inspectionType,
        odometerReading: Number.parseInt(odometerReading),
        fuelLevel,
        exteriorPhotos: exteriorPhotos.length,
        interiorPhotos: interiorPhotos.length,
        damagePhotos: damagePhotos.length,
      })

      // Validate odometer reading
      const odometerValue = Number.parseInt(odometerReading)
      if (isNaN(odometerValue) || odometerValue < 0) {
        toast.error("Please enter a valid odometer reading")
        setIsSubmitting(false)
        return
      }

      const result = await createInspectionAction({
        agreementId: agreement.id,
        bookingId: selectedBooking.id,
        vehicleId: selectedBooking.car_id,
        inspectionType,
        odometerReading: odometerValue,
        fuelLevel,
        exteriorPhotos,
        interiorPhotos,
        damagePhotos,
        videoUrls: [],
        damageNotes: damageNotes || undefined,
        overallCondition,
        inspectedBy: undefined, // Leave as null in database (UUID field)
      })

      console.log("[Inspections] Inspection creation result:", result)

      if (result.success) {
        toast.success("Inspection completed successfully!")
        resetForm()
        setShowInspectionForm(false)
        // Reload data to update the list and stats
        await loadData()
      } else {
        console.error("[Inspections] Inspection creation failed:", result.error)
        const errorMessage = result.error || "Failed to create inspection"
        toast.error(errorMessage, {
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("[Inspections] Unexpected error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      toast.error(`Error: ${errorMessage}`, {
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setShowInspectionForm(false)
    setSelectedBooking(null)
    setOdometerReading("")
    setFuelLevel("full")
    setOverallCondition("excellent")
    setDamageNotes("")
    setExteriorPhotos([])
    setInteriorPhotos([])
    setDamagePhotos([])
  }

  const getCar = (carId: string) => cars.find((c) => c.id === carId)

  const getDaysUntilReturn = (dropoffDate: string) => {
    const now = new Date()
    const dropoff = new Date(dropoffDate)
    const diffTime = dropoff.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isReturningToday = (dropoffDate: string) => {
    return getDaysUntilReturn(dropoffDate) === 0
  }

  // Calculate stats
  const stats = {
    total: bookings.length,
    returningToday: bookings.filter((b) => isReturningToday(b.dropoff_date)).length,
    withoutHandover: bookings.filter((b) => {
      const bookingInspections = inspections[b.id] || []
      return !bookingInspections.some((i) => i.inspection_type === "handover")
    }).length,
    withoutReturn: bookings.filter((b) => {
      const bookingInspections = inspections[b.id] || []
      const hasHandover = bookingInspections.some((i) => i.inspection_type === "handover")
      const hasReturn = bookingInspections.some((i) => i.inspection_type === "return")
      return hasHandover && !hasReturn
    }).length,
    completed: bookings.filter((b) => {
      const bookingInspections = inspections[b.id] || []
      const hasHandover = bookingInspections.some((i) => i.inspection_type === "handover")
      const hasReturn = bookingInspections.some((i) => i.inspection_type === "return")
      return hasHandover && hasReturn
    }).length,
    totalInspections: Object.values(inspections).flat().length,
  }

  // Filter and sort bookings
  const filteredBookings = bookings
    .filter((b) => {
      // Apply filter type
      if (filterType === "returning-today") {
        if (!isReturningToday(b.dropoff_date)) return false
      } else if (filterType === "no-handover") {
        const bookingInspections = inspections[b.id] || []
        if (bookingInspections.some((i) => i.inspection_type === "handover")) return false
      } else if (filterType === "no-return") {
        const bookingInspections = inspections[b.id] || []
        if (bookingInspections.some((i) => i.inspection_type === "return")) return false
        // Also need to have handover first
        if (!bookingInspections.some((i) => i.inspection_type === "handover")) return false
      } else if (filterType === "completed") {
        const bookingInspections = inspections[b.id] || []
        const hasHandover = bookingInspections.some((i) => i.inspection_type === "handover")
        const hasReturn = bookingInspections.some((i) => i.inspection_type === "return")
        // Only show bookings that have BOTH handover AND return inspections
        if (!hasHandover || !hasReturn) {
          return false
        }
      }
      // filterType === "all" shows everything

      // Apply search query
      const car = getCar(b.car_id)
      const query = searchQuery.toLowerCase()
      return (
        car?.name?.toLowerCase().includes(query) ||
        car?.brand?.toLowerCase().includes(query) ||
        b.customer_name?.toLowerCase().includes(query) ||
        b.customer_email?.toLowerCase().includes(query) ||
        b.id?.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      // Sort: returning today first, then by days until return
      const aDays = getDaysUntilReturn(a.dropoff_date)
      const bDays = getDaysUntilReturn(b.dropoff_date)
      if (aDays === 0 && bDays !== 0) return -1
      if (bDays === 0 && aDays !== 0) return 1
      return aDays - bDays
    })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-red-500 mx-auto" />
          <p className="text-white/60">Loading inspections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="liquid-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Vehicle Inspections
              </h1>
              <p className="text-sm text-white/60 mt-2">Manage handover and return inspections for active bookings</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Active</CardTitle>
              <Car className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <p className="text-xs text-white/60 mt-1">Bookings</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10 border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Returning Today</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.returningToday}</div>
              <p className="text-xs text-white/60 mt-1">Due today</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">No Handover</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats.withoutHandover}</div>
              <p className="text-xs text-white/60 mt-1">Need inspection</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">No Return</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.withoutReturn}</div>
              <p className="text-xs text-white/60 mt-1">Pending return</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Done</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
              <p className="text-xs text-white/60 mt-1">Bookings with both inspections</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="liquid-glass rounded-2xl p-4 border border-white/10 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <Input
              placeholder="Search by car, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/50 border-white/20 text-white placeholder:text-gray-500 focus:border-red-500/50"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white/70">Filter:</span>
            {[
              { key: "all", label: "All Active", count: stats.total },
              { key: "returning-today", label: "Returning Today", count: stats.returningToday },
              { key: "no-handover", label: "No Handover", count: stats.withoutHandover },
              { key: "no-return", label: "No Return", count: stats.withoutReturn },
              { key: "completed", label: "Completed", count: stats.completed },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterType === filter.key
                    ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/50"
                    : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="liquid-glass rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {filterType === "all"
                ? "All Active Bookings"
                : filterType === "returning-today"
                  ? "Returning Today"
                  : filterType === "no-handover"
                    ? "No Handover Inspection"
                    : filterType === "no-return"
                      ? "No Return Inspection"
                      : "Completed Inspections"}
            </h2>
            <Badge className="bg-white/10 text-white border-white/20">
              {filteredBookings.length} {filteredBookings.length === 1 ? "booking" : "bookings"}
            </Badge>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No active bookings found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const car = getCar(booking.car_id)
                const bookingInspections = inspections[booking.id] || []
                const hasHandover = bookingInspections.some((i) => i.inspection_type === "handover")
                const hasReturn = bookingInspections.some((i) => i.inspection_type === "return")
                const returningToday = isReturningToday(booking.dropoff_date)
                const daysUntilReturn = getDaysUntilReturn(booking.dropoff_date)

                return (
                  <div
                    key={booking.id}
                    className={`bg-white/5 border rounded-xl p-4 hover:bg-white/10 transition-colors ${
                      returningToday
                        ? "border-yellow-500/50 bg-yellow-500/10"
                        : !hasHandover
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-white/10"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-16 w-16 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                          <Car className="h-8 w-8 text-white/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-semibold text-white text-lg">
                              {car?.brand} {car?.name || "Unknown Vehicle"}
                            </h3>
                            {returningToday && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Returning Today
                              </Badge>
                            )}
                            {!hasHandover && (
                              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                                <Clock className="h-3 w-3 mr-1" />
                                No Handover Inspection
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-white/70 mb-2">Customer: {booking.customer_name}</p>
                          <div className="flex items-center gap-4 text-xs text-white/60 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Pickup: {new Date(booking.pickup_date).toLocaleDateString()} {booking.pickup_time}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Return: {new Date(booking.dropoff_date).toLocaleDateString()} {booking.dropoff_time}
                              </span>
                            </div>
                            {daysUntilReturn >= 0 && (
                              <span className={returningToday ? "text-yellow-400 font-semibold" : ""}>
                                {daysUntilReturn === 0
                                  ? "Due today"
                                  : daysUntilReturn === 1
                                    ? "1 day remaining"
                                    : `${daysUntilReturn} days remaining`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {hasHandover ? (
                              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Handover ✓
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                <Clock className="h-3 w-3 mr-1" />
                                Handover Pending
                              </Badge>
                            )}
                            {hasReturn ? (
                              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Return ✓
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                <Clock className="h-3 w-3 mr-1" />
                                Return Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!hasHandover && (
                          <Button
                            onClick={() => {
                              setSelectedBooking(booking)
                              setInspectionType("handover")
                              setShowInspectionForm(true)
                            }}
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Handover
                          </Button>
                        )}
                        {hasHandover && !hasReturn && (
                          <Button
                            onClick={() => {
                              setSelectedBooking(booking)
                              setInspectionType("return")
                              setShowInspectionForm(true)
                            }}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Return
                          </Button>
                        )}
                        <Link href={`/admin/agreement-steps/${booking.id}`}>
                          <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Inspection Dialog */}
      <Dialog open={showInspectionForm} onOpenChange={setShowInspectionForm}>
        <DialogContent className="bg-black border border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {inspectionType === "handover" ? "Handover" : "Return"} Inspection
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {selectedBooking && (
                <>
                  {getCar(selectedBooking.car_id)?.brand} {getCar(selectedBooking.car_id)?.name} -{" "}
                  {selectedBooking.customer_name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-white">
                  Odometer Reading <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={odometerReading}
                  onChange={(e) => setOdometerReading(e.target.value)}
                  placeholder="Enter odometer reading"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-white">Fuel Level</Label>
                <Select value={fuelLevel} onValueChange={(v: any) => setFuelLevel(v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10">
                    {["full", "3/4", "1/2", "1/4", "empty"].map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-white">Overall Condition</Label>
              <Select value={overallCondition} onValueChange={(v: any) => setOverallCondition(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  {["excellent", "good", "fair", "poor"].map((cond) => (
                    <SelectItem key={cond} value={cond}>
                      {cond.charAt(0).toUpperCase() + cond.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Photo Uploads */}
            {[
              { title: "Exterior Photos", type: "exterior" as const, photos: exteriorPhotos, required: true },
              { title: "Interior Photos", type: "interior" as const, photos: interiorPhotos, required: true },
              { title: "Damage Photos", type: "damage" as const, photos: damagePhotos, required: false },
            ].map(({ title, type, photos, required }) => (
              <div key={type} className="space-y-2">
                <Label className="text-sm text-white">
                  {title} {required && <span className="text-red-500">*</span>}
                </Label>
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((url, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img
                          src={url || "/placeholder.svg"}
                          alt={title}
                          className="w-full h-full object-cover rounded-lg border border-white/10"
                        />
                        <button
                          onClick={() => {
                            if (type === "exterior") setExteriorPhotos(photos.filter((_, idx) => idx !== i))
                            else if (type === "interior") setInteriorPhotos(photos.filter((_, idx) => idx !== i))
                            else setDamagePhotos(photos.filter((_, idx) => idx !== i))
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    files.forEach((file) => handleFileUpload(file, type))
                  }}
                  className="hidden"
                  id={`${type}-upload`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(`${type}-upload`)?.click()}
                  className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {title}
                </Button>
              </div>
            ))}

            <div className="space-y-2">
              <Label className="text-sm text-white">Damage Notes</Label>
              <Textarea
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                placeholder="Any damage or issues found..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              {isSubmitting ? "Submitting..." : "Complete Inspection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
