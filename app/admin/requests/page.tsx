"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAllBookingsAction, updateBookingStatusAction, type BookingWithDetails } from "@/app/actions/bookings"

export default function AdminRequestsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchQuery, statusFilter])

  const loadBookings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getAllBookingsAction()

      if (result?.success && result?.data) {
        setBookings(result.data)
      } else {
        setError(result?.error || "Failed to load bookings")
      }
    } catch (err) {
      setError("An error occurred while loading bookings")
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
                  <p className="text-3xl font-bold text-white mt-2">{value}</p>
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
          </h2>

          {isLoading ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <div className="inline-block">
                <div className="w-8 h-8 border-4 border-zinc-700 border-t-red-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400 mt-4">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">No bookings found</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
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
                    {(booking.status?.toLowerCase().includes("pending") ||
                      booking.status?.toLowerCase() === "pending review") && (
                      <Button
                        onClick={() => handleApprove(booking.id)}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
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
                          onClick={() => handleStatusChange(booking.id, "Rejected")}
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
        </div>
      </div>
    </div>
  )
}
