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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAllBookingsAction, updateBookingStatusAction, rejectBookingAction, type BookingWithDetails } from "@/app/actions/bookings"
import { REJECTION_REASONS } from "@/lib/booking-constants"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"

const ITEMS_PER_PAGE = 15

export default function AdminRequestsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
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
        return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
      case "approved":
        return "bg-green-500/10 text-green-500 border border-green-500/30"
      case "active":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/30"
      case "completed":
        return "bg-purple-500/10 text-purple-500 border border-purple-500/30"
      case "rejected":
        return "bg-red-500/10 text-red-500 border border-red-500/30"
      default:
        return "bg-gray-500/10 text-gray-500 border border-gray-500/30"
    }
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
            { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-purple-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{label}</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {isLoading ? <span className="animate-pulse">...</span> : value}
                  </p>
                </div>
                <Icon className={`${color} w-8 h-8 opacity-75`} />
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
              {["all", "pending", "approved", "active", "completed"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? "bg-red-500 hover:bg-red-600" : "border-zinc-700 text-gray-300"}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
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
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">
            Bookings <span className="text-gray-400 font-normal">({filteredBookings.length} bookings)</span>
            {displayedBookings.length < filteredBookings.length && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Showing {displayedBookings.length})
              </span>
            )}
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 animate-pulse">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="w-full lg:w-32 h-24 bg-zinc-800 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-zinc-800 rounded w-1/3" />
                      <div className="h-4 bg-zinc-800/50 rounded w-1/2" />
                      <div className="h-4 bg-zinc-800/50 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">No bookings found</p>
            </div>
          ) : (
            displayedBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Car Image */}
                  <div className="w-full lg:w-32 h-24 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
                    <img
                      src={booking.car_image || "/placeholder.svg?height=96&width=128&query=car"}
                      alt={booking.car_name || "Car"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white">{booking.car_name || "Unknown Car"}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                      {booking.booking_type && (
                        <span className="px-2 py-1 rounded bg-zinc-800 text-gray-300 text-xs">
                          {booking.booking_type}
                        </span>
                      )}
                    </div>

                    {/* Customer Information - Enhanced Display */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <User className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {booking.customer_name || "No name provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-sm truncate">{booking.customer_email || "No email"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-sm">{booking.customer_phone || "No phone"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-sm">
                          {booking.pickup_date} - {booking.dropoff_date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-sm truncate">{booking.pickup_location || "London"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-lg font-bold text-white">
                          £{booking.total_amount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>

                    {/* Booking ID */}
                    <p className="text-xs text-gray-500">ID: {booking.id}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0 items-start">
                    {/* View Documents Button */}
                    <Button
                      onClick={() => setSelectedBooking(booking)}
                      size="sm"
                      variant="outline"
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Docs
                    </Button>

                    {(booking.status?.toLowerCase().includes("pending") ||
                      booking.status?.toLowerCase() === "pending review" ||
                      booking.status?.toLowerCase() === "documents submitted") && (
                      <Button
                        onClick={() => handleApprove(booking.id)}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Send Agreement
                      </Button>
                    )}
                    
                    {(booking.status?.toLowerCase() === "approved" ||
                      booking.status?.toLowerCase() === "agreement sent" ||
                      booking.status?.toLowerCase() === "confirmed") && (
                      <Button
                        onClick={() => handleApprove(booking.id)}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Re-send Agreement
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-zinc-700 text-gray-300 bg-black">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                        {booking.status?.toLowerCase() !== "completed" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(booking.id, "Active")}
                              className="text-gray-300 cursor-pointer hover:bg-zinc-800"
                            >
                              Mark as Active
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(booking.id, "Completed")}
                              className="text-gray-300 cursor-pointer hover:bg-zinc-800"
                            >
                              Mark as Completed
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => openRejectModal(booking)}
                          className="text-red-400 cursor-pointer hover:bg-zinc-800"
                        >
                          Reject Booking
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
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
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Customer Documents</h2>
                <p className="text-sm text-gray-400">
                  {selectedBooking.customer_name} - {selectedBooking.id}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-red-400" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white font-medium">{selectedBooking.customer_name || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white font-medium">{selectedBooking.customer_email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white font-medium">{selectedBooking.customer_phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Driving License #:</span>
                    <span className="text-white font-medium">{selectedBooking.driving_license_number || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">NI Number:</span>
                    <span className="text-white font-medium">{selectedBooking.ni_number || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Booking Type:</span>
                    <span className="text-white font-medium">{selectedBooking.booking_type || "Rent"}</span>
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-400" />
                  Uploaded Documents
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Driving License Front */}
                  <DocumentCard
                    title="Driving License (Front)"
                    url={selectedBooking.driving_license_front_url}
                    onPreview={(url) => setPreviewImage(url)}
                  />

                  {/* Driving License Back */}
                  <DocumentCard
                    title="Driving License (Back)"
                    url={selectedBooking.driving_license_back_url}
                    onPreview={(url) => setPreviewImage(url)}
                  />

                  {/* Proof of Address */}
                  <DocumentCard
                    title="Proof of Address"
                    url={selectedBooking.proof_of_address_url}
                    onPreview={(url) => setPreviewImage(url)}
                  />

                  {/* Bank Statement */}
                  <DocumentCard
                    title="Bank Statement"
                    url={selectedBooking.bank_statement_url}
                    onPreview={(url) => setPreviewImage(url)}
                  />

                  {/* Private Hire License Front */}
                  {selectedBooking.private_hire_license_front_url && (
                    <DocumentCard
                      title="Private Hire License (Front)"
                      url={selectedBooking.private_hire_license_front_url}
                      onPreview={(url) => setPreviewImage(url)}
                    />
                  )}

                  {/* Private Hire License Back */}
                  {selectedBooking.private_hire_license_back_url && (
                    <DocumentCard
                      title="Private Hire License (Back)"
                      url={selectedBooking.private_hire_license_back_url}
                      onPreview={(url) => setPreviewImage(url)}
                    />
                  )}
                </div>

                {/* No Documents Warning */}
                {!selectedBooking.driving_license_front_url && 
                 !selectedBooking.driving_license_back_url && 
                 !selectedBooking.proof_of_address_url && 
                 !selectedBooking.bank_statement_url && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-400 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No documents uploaded yet for this booking.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <Button
                  onClick={() => {
                    setSelectedBooking(null)
                    handleApprove(selectedBooking.id)
                  }}
                  className={`flex-1 ${
                    selectedBooking.status?.toLowerCase() === "approved" ||
                    selectedBooking.status?.toLowerCase() === "agreement sent" ||
                    selectedBooking.status?.toLowerCase() === "confirmed"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {selectedBooking.status?.toLowerCase() === "approved" ||
                   selectedBooking.status?.toLowerCase() === "agreement sent" ||
                   selectedBooking.status?.toLowerCase() === "confirmed" ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-send Agreement
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Send Agreement
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => openRejectModal(selectedBooking)}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => setSelectedBooking(null)}
                  variant="outline"
                  className="border-zinc-700 text-gray-300"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingBooking && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setRejectingBooking(null)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Reject Booking</h2>
                  <p className="text-sm text-gray-400">{rejectingBooking.id}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectingBooking(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Customer</p>
                <p className="text-white font-medium">{rejectingBooking.customer_name}</p>
                <p className="text-gray-400 text-sm">{rejectingBooking.customer_email}</p>
              </div>

              {/* Rejection Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rejection Reason *
                </label>
                <div className="space-y-2">
                  {Object.entries(REJECTION_REASONS).map(([key, value]) => (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        rejectionReason === value
                          ? "border-red-500 bg-red-500/10"
                          : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectionReason"
                        value={value}
                        checked={rejectionReason === value}
                        onChange={(e) => {
                          setRejectionReason(e.target.value)
                          // Auto-set canResubmit based on reason type
                          if (value.includes("Document Issue") || value.includes("Missing Documents")) {
                            setCanResubmit(true)
                          } else if (value.includes("Security Issue")) {
                            setCanResubmit(false)
                          }
                        }}
                        className="mt-1 accent-red-500"
                      />
                      <div>
                        <p className="text-white text-sm font-medium">{value.split(" - ")[0]}</p>
                        <p className="text-gray-400 text-xs">{value.split(" - ")[1]}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <Textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Add any specific details about why the booking was rejected..."
                  className="bg-zinc-800 border-zinc-700 text-white placeholder-gray-500 min-h-[100px]"
                />
              </div>

              {/* Can Resubmit Toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Allow Document Resubmission</p>
                    <p className="text-gray-400 text-xs">Customer can upload new documents and resubmit</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canResubmit}
                    onChange={(e) => setCanResubmit(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              {/* Warning */}
              {!canResubmit && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-sm font-medium">Permanent Rejection</p>
                    <p className="text-red-300/70 text-xs">
                      The customer will not be able to resubmit documents for this booking.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <Button
                  onClick={handleRejectBooking}
                  disabled={!rejectionReason || isRejecting}
                  className="bg-red-500 hover:bg-red-600 flex-1 disabled:opacity-50"
                >
                  {isRejecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Confirm Rejection
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setRejectingBooking(null)}
                  variant="outline"
                  className="border-zinc-700 text-gray-300"
                  disabled={isRejecting}
                >
                  Cancel
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
      <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-400 mb-2">{title}</h4>
        <div className="flex items-center justify-center h-32 bg-zinc-800/50 rounded-lg">
          <p className="text-gray-500 text-sm">Not uploaded</p>
        </div>
      </div>
    )
  }

  const isImage = url.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  const isPdf = url.match(/\.pdf$/i)

  return (
    <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-4 hover:border-zinc-600 transition">
      <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-400" />
        {title}
      </h4>
      
      {isImage ? (
        <div 
          className="relative h-32 bg-zinc-800 rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => onPreview(url)}
        >
          <Image
            src={url}
            alt={title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-8 h-8 text-white" />
          </div>
        </div>
      ) : (
        <div className="h-32 bg-zinc-800 rounded-lg flex items-center justify-center">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
      )}

      <div className="flex gap-2 mt-3">
        {isImage && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-zinc-600 text-gray-300 text-xs"
            onClick={() => onPreview(url)}
          >
            <Eye className="w-3 h-3 mr-1" />
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
            className="w-full border-zinc-600 text-gray-300 text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            {isPdf ? "Open PDF" : "Open"}
          </Button>
        </a>
      </div>
    </div>
  )
}
