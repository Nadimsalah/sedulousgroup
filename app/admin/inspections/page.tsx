"use client"

import { useState, useEffect } from "react"
import { Camera, Upload, X, CheckCircle, Clock, FileText, Car, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getBookingsAction } from "@/app/actions/requests"
import { getCarsAction } from "@/app/actions/database"
import { getAgreementsByBookingAction } from "@/app/actions/agreements"
import { createInspectionAction, getInspectionsByBookingAction } from "@/app/actions/inspections"
import { toast } from "sonner"

export default function InspectionsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [cars, setCars] = useState<any[]>([])
  const [inspections, setInspections] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
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
    const [bookingsData, carsData] = await Promise.all([getBookingsAction(), getCarsAction()])
    const activeBookings = bookingsData.filter((b: any) => b.status === "Confirmed" || b.status === "On Rent")
    setBookings(activeBookings)
    setCars(carsData)

    const inspectionsData: Record<string, any[]> = {}
    for (const booking of activeBookings) {
      const bookingInspections = await getInspectionsByBookingAction(booking.id)
      inspectionsData[booking.id] = bookingInspections
    }
    setInspections(inspectionsData)
    setIsLoading(false)
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
    if (!selectedBooking || !odometerReading || exteriorPhotos.length === 0 || interiorPhotos.length === 0) {
      toast.error("Please fill all required fields")
      return
    }

    setIsSubmitting(true)
    const agreements = await getAgreementsByBookingAction(selectedBooking.id)
    const agreement = agreements.find((a) => a.status === "Signed")

    if (!agreement) {
      toast.error("No signed agreement found")
      setIsSubmitting(false)
      return
    }

    const result = await createInspectionAction({
      agreementId: agreement.id,
      bookingId: selectedBooking.id,
      vehicleId: selectedBooking.carId,
      inspectionType,
      odometerReading: Number.parseInt(odometerReading),
      fuelLevel,
      exteriorPhotos,
      interiorPhotos,
      damagePhotos,
      videoUrls: [],
      damageNotes: damageNotes || undefined,
      overallCondition,
      inspectedBy: "Admin",
    })

    if (result.success) {
      toast.success("Inspection completed!")
      resetForm()
      await loadData()
    } else {
      toast.error(result.error || "Failed")
    }
    setIsSubmitting(false)
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

  const stats = {
    total: Object.values(inspections).flat().length,
    handover: Object.values(inspections)
      .flat()
      .filter((i) => i.inspection_type === "handover").length,
    returnInspections: Object.values(inspections)
      .flat()
      .filter((i) => i.inspection_type === "return").length,
    pending:
      bookings.length -
      Object.values(inspections)
        .flat()
        .filter((i) => i.inspection_type === "handover").length,
  }

  const filteredBookings = bookings.filter((b) => {
    const car = getCar(b.carId)
    return (
      car?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
    <div className="min-h-screen bg-black p-3 md:p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header */}
        <div className="liquid-glass rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Vehicle Inspections</h1>
              <p className="text-sm text-white/60 mt-1">Manage handover and return inspections</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total</CardTitle>
              <FileText className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Handover</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.handover}</div>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Return</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.returnInspections}</div>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="liquid-glass rounded-xl p-3 border border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search by car or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Bookings List */}
        <div className="liquid-glass rounded-xl border border-white/10 p-3 md:p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Active Bookings</h2>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60">No active bookings found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBookings.map((booking) => {
                const car = getCar(booking.carId)
                const bookingInspections = inspections[booking.id] || []
                const hasHandover = bookingInspections.some((i) => i.inspection_type === "handover")
                const hasReturn = bookingInspections.some((i) => i.inspection_type === "return")

                return (
                  <div
                    key={booking.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                          <Car className="h-5 w-5 text-white/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate">{car?.name || "Unknown"}</h3>
                          <p className="text-xs text-white/60">{booking.customerName}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {hasHandover ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                Handover ✓
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                Pending
                              </span>
                            )}
                            {hasReturn && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                Return ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking)
                          setInspectionType(hasHandover ? "return" : "handover")
                          setShowInspectionForm(true)
                        }}
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white shrink-0"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {hasHandover ? "Return" : "Handover"}
                      </Button>
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
            <DialogDescription className="text-white/60">Complete inspection and upload photos</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-white">
                  Odometer <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={odometerReading}
                  onChange={(e) => setOdometerReading(e.target.value)}
                  placeholder="Reading"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <Label className="text-sm text-white">Condition</Label>
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
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
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
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, type)
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

            <div className="space-y-1.5">
              <Label className="text-sm text-white">Notes</Label>
              <Textarea
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                placeholder="Any damage or issues..."
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
