"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Mail,
  CheckCircle,
  Clock,
  Car,
  User,
  Phone,
  RefreshCw,
  MoreVertical,
  MapPin,
  CreditCard,
  FileText,
  X,
  Eye,
  ExternalLink,
  IdCard,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  Loader2,
  ShieldAlert,
  Archive,
  Ban,
  FileSearch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAllBookingsAction, updateBookingStatusAction, rejectBookingAction, type BookingWithDetails } from "@/app/actions/bookings"
import { REJECTION_REASONS } from "@/lib/booking-constants"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 15

export default function AdminRequestsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [rejectingBooking, setRejectingBooking] = useState<BookingWithDetails | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string>("")
  const [rejectionNotes, setRejectionNotes] = useState<string>("")
  const [canResubmit, setCanResubmit] = useState<boolean>(true)
  const [isRejecting, setIsRejecting] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchQuery, statusFilter])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchQuery, statusFilter])

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE)
  }, [])

  const loadBookings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("[v0] Admin: Loading bookings...")
      const result = await getAllBookingsAction()
      console.log("[v0] Admin: Bookings result:", result?.success, result?.data?.length, result?.error)

      if (result?.success && result?.data) {
        setBookings(result.data)
        console.log("[v0] Admin: Bookings loaded:", result.data.length)
      } else {
        console.error("[v0] Admin: Failed to load bookings:", result?.error)
        setError(result?.error || "Failed to load bookings")
      }
    } catch (err) {
      console.error("[v0] Admin: Exception loading bookings:", err)
      setError(err instanceof Error ? err.message : "An error occurred while loading bookings")
    } finally {
      setIsLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = bookings

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status?.toLowerCase().includes(statusFilter.toLowerCase()))
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.customer_name?.toLowerCase().includes(query) ||
          b.customer_email?.toLowerCase().includes(query) ||
          b.customer_phone?.toLowerCase().includes(query) ||
          b.car_name?.toLowerCase().includes(query) ||
          b.id?.toLowerCase().includes(query),
      )
    }

    setFilteredBookings(filtered)
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const result = await updateBookingStatusAction(bookingId, newStatus)

      if (result?.success) {
        await loadBookings()
      } else {
        setError(result?.error || "Failed to update status")
      }
    } catch (err) {
      setError("An error occurred while updating the booking status")
    }
  }

  const handleApprove = (bookingId: string) => {
    router.push(`/admin/agreement-steps/${bookingId}`)
  }

  const openRejectModal = (booking: BookingWithDetails) => {
    setRejectingBooking(booking)
    setRejectionReason("")
    setRejectionNotes("")
    setCanResubmit(true)
    setSelectedBooking(null) // Close documents modal if open
  }

  const handleRejectBooking = async () => {
    if (!rejectingBooking || !rejectionReason) {
      setError("Please select a rejection reason")
      return
    }

    setIsRejecting(true)
    try {
      const result = await rejectBookingAction(
        rejectingBooking.id,
        rejectionReason,
        rejectionNotes,
        canResubmit
      )

      if (result?.success) {
        setRejectingBooking(null)
        await loadBookings()
      } else {
        setError(result?.error || "Failed to reject booking")
      }
    } catch (err) {
      setError("An error occurred while rejecting the booking")
    } finally {
      setIsRejecting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "pending review":
      case "pending details":
      case "documents submitted":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "approved":
      case "confirmed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "agreement sent":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "active":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "completed":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-white/10 text-white/40 border-white/10"
    }
  }

  const getStatusColorHex = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "pending review":
      case "pending details":
      case "documents submitted":
        return "#f59e0b"
      case "approved":
      case "confirmed":
        return "#10b981"
      case "agreement sent":
        return "#a855f7"
      case "active":
        return "#3b82f6"
      case "completed":
        return "#a855f7"
      case "rejected":
        return "#ef4444"
      default:
        return "#27272a"
    }
  }

  const getStatusDisplayText = (status: string | undefined) => {
    if (status?.toLowerCase() === "agreement sent") {
      return "Waiting for Client Signature"
    }
    return status || "Unknown"
  }

  // Calculate statistics
  const stats = {
    total: bookings.length,
    pending: bookings.filter(
      (b) =>
        b.status?.toLowerCase().includes("pending") ||
        b.status?.toLowerCase() === "pending review" ||
        b.status?.toLowerCase() === "pending details",
    ).length,
    active: bookings.filter((b) => b.status?.toLowerCase() === "active").length,
    completed: bookings.filter((b) => b.status?.toLowerCase() === "completed").length,
    rejected: bookings.filter((b) => b.status?.toLowerCase().includes("rejected")).length,
  }

  // Lazy loading
  const displayedBookings = filteredBookings.slice(0, displayCount)
  const hasMore = displayedBookings.length < filteredBookings.length

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Requests Management</h1>
          <p className="text-gray-400">Manage bookings and rental requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Bookings", value: stats.total, icon: Calendar, color: "text-blue-400" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-400" },
            { label: "Active", value: stats.active, icon: Car, color: "text-green-400" },
            { label: "Rejected", value: stats.rejected, icon: Ban, color: "text-red-400" },
            { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-purple-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{label}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {isLoading ? <span className="animate-pulse">...</span> : value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-white/[0.03] border border-white/5`}>
                  <Icon className={`${color} w-5 h-5 opacity-75`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by customer name, email, phone, car..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black border-zinc-700 text-white placeholder-gray-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["pending", "approved", "rejected", "active", "completed", "all"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? "bg-red-500 hover:bg-red-600" : "border-zinc-700 text-gray-300"}
                >
                  {status === "rejected" ? "Rejected" : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
            <Button onClick={loadBookings} size="sm" className="bg-red-500 hover:bg-red-600" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6 text-red-400">{error}</div>}

        {/* Bookings List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              Manifest <span className="text-white/40 font-normal">({filteredBookings.length})</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="liquid-glass border-white/10 rounded-xl p-6 h-32 animate-pulse" />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="liquid-glass border-white/10 rounded-xl p-20 text-center">
              <AlertTriangle className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white font-medium">No results found in ledger</p>
              <p className="text-sm text-white/40 mt-1">Try adjusting your filters or search query</p>
            </div>
          ) : (
            displayedBookings.map((booking) => {
              const isRejected = booking.status?.toLowerCase().includes("rejected")
              return (
                <div
                  key={booking.id}
                  className={`liquid-glass border rounded-xl p-4 md:p-5 hover:bg-white/[0.03] transition-all group border-l-4 ${isRejected ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-white/10'}`}
                  style={{ borderLeftColor: getStatusColorHex(booking.status) }}
                >
                  <div className="flex flex-col lg:flex-row gap-5">
                    {/* Car Image (Compact) */}
                    <div className="w-full lg:w-40 aspect-video lg:h-24 bg-white/5 rounded-lg flex-shrink-0 overflow-hidden relative border border-white/5 group-hover:border-white/10 transition-colors">
                      <img
                        src={booking.car_image || "/placeholder.svg?height=96&width=128&query=car"}
                        alt={booking.car_name || "Car"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        <Badge className="bg-black/60 backdrop-blur-md text-[10px] text-white/80 border-white/10 px-1.5 h-5 flex items-center">
                          {booking.car_name?.split(' ')[0] || "Fleet"}
                        </Badge>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">{booking.car_name || "Unknown Vehicle"}</h3>
                          <Badge className={`text-[10px] uppercase font-bold px-2 py-0.5 ${getStatusColor(booking.status)}`}>
                            {getStatusDisplayText(booking.status)}
                          </Badge>
                          {booking.booking_type && (
                            <Badge variant="outline" className="text-[10px] text-white/40 border-white/10">
                              {booking.booking_type}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2">
                          <div className="flex items-center gap-2 text-white/60">
                            <User className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-xs font-medium truncate">{booking.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/40">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs">{new Date(booking.pickup_date).toLocaleDateString()} - {new Date(booking.dropoff_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/40">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-mono">{booking.customer_phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/40">
                            <CreditCard className="w-3.5 h-3.5 text-white/20" />
                            <span className="text-sm font-bold text-white">£{booking.total_amount?.toFixed(2)}</span>
                          </div>
                        </div>

                        {isRejected && booking.rejection_reason && (
                          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/10 rounded-lg flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                            <Ban className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-red-400 text-[11px] font-bold uppercase tracking-tight">Rejection Reason</p>
                              <p className="text-red-300/60 text-xs mt-0.5 italic leading-relaxed">
                                {booking.rejection_reason}
                                {booking.rejection_notes && <span className="opacity-60 block mt-1 hover:opacity-100 cursor-default transition-opacity">— {booking.rejection_notes}</span>}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-[10px] text-white/20 uppercase tracking-widest font-mono">
                        <span>REF: {booking.id.slice(0, 8)}...</span>
                        <span>LOCATION: {booking.pickup_location || "LONDON"}</span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-row lg:flex-col gap-2 justify-end lg:justify-start lg:min-w-[140px]">
                      <Button
                        onClick={() => setSelectedBooking(booking)}
                        size="sm"
                        variant="outline"
                        className="bg-zinc-950 border-white/10 text-white/60 hover:text-white hover:bg-white/5 h-9 flex-1 lg:flex-none"
                      >
                        <FileText className="w-3.5 h-3.5 mr-2" />
                        Documents
                      </Button>

                      {(booking.status?.toLowerCase().includes("pending") ||
                        booking.status?.toLowerCase() === "pending review" ||
                        booking.status?.toLowerCase() === "documents submitted") && (
                          <Button
                            onClick={() => handleApprove(booking.id)}
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white font-bold h-9 flex-1 lg:flex-none"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-2" />
                            Approve
                          </Button>
                        )}

                      {(booking.status?.toLowerCase() === "approved" ||
                        booking.status?.toLowerCase() === "agreement sent" ||
                        booking.status?.toLowerCase() === "confirmed") && (
                          <Button
                            onClick={() => handleApprove(booking.id)}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold h-9 flex-1 lg:flex-none"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-2" />
                            Re-send
                          </Button>
                        )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="bg-black border-white/10 text-white/40 hover:text-white h-9 px-2">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-zinc-950 border-white/10 text-white">
                          <DropdownMenuItem onClick={() => router.push(`/admin/bookings/${booking.id}`)} className="cursor-pointer hover:bg-white/5">
                            <Eye className="w-4 h-4 mr-2" /> Full Details
                          </DropdownMenuItem>
                          {booking.status?.toLowerCase() !== "completed" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(booking.id, "Active")}
                                className="cursor-pointer hover:bg-white/5"
                              >
                                Mark as Active
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(booking.id, "Completed")}
                                className="cursor-pointer hover:bg-white/5"
                              >
                                Mark as Completed
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => openRejectModal(booking)}
                            className="text-red-400 cursor-pointer hover:bg-white/5"
                          >
                            Reject Booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {/* Load More Button */}
          {!isLoading && hasMore && (
            <div className="pt-4">
              <Button
                onClick={handleLoadMore}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Load More ({filteredBookings.length - displayedBookings.length} remaining)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Documents Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="liquid-glass border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Vetting Documents</h2>
                <p className="text-xs text-white/40 mt-0.5 font-mono uppercase">
                  {selectedBooking.customer_name} • ID: {selectedBooking.id.slice(0, 12)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBooking(null)}
                className="text-white/40 hover:text-white hover:bg-white/5 h-8 w-8 p-0 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1.5 block">Full Name</Label>
                  <p className="text-sm text-white font-medium">{selectedBooking.customer_name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1.5 block">Contact Phone</Label>
                  <p className="text-sm text-white font-mono">{selectedBooking.customer_phone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1.5 block">Driver License #</Label>
                  <p className="text-sm text-white font-mono">{selectedBooking.driving_license_number || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1.5 block">National Insurance #</Label>
                  <p className="text-sm text-white font-mono">{selectedBooking.ni_number || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1.5 block">Email Address</Label>
                  <p className="text-sm text-white">{selectedBooking.customer_email || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1.5 block">Booking Tier</Label>
                  <Badge variant="outline" className="border-red-500/20 text-red-400 bg-red-500/5">{selectedBooking.booking_type || "Rent"}</Badge>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  Evidence Vault
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocumentCard title="Driving License (Front)" url={selectedBooking.driving_license_front_url} onPreview={setPreviewImage} />
                  <DocumentCard title="Driving License (Back)" url={selectedBooking.driving_license_back_url} onPreview={setPreviewImage} />
                  <DocumentCard title="Proof of Address" url={selectedBooking.proof_of_address_url} onPreview={setPreviewImage} />
                  <DocumentCard title="Recent Bank Statement" url={selectedBooking.bank_statement_url} onPreview={setPreviewImage} />
                  {selectedBooking.private_hire_license_front_url && <DocumentCard title="PCO Front" url={selectedBooking.private_hire_license_front_url} onPreview={setPreviewImage} />}
                  {selectedBooking.private_hire_license_back_url && <DocumentCard title="PCO Back" url={selectedBooking.private_hire_license_back_url} onPreview={setPreviewImage} />}
                </div>

                {!selectedBooking.driving_license_front_url && !selectedBooking.driving_license_back_url && (
                  <div className="p-10 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center">
                    <AlertTriangle className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-white/40 text-sm italic">Digital dossier is empty. Customer has not uploaded credentials.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-white/10 bg-white/[0.02] flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  setSelectedBooking(null)
                  handleApprove(selectedBooking.id)
                }}
                className={`flex-1 h-12 font-bold ${selectedBooking.status?.toLowerCase() === "approved" ||
                  selectedBooking.status?.toLowerCase() === "agreement sent" ||
                  selectedBooking.status?.toLowerCase() === "confirmed"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
              >
                {selectedBooking.status?.toLowerCase() === "approved" ||
                  selectedBooking.status?.toLowerCase() === "agreement sent" ||
                  selectedBooking.status?.toLowerCase() === "confirmed" ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Re-issue Agreement
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Issue Agreement
                  </>
                )}
              </Button>
              <Button
                onClick={() => openRejectModal(selectedBooking)}
                variant="outline"
                className="border-white/10 text-red-400 hover:bg-red-500/10 h-12 px-6"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => setSelectedBooking(null)}
                variant="outline"
                className="border-white/10 text-white/40 hover:text-white h-12 px-6"
              >
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingBooking && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setRejectingBooking(null)}
        >
          <div
            className="liquid-glass border-white/10 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/20">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Reject Request</h2>
                  <p className="text-xs text-white/40 font-mono uppercase truncate max-w-[200px]">{rejectingBooking.id}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectingBooking(null)}
                className="text-white/40 hover:text-white hover:bg-white/5 h-8 w-8 p-0 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Target Client</p>
                <p className="text-sm text-white font-medium">{rejectingBooking.customer_name}</p>
                <p className="text-white/40 text-xs">{rejectingBooking.customer_email}</p>
              </div>

              <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3 block">
                Select Verdict
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(REJECTION_REASONS).map(([key, value]) => {
                  const [category, detail] = value.split(" - ")
                  let Icon = AlertTriangle
                  let iconColor = "text-yellow-500"

                  if (category.includes("Not Eligible")) {
                    Icon = Ban
                    iconColor = "text-orange-500"
                  } else if (category.includes("Missing Documents")) {
                    Icon = FileSearch
                    iconColor = "text-blue-500"
                  } else if (category.includes("Security Issue")) {
                    Icon = ShieldAlert
                    iconColor = "text-red-500"
                  } else if (category.includes("Other")) {
                    Icon = Archive
                    iconColor = "text-gray-500"
                  }

                  return (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${rejectionReason === value
                        ? "border-red-500 bg-red-500/10 shadow-lg shadow-red-500/5 scale-[1.02]"
                        : "border-white/5 bg-white/5 hover:bg-white/[0.08] hover:border-white/10"
                        }`}
                    >
                      <div className="relative pt-0.5">
                        <input
                          type="radio"
                          name="rejectionReason"
                          value={value}
                          checked={rejectionReason === value}
                          onChange={(e) => {
                            setRejectionReason(e.target.value)
                            if (value.includes("Document Issue") || value.includes("Missing Documents")) {
                              setCanResubmit(true)
                            } else if (value.includes("Security Issue")) {
                              setCanResubmit(false)
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border border-white/20 flex items-center justify-center ${rejectionReason === value ? "bg-red-500 border-red-500" : ""}`}>
                          {rejectionReason === value && <div className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in-50" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className={`w-3 h-3 ${iconColor} shrink-0`} />
                          <p className="text-white text-[11px] font-bold leading-none">{category}</p>
                        </div>
                        <p className="text-white/40 text-[10px] leading-tight mt-1">{detail}</p>
                      </div>
                    </label>
                  )
                })}
              </div>

              <div>
                <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">
                  Confidential Arbiter Notes
                </label>
                <Textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Internal notes regarding rejection decision..."
                  className="bg-zinc-950 border-white/10 text-white placeholder:text-white/20 text-xs min-h-[80px]"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white text-xs font-bold">Resubmission Clause</p>
                    <p className="text-white/40 text-[10px]">Allow client to update credentials</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canResubmit}
                    onChange={(e) => setCanResubmit(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              {!canResubmit && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300/60 text-[10px] uppercase font-bold tracking-tighter">
                    Permanent Blacklist: Client cannot resubmit for this request.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleRejectBooking}
                  disabled={!rejectionReason || isRejecting}
                  className="bg-red-500 hover:bg-red-600 h-11 flex-1 font-bold text-white disabled:opacity-50"
                >
                  {isRejecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Execute Rejection"
                  )}
                </Button>
                <Button
                  onClick={() => setRejectingBooking(null)}
                  variant="outline"
                  className="border-white/10 text-white/40 hover:text-white h-11 px-6 text-xs"
                  disabled={isRejecting}
                >
                  Abort
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white hover:text-red-400 z-10"
          >
            <X className="w-8 h-8" />
          </Button>
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
            <Image
              src={previewImage}
              alt="Document preview"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <a
            href={previewImage}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 bg-zinc-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </a>
        </div>
      )}
    </div>
  )
}

// Document Card Component
function DocumentCard({
  title,
  url,
  onPreview
}: {
  title: string
  url?: string
  onPreview: (url: string) => void
}) {
  if (!url) {
    return (
      <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center min-h-[140px]">
        <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">{title}</h4>
        <div className="text-white/10 text-xs italic">Missing Files</div>
      </div>
    )
  }

  const isImage = url.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  const isPdf = url.match(/\.pdf$/i)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {title}
        </h4>
        {isPdf && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20 text-[8px] h-4">PDF</Badge>}
      </div>

      {isImage ? (
        <div
          className="relative aspect-video bg-black/40 rounded-lg overflow-hidden cursor-pointer group/img border border-white/5"
          onClick={() => onPreview(url)}
        >
          <Image
            src={url}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover/img:scale-110"
          />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-[2px]">
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-black/40 rounded-lg flex flex-col items-center justify-center border border-white/5">
          <FileText className="w-8 h-8 text-white/20 mb-2" />
          <span className="text-[10px] text-white/40 font-mono tracking-tighter">ENCRYPTED BINARY</span>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {isImage && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 bg-white/5 border-white/10 text-white/60 hover:text-white text-[10px] font-bold h-8"
            onClick={() => onPreview(url)}
          >
            Preview
          </Button>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button
            size="sm"
            variant="outline"
            className="w-full bg-white/5 border-white/10 text-white/60 hover:text-white text-[10px] font-bold h-8"
          >
            {isPdf ? "Open Vault" : "Download"}
          </Button>
        </a>
      </div>
    </div>
  )
}
