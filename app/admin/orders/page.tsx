"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, ChevronRight, ChevronDown, Filter, Mail, Phone, Search, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const ITEMS_PER_PAGE = 15

type OrderType = {
  id: string
  type: "booking" | "sales"
  customerName: string
  customerEmail: string
  customerPhone: string
  carId: string
  carName: string
  status: string
  createdAt: string
  totalAmount?: number
  pickupDate?: string
  dropoffDate?: string
  pickupLocation?: string
  preferredDate?: string
  message?: string
}

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<OrderType[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [searchQuery, statusFilter, typeFilter, orders])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchQuery, statusFilter, typeFilter])

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE)
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })

      if (bookingsError) throw bookingsError

      const { data: cars, error: carsError } = await supabase.from("cars").select("*")

      if (carsError) throw carsError

      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*")

      if (profilesError) throw profilesError

      const allOrders: OrderType[] = (bookings || []).map((booking: any) => {
        const car = cars?.find((c: any) => c.id === booking.car_id)
        const profile = profiles?.find((p: any) => p.id === booking.user_id)

        return {
          id: booking.id,
          type: "booking" as const,
          customerName: profile?.full_name || booking.customer_name || "Unknown Customer",
          customerEmail: profile?.email || booking.customer_email || "N/A",
          customerPhone: booking.customer_phone || profile?.phone || "N/A",
          carId: booking.car_id,
          carName: car ? `${car.brand} ${car.name}` : booking.car_name || "Unknown Vehicle",
          status: booking.status,
          createdAt: booking.created_at,
          totalAmount: booking.total_amount,
          pickupDate: booking.pickup_date,
          dropoffDate: booking.dropoff_date,
          pickupLocation: booking.pickup_location || "N/A",
        }
      })

      setOrders(allOrders)
      setFilteredOrders(allOrders)
    } catch (error) {
      console.error("Error loading orders:", error)
      setError("Failed to load orders. Please refresh the page.")
      setOrders([])
      setFilteredOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.customerName.toLowerCase().includes(query) ||
          order.customerEmail.toLowerCase().includes(query) ||
          order.customerPhone.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query) ||
          order.carName.toLowerCase().includes(query),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status.toLowerCase() === statusFilter.toLowerCase())
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((order) => order.type === typeFilter)
    }

    setFilteredOrders(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "confirmed":
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "active":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "cancelled":
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "completed":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      default:
        return "bg-white/10 text-white/70 border-white/20"
    }
  }

  const getTypeColor = (type: string) => {
    return type === "booking"
      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
      : "bg-purple-500/20 text-purple-400 border-purple-500/30"
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const bookingStats = {
    totalBookings: orders.filter((o) => o.type === "booking").length,
    activeCount: orders.filter((o) => o.status.toLowerCase() === "active").length,
    pendingCount: orders.filter((o) => o.status.toLowerCase() === "pending").length,
    completedCount: orders.filter((o) => o.status.toLowerCase() === "completed").length,
  }

  // Lazy loading
  const displayedOrders = filteredOrders.slice(0, displayCount)
  const hasMore = displayedOrders.length < filteredOrders.length

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Bookings Schedule</h1>
          <p className="text-white/60 text-sm mt-1">Complete database of bookings and requests</p>
        </div>

        {error && (
          <div className="liquid-glass border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="liquid-glass border border-white/10 rounded-xl p-4">
            <div className="text-sm font-medium text-white/80 mb-2">Total Bookings</div>
            <div className="text-3xl font-bold text-white">
              {isLoading ? <span className="animate-pulse">...</span> : bookingStats.totalBookings}
            </div>
          </div>

          <div className="liquid-glass border border-white/10 rounded-xl p-4">
            <div className="text-sm font-medium text-white/80 mb-2">Active Rentals</div>
            <div className="text-3xl font-bold text-blue-400">
              {isLoading ? <span className="animate-pulse">...</span> : bookingStats.activeCount}
            </div>
          </div>

          <div className="liquid-glass border border-white/10 rounded-xl p-4">
            <div className="text-sm font-medium text-white/80 mb-2">Pending</div>
            <div className="text-3xl font-bold text-yellow-400">
              {isLoading ? <span className="animate-pulse">...</span> : bookingStats.pendingCount}
            </div>
          </div>

          <div className="liquid-glass border border-white/10 rounded-xl p-4">
            <div className="text-sm font-medium text-white/80 mb-2">Completed</div>
            <div className="text-3xl font-bold text-purple-400">
              {isLoading ? <span className="animate-pulse">...</span> : bookingStats.completedCount}
            </div>
          </div>
        </div>

        <div className="liquid-glass border border-white/10 rounded-xl p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
            />
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-white/80 hover:text-white hover:bg-white/10 md:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <div className="hidden md:flex gap-3 flex-1">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="all">All Types</option>
                <option value="booking">Bookings</option>
                <option value="sales">Sales Requests</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="text-sm text-white/60">
              {filteredOrders.length} of {orders.length}
            </div>
          </div>

          {showFilters && (
            <div className="md:hidden space-y-3 pt-2 border-t border-white/10">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="all">All Types</option>
                <option value="booking">Bookings</option>
                <option value="sales">Sales Requests</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="liquid-glass border border-white/10 rounded-xl p-4 animate-pulse">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-white/10 rounded w-1/4" />
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                  </div>
                  <div className="h-6 w-6 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="liquid-glass border border-white/10 rounded-xl p-12 text-center">
            <Calendar className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No orders found</p>
            <p className="text-sm text-white/40 mt-1">
              {orders.length === 0 ? "No orders in database yet" : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedOrders.map((order) => {
              const startDate = order.pickupDate ? new Date(order.pickupDate) : null
              const endDate = order.dropoffDate ? new Date(order.dropoffDate) : null
              const days =
                startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

              return (
                <div
                  key={order.id}
                  className="liquid-glass border border-white/10 hover:border-red-500/30 transition-all cursor-pointer rounded-xl p-4"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded border ${getTypeColor(order.type)}`}
                          >
                            Rental
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <h3 className="text-white font-medium truncate">{order.carName}</h3>
                        <p className="text-xs text-white/50 truncate">Booking ID: {order.id.slice(0, 13)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/40 flex-shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-white/70">
                        <User className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium text-white">{order.customerName}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-white/70">
                        <Mail className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <span className="truncate">{order.customerEmail}</span>
                      </div>

                      {order.pickupDate && (
                        <div className="flex items-center gap-2 text-white/70">
                          <Calendar className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <span className="truncate">
                            {formatDate(order.pickupDate)} - {formatDate(order.dropoffDate || order.pickupDate)}
                          </span>
                        </div>
                      )}

                      {days > 0 && (
                        <div className="text-xs text-white/50">
                          {days} {days === 1 ? "day" : "days"}
                        </div>
                      )}
                    </div>

                    {order.totalAmount && (
                      <div className="pt-3 border-t border-white/10">
                        <div className="text-lg font-bold text-white">£{order.totalAmount.toFixed(2)}</div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 hover:border-red-500/50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedOrder(order)
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )
            })}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-4">
                <Button
                  onClick={handleLoadMore}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Load More ({filteredOrders.length - displayedOrders.length} remaining)
                </Button>
              </div>
            )}
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
            <div className="relative liquid-glass border border-white/20 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
              <div className="sticky top-0 bg-black/80 backdrop-blur-lg border-b border-white/10 z-10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-white text-lg font-bold">Order Details</div>
                    <div className="text-white/60 text-sm">ID: {selectedOrder.id}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(null)}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <div className="text-white/80 text-sm font-medium mb-3">Customer Information</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-red-500" />
                      <span className="text-white">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-red-500" />
                      <span className="text-white/70">{selectedOrder.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-red-500" />
                      <span className="text-white/70">{selectedOrder.customerPhone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-white/80 text-sm font-medium mb-3">Order Information</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Type</span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${getTypeColor(selectedOrder.type)}`}
                      >
                        Rental
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Status</span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(selectedOrder.status)}`}
                      >
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Vehicle</span>
                      <span className="text-white">{selectedOrder.carName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Created</span>
                      <span className="text-white">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.type === "booking" && (
                  <div>
                    <div className="text-white/80 text-sm font-medium mb-3">Rental Details</div>
                    <div className="space-y-2 text-sm">
                      {selectedOrder.pickupDate && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Pickup Date</span>
                          <span className="text-white">{formatDate(selectedOrder.pickupDate)}</span>
                        </div>
                      )}
                      {selectedOrder.dropoffDate && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Return Date</span>
                          <span className="text-white">{formatDate(selectedOrder.dropoffDate)}</span>
                        </div>
                      )}
                      {selectedOrder.pickupLocation && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Location</span>
                          <span className="text-white">{selectedOrder.pickupLocation}</span>
                        </div>
                      )}
                      {selectedOrder.totalAmount && (
                        <div className="flex justify-between pt-2 border-t border-white/10">
                          <span className="text-white/60 font-medium">Total Amount</span>
                          <span className="text-white font-bold">£{selectedOrder.totalAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
