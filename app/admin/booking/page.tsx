"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle,
  Clock,
  Car,
  RefreshCw,
  MoreVertical,
  CreditCard,
  Plus,
  Search,
  Eye,
  Trash2,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { getAllBookingsAction, updateBookingStatusAction, type BookingWithDetails } from "@/app/actions/bookings"

export default function AdminBookingPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

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
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status?.toLowerCase().includes(statusFilter.toLowerCase()))
    }
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

  const handleViewDetails = (booking: BookingWithDetails) => {
    setSelectedBooking(booking)
    setShowDetailsDialog(true)
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
      case "cancelled":
        return "bg-red-500/10 text-red-500 border border-red-500/30"
      default:
        return "bg-gray-500/10 text-gray-500 border border-gray-500/30"
    }
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(
      (b) => b.status?.toLowerCase().includes("pending") || b.status?.toLowerCase() === "pending review",
    ).length,
    active: bookings.filter((b) => b.status?.toLowerCase() === "active").length,
    completed: bookings.filter((b) => b.status?.toLowerCase() === "completed").length,
    totalRevenue: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Bookings Management</h1>
            <p className="text-gray-400 mt-1">Manage all vehicle bookings and reservations</p>
          </div>
          <Button
            onClick={() => router.push("/admin/requests")}
            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active</CardTitle>
              <Car className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">£{stats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer, email, car, booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black border-zinc-700 text-white placeholder-gray-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "pending", "approved", "active", "completed", "cancelled"].map((status) => (
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
            <Button
              onClick={loadBookings}
              size="sm"
              variant="outline"
              className="border-zinc-700 bg-transparent"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">{error}</div>}

        {/* Bookings Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-gray-400 font-medium">Customer</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Vehicle</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Dates</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Amount</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Documents</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-zinc-700 border-t-red-500 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-gray-400 mt-4">Loading bookings...</p>
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{booking.customer_name || "N/A"}</p>
                          <p className="text-gray-400 text-sm">{booking.customer_email}</p>
                          <p className="text-gray-500 text-xs">{booking.customer_phone}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={booking.car_image || "/placeholder.svg?height=48&width=48&query=car"}
                              alt={booking.car_name || "Car"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-white font-medium">{booking.car_name || "N/A"}</p>
                            <p className="text-gray-400 text-sm">{booking.car_brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white">{booking.pickup_date}</p>
                        <p className="text-gray-400 text-sm">to {booking.dropoff_date}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-bold">£{booking.total_amount?.toFixed(2)}</p>
                      </td>
                      <td className="p-4">
                        {booking.documents_submitted_at ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Submitted
                          </span>
                        ) : booking.driving_license_front_url ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">
                            Partial
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-zinc-700 text-gray-400">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(booking)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin/agreement-steps/${booking.id}`)}
                                className="text-gray-300 cursor-pointer hover:bg-zinc-800"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Create Agreement
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(booking.id, "Active")}
                                className="text-gray-300 cursor-pointer hover:bg-zinc-800"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Active
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(booking.id, "Completed")}
                                className="text-gray-300 cursor-pointer hover:bg-zinc-800"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(booking.id, "Cancelled")}
                                className="text-red-400 cursor-pointer hover:bg-zinc-800"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancel Booking
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Full details for booking #{selectedBooking?.id?.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Customer Name</Label>
                  <p className="text-white font-medium">{selectedBooking.customer_name}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Email</Label>
                  <p className="text-white">{selectedBooking.customer_email}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Phone</Label>
                  <p className="text-white">{selectedBooking.customer_phone}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Vehicle</Label>
                  <p className="text-white">{selectedBooking.car_name}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Pickup Date</Label>
                  <p className="text-white">
                    {selectedBooking.pickup_date} at {selectedBooking.pickup_time}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400">Drop-off Date</Label>
                  <p className="text-white">
                    {selectedBooking.dropoff_date} at {selectedBooking.dropoff_time}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400">Pickup Location</Label>
                  <p className="text-white">{selectedBooking.pickup_location || "London"}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Drop-off Location</Label>
                  <p className="text-white">{selectedBooking.dropoff_location || "London"}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Total Amount</Label>
                  <p className="text-white font-bold text-xl">£{selectedBooking.total_amount?.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Status</Label>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>
              </div>
              {/* Documents Section */}
              {(selectedBooking.driving_license_front_url || selectedBooking.ni_number) && (
                <div className="pt-4 border-t border-zinc-800">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    Uploaded Documents
                    {selectedBooking.documents_submitted_at && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        Submitted
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedBooking.ni_number && (
                      <div className="bg-zinc-800 p-3 rounded-lg">
                        <Label className="text-gray-400 text-xs">NI Number</Label>
                        <p className="text-white font-mono">{selectedBooking.ni_number}</p>
                      </div>
                    )}
                    {selectedBooking.driving_license_number && (
                      <div className="bg-zinc-800 p-3 rounded-lg">
                        <Label className="text-gray-400 text-xs">License Number</Label>
                        <p className="text-white font-mono">{selectedBooking.driving_license_number}</p>
                      </div>
                    )}
                    {selectedBooking.driving_license_front_url && (
                      <a 
                        href={selectedBooking.driving_license_front_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-400 text-sm">License (Front)</span>
                      </a>
                    )}
                    {selectedBooking.driving_license_back_url && (
                      <a 
                        href={selectedBooking.driving_license_back_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-400 text-sm">License (Back)</span>
                      </a>
                    )}
                    {selectedBooking.proof_of_address_url && (
                      <a 
                        href={selectedBooking.proof_of_address_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-400 text-sm">Proof of Address</span>
                      </a>
                    )}
                    {selectedBooking.bank_statement_url && (
                      <a 
                        href={selectedBooking.bank_statement_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-400 text-sm">Bank Statement</span>
                      </a>
                    )}
                    {selectedBooking.private_hire_license_front_url && (
                      <a 
                        href={selectedBooking.private_hire_license_front_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-400 text-sm">Private Hire (Front)</span>
                      </a>
                    )}
                    {selectedBooking.private_hire_license_back_url && (
                      <a 
                        href={selectedBooking.private_hire_license_back_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-400 text-sm">Private Hire (Back)</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-zinc-800">
                <Button
                  onClick={() => {
                    setShowDetailsDialog(false)
                    router.push(`/admin/agreement-steps/${selectedBooking.id}`)
                  }}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Agreement
                </Button>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="border-zinc-700">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
