"use client"

import { useState, useEffect } from "react"
import { Camera, Upload, CheckCircle, Clock, FileText, Car, Search, AlertCircle, Calendar, Loader2, ChevronRight, PenTool } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllBookingsAction, type BookingWithDetails } from "@/app/actions/bookings"
import { getCarsAction } from "@/app/actions/database"
import { getAgreementsByBookingAction } from "@/app/actions/agreements"
import { createInspectionAction, getInspectionsStatusForBookingsAction } from "@/app/actions/inspections"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function InspectionsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [inspectionStatus, setInspectionStatus] = useState<Record<string, { hasHandover: boolean, hasReturn: boolean }>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Inspection Form State
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [inspectionType, setInspectionType] = useState<"handover" | "return">("handover")
  const [handoverData, setHandoverData] = useState<any>(null)

  // Comparison View State
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)
  const [comparisonData, setComparisonData] = useState<{ handover: any, return: any, booking: any | null }>({
    handover: null, return: null, booking: null
  })

  const [inspectionStep, setInspectionStep] = useState(1)

  // Form Data
  const [odometerReading, setOdometerReading] = useState("")
  const [fuelLevel, setFuelLevel] = useState<string>("full")
  const [overallCondition, setOverallCondition] = useState<string>("excellent")
  const [damageNotes, setDamageNotes] = useState("")
  const [photos, setPhotos] = useState<{ exterior: string[], interior: string[], damage: string[] }>({
    exterior: [],
    interior: [],
    damage: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load Initial Data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Active Bookings & Cars
      const [bookingsData, carsData] = await Promise.all([
        getAllBookingsAction(),
        getCarsAction()
      ])

      const active = (bookingsData?.data || []).filter((b: any) =>
        ["active", "approved", "confirmed", "on rent"].includes((b.status || "").toLowerCase())
      )

      // 2. Efficiently Fetch Statuses
      const bookingIds = active.map((b: any) => b.id)
      const statusMap = await getInspectionsStatusForBookingsAction(bookingIds)

      setBookings(active)
      setInspectionStatus(statusMap)
    } catch (e) {
      console.error("Failed to load inspections data", e)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  // Derive Lists
  const getBookingStatus = (b: BookingWithDetails) => {
    return inspectionStatus[b.id] || { hasHandover: false, hasReturn: false }
  }

  const pendingHandover = bookings.filter(b => !getBookingStatus(b).hasHandover)
  const pendingReturn = bookings.filter(b => {
    const status = getBookingStatus(b)
    return status.hasHandover && !status.hasReturn
  })
  const completedHistory = bookings.filter(b => {
    const status = getBookingStatus(b)
    return status.hasHandover && status.hasReturn
  })

  // Filter helper
  const filterList = (list: BookingWithDetails[]) => {
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(b =>
      b.customer_name?.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.car_id.toLowerCase().includes(q)
    )
  }

  // Inspection Logic
  const startInspection = async (booking: BookingWithDetails, type: "handover" | "return") => {
    setSelectedBooking(booking)
    setInspectionType(type)
    setInspectionStep(1)
    setHandoverData(null)

    // Reset Form
    setOdometerReading("")
    setFuelLevel("full")
    setOverallCondition("excellent")
    setDamageNotes("")
    setPhotos({ exterior: [], interior: [], damage: [] })

    // Fetch previous data
    const toastId = toast.loading("Loading previous data...")
    try {
      const actions = await import("@/app/actions/inspections")

      if (type === "return") {
        // For Return: Get THIS booking's handover
        const inspections = await actions.getInspectionsByBookingAction(booking.id)
        const handover = inspections.find((i: any) => i.inspection_type === "handover")
        if (handover) setHandoverData(handover)
      } else {
        // For Handover: Get LAST inspection of this vehicle (from any previous booking)
        const inspections = await actions.getInspectionsByVehicleId(booking.car_id)
        // Sort by date desc and find first
        const lastInspection = inspections.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        if (lastInspection) setHandoverData(lastInspection)
      }
      toast.dismiss(toastId)
    } catch (e) {
      toast.error("Failed to load history")
      toast.dismiss(toastId)
    }

    setIsInspectModalOpen(true)
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>, category: "exterior" | "interior" | "damage") => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append("file", file)

      const toastId = toast.loading("Uploading photo...")
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error("Upload failed")
        const data = await res.json()

        setPhotos(prev => ({
          ...prev,
          [category]: [...prev[category], data.url]
        }))
        toast.success("Photo added", { id: toastId })
      } catch (err) {
        toast.error("Upload failed", { id: toastId })
      }
    }
  }

  const submitInspection = async () => {
    if (!selectedBooking) return
    if (!odometerReading) return toast.error("Odometer reading required")
    if (photos.exterior.length === 0) return toast.error("Exterior photo required")

    setIsSubmitting(true)
    try {
      // Verify Agreement first
      const agreements = await getAgreementsByBookingAction(selectedBooking.id)
      const activeAgreement = agreements.find(a => ["signed", "active", "confirmed", "sent"].includes((a.status || "").toLowerCase()))

      if (!activeAgreement) {
        toast.error("No active/signed agreement found!")
        return
      }

      const result = await createInspectionAction({
        agreementId: activeAgreement.id,
        bookingId: selectedBooking.id,
        vehicleId: selectedBooking.car_id,
        inspectionType,
        odometerReading: parseInt(odometerReading),
        fuelLevel: fuelLevel as any,
        exteriorPhotos: photos.exterior,
        interiorPhotos: photos.interior,
        damagePhotos: photos.damage,
        videoUrls: [],
        damageNotes,
        overallCondition: overallCondition as any
      })

      if (result.success) {
        toast.success(`${inspectionType.toUpperCase()} Inspection Saved!`)
        setIsInspectModalOpen(false)
        loadData() // Refresh
      } else {
        toast.error(result.error || "Failed to save inspection")
      }
    } catch (e) {
      toast.error("Error saving inspection")
    } finally {
      setIsSubmitting(false)
    }
  }

  const viewComparison = async (booking: BookingWithDetails) => {
    const toastId = toast.loading("Loading details...")
    try {
      const actions = await import("@/app/actions/inspections")
      const inspections = await actions.getInspectionsByBookingAction(booking.id)

      setComparisonData({
        booking,
        handover: inspections.find((i: any) => i.inspection_type === "handover"),
        return: inspections.find((i: any) => i.inspection_type === "return")
      })
      setIsComparisonOpen(true)
      toast.dismiss(toastId)
    } catch (e) {
      toast.error("Failed to load details")
    }
  }

  // --- Pagination Render Helper (Basic "Lazy" Rendering) ---
  const ITEMS_PER_PAGE = 5
  // Note: True infinite scroll would go here, but for now we render lists with limits?
  // User asked for "lazy loading". We implemented efficient data fetching.
  // We can add a simple "Load More" to the lists if they are long.

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">
              Vehicle Inspections
            </h1>
            <p className="text-zinc-400 text-sm md:text-base">Manage handovers and returns</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search bookings..."
                className="pl-9 bg-zinc-900 border-zinc-800 focus:border-red-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">Pending Handover</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{pendingHandover.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">Pending Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{pendingReturn.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{completedHistory.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="handover" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 w-full md:w-auto flex overflow-x-auto">
            <TabsTrigger value="handover" className="flex-1 md:flex-none">Handover ({pendingHandover.length})</TabsTrigger>
            <TabsTrigger value="return" className="flex-1 md:flex-none">Return ({pendingReturn.length})</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 md:flex-none">History</TabsTrigger>
          </TabsList>

          <TabsContent value="handover" className="space-y-4">
            <BookingList
              bookings={filterList(pendingHandover)}
              loading={loading}
              actionLabel="Start Handover"
              onAction={(b: any) => startInspection(b, "handover")}
              color="yellow"
            />
          </TabsContent>

          <TabsContent value="return" className="space-y-4">
            <BookingList
              bookings={filterList(pendingReturn)}
              loading={loading}
              actionLabel="Start Return"
              onAction={(b: any) => startInspection(b, "return")}
              color="blue"
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <BookingList
              bookings={filterList(completedHistory)}
              loading={loading}

              actionLabel="View Details"
              onAction={(b: any) => router.push(`/admin/inspections/${b.id}`)}
              color="green"
              isCompleted
            />
          </TabsContent>
        </Tabs>

        {/* Inspection Modal */}
        <Dialog open={isInspectModalOpen} onOpenChange={setIsInspectModalOpen}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>
                {inspectionType === "handover" ? "Handover" : "Return"} Inspection
              </DialogTitle>
              <DialogDescription>
                {selectedBooking?.customer_name} - {selectedBooking?.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">

              {/* Show Car Image if Handover */}
              {inspectionType === "handover" && selectedBooking?.car_image && (
                <div className="relative h-48 w-full rounded-lg overflow-hidden border border-zinc-800 mb-4">
                  <Image src={selectedBooking.car_image} alt="Vehicle" fill className="object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="font-semibold text-white">{selectedBooking.car_name}</p>
                    <p className="text-xs text-zinc-300">{selectedBooking.car_registration_number}</p>
                  </div>
                </div>
              )}

              {/* Step 1: Vitals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Odometer (km) *</Label>
                  <Input type="number" value={odometerReading} onChange={e => setOdometerReading(e.target.value)} required
                    className="bg-zinc-900 border-zinc-800" />
                  {handoverData && (
                    <p className="text-xs text-zinc-400">
                      Previous: {handoverData.odometer_reading || handoverData.odometerReading} km
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Fuel Level</Label>
                  <Select value={fuelLevel} onValueChange={setFuelLevel}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="3/4">3/4</SelectItem>
                      <SelectItem value="1/2">1/2</SelectItem>
                      <SelectItem value="1/4">1/4</SelectItem>
                      <SelectItem value="empty">Empty</SelectItem>
                    </SelectContent>
                  </Select>
                  {handoverData && (
                    <p className="text-xs text-zinc-400">
                      Previous: {handoverData.fuel_level || handoverData.fuelLevel}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Overall Condition</Label>
                <Select value={overallCondition} onValueChange={setOverallCondition}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Photos */}
              <div className="space-y-4 border-t border-zinc-800 pt-4">
                <h3 className="font-semibold">Photos</h3>

                <div className="space-y-2">
                  <Label>Exterior (Required)</Label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    <Button type="button" variant="outline" onClick={() => document.getElementById('ext-photo')?.click()}
                      className="shrink-0 h-20 w-20 flex flex-col items-center justify-center gap-1 bg-zinc-900 border-zinc-800 border-dashed hover:bg-zinc-800">
                      <Camera className="h-5 w-5" /> <span className="text-xs">Add</span>
                    </Button>
                    <input id="ext-photo" type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => handlePhotoSelect(e, 'exterior')} />
                    {photos.exterior.map((url, i) => (
                      <div key={i} className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-zinc-800 border border-zinc-700">
                        <Image src={url} alt="Ext" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Interior</Label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    <Button type="button" variant="outline" onClick={() => document.getElementById('int-photo')?.click()}
                      className="shrink-0 h-20 w-20 flex flex-col items-center justify-center gap-1 bg-zinc-900 border-zinc-800 border-dashed hover:bg-zinc-800">
                      <Camera className="h-5 w-5" /> <span className="text-xs">Add</span>
                    </Button>
                    <input id="int-photo" type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => handlePhotoSelect(e, 'interior')} />
                    {photos.interior.map((url, i) => (
                      <div key={i} className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-zinc-800 border border-zinc-700">
                        <Image src={url} alt="Int" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Damage / Notes</Label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    <Button type="button" variant="outline" onClick={() => document.getElementById('dmg-photo')?.click()}
                      className="shrink-0 h-20 w-20 flex flex-col items-center justify-center gap-1 bg-zinc-900 border-zinc-800 border-dashed hover:bg-zinc-800">
                      <Camera className="h-5 w-5" /> <span className="text-xs">Add</span>
                    </Button>
                    <input id="dmg-photo" type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => handlePhotoSelect(e, 'damage')} />
                    {photos.damage.map((url, i) => (
                      <div key={i} className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-zinc-800 border border-zinc-700">
                        <Image src={url} alt="Dmg" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setIsInspectModalOpen(false)}>Cancel</Button>
              <Button onClick={submitInspection} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Complete Inspection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isComparisonOpen} onOpenChange={setIsComparisonOpen}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white w-full max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800 p-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Inspection Comparison</h2>
                <p className="text-sm text-zinc-400">{comparisonData.booking?.customer_name} - {comparisonData.booking?.car_name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsComparisonOpen(false)}><ChevronRight className="rotate-90" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
              {/* Handover Column */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50">Handover</Badge>
                  <span className="text-xs text-zinc-500">{comparisonData.handover ? new Date(comparisonData.handover.created_at).toLocaleDateString() : "Pending"}</span>
                </div>

                {comparisonData.handover ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-zinc-500 block">Odometer</span> {comparisonData.handover.odometer_reading || "-"} km</div>
                      <div><span className="text-zinc-500 block">Fuel</span> {comparisonData.handover.fuel_level || "-"}</div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Photos</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[...(comparisonData.handover.exterior_photos || []), ...(comparisonData.handover.interior_photos || [])].map((url: string, i: number) => (
                          <div key={i} className="relative aspect-square rounded overflow-hidden bg-zinc-900">
                            <Image src={url} alt="H" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : <p className="text-zinc-500 text-sm italic">No handover inspection recorded.</p>}
              </div>

              {/* Return Column */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/50">Return</Badge>
                  <span className="text-xs text-zinc-500">{comparisonData.return ? new Date(comparisonData.return.created_at).toLocaleDateString() : "Pending"}</span>
                </div>

                {comparisonData.return ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-zinc-500 block">Odometer</span> {comparisonData.return.odometer_reading || "-"} km</div>
                      <div><span className="text-zinc-500 block">Fuel</span> {comparisonData.return.fuel_level || "-"}</div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Photos</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[...(comparisonData.return.exterior_photos || []), ...(comparisonData.return.interior_photos || [])].map((url: string, i: number) => (
                          <div key={i} className="relative aspect-square rounded overflow-hidden bg-zinc-900">
                            <Image src={url} alt="R" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : <p className="text-zinc-500 text-sm italic">No return inspection recorded.</p>}
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}

// Client-side pagination component
function BookingList({ bookings, loading, actionLabel, onAction, color, isCompleted }: any) {
  const [displayCount, setDisplayCount] = useState(5)

  // Reset display count when bookings change significantly (e.g. tab switch)
  useEffect(() => {
    setDisplayCount(5)
  }, [bookings.length]) // Simple heuristic

  const showLoadMore = bookings.length > displayCount
  const displayed = bookings.slice(0, displayCount)

  if (loading) return <div className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></div>
  if (bookings.length === 0) return <p className="text-zinc-500 text-center py-10">No bookings found</p>

  return (
    <div className="space-y-4">
      {displayed.map((booking: any) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          actionLabel={actionLabel}
          onAction={() => onAction(booking)}
          color={color}
          isCompleted={isCompleted}
        />
      ))}

      {showLoadMore && (
        <Button
          variant="ghost"
          className="w-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
          onClick={() => setDisplayCount(prev => prev + 5)}
        >
          Load More
        </Button>
      )}
    </div>
  )
}

function BookingCard({ booking, actionLabel, onAction, color, isCompleted }: any) {
  const isReturningToday = new Date(booking.dropoff_date).toDateString() === new Date().toDateString()

  return (
    <Card
      onClick={() => isCompleted && onAction()}
      className={`bg-zinc-900 border-zinc-800 transition-all ${isCompleted ? 'cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/50' : ''}`}
    >
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-${color}-500/10 text-${color}-500 shrink-0`}>
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{booking.customer_name}</h3>
            <p className="text-sm text-zinc-400">
              {new Date(booking.pickup_date).toLocaleDateString()} - {new Date(booking.dropoff_date).toLocaleDateString()}
            </p>
            {isReturningToday && <Badge className="mt-1 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20">Returning Today</Badge>}
          </div>
        </div>

        {!isCompleted && (
          <Button onClick={(e) => { e.stopPropagation(); onAction() }} className="w-full sm:w-auto whitespace-nowrap bg-zinc-800 hover:bg-zinc-700">
            <Camera className="mr-2 h-4 w-4" />
            {actionLabel}
          </Button>
        )}
        {isCompleted && (
          <Badge variant="outline" className="text-green-500 border-green-500">
            <CheckCircle className="mr-1 h-3 w-3" /> Completed
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
