"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Car,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Loader2,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllBookingsAction, type BookingWithDetails } from "@/app/actions/bookings"
import Link from "next/link"
import Image from "next/image"

const ITEMS_PER_PAGE = 10

export default function ActiveBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchQuery])

  // Reset display count when search changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchQuery])

  const loadBookings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await getAllBookingsAction()
      if (result?.success && result?.data) {
        // Filter for active bookings only
        const activeBookings = result.data.filter((b) => {
          const status = (b.status || "").toLowerCase()
          return ["active", "approved", "confirmed"].includes(status)
        })
        setBookings(activeBookings)
      } else {
        setError(result?.error || "Failed to load bookings")
      }
    } catch (err) {
      setError("An error occurred while loading bookings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE)
  }, [])

  const filterBookings = () => {
    let filtered = bookings
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.customer_name?.toLowerCase().includes(query) ||
          b.customer_email?.toLowerCase().includes(query) ||
          b.customer_phone?.toLowerCase().includes(query) ||
          b.car_name?.toLowerCase().includes(query) ||
          b.car_brand?.toLowerCase().includes(query) ||
          b.id?.toLowerCase().includes(query),
      )
    }
    setFilteredBookings(filtered)
  }

  const getDaysRemaining = (dropoffDate: string) => {
    const now = new Date()
    const dropoff = new Date(dropoffDate)
    const diffTime = dropoff.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isOverdue = (dropoffDate: string) => {
    return getDaysRemaining(dropoffDate) < 0
  }

  const stats = {
    total: bookings.length,
    overdue: bookings.filter((b) => isOverdue(b.dropoff_date)).length,
    dueToday: bookings.filter((b) => {
      const days = getDaysRemaining(b.dropoff_date)
      return days === 0
    }).length,
    totalRevenue: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
  }

  // Lazy loading variables
  const displayedBookings = filteredBookings.slice(0, displayCount)
  const hasMore = displayedBookings.length < filteredBookings.length

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="liquid-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Active Bookings
              </h1>
              <p className="text-gray-400 mt-2">All cars currently on rent</p>
            </div>
            <Button
              onClick={loadBookings}
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Active</CardTitle>
              <Car className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoading ? <span className="animate-pulse">...</span> : stats.total}
              </div>
              <p className="text-xs text-white/60 mt-1">Cars on rent</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {isLoading ? <span className="animate-pulse">...</span> : stats.overdue}
              </div>
              <p className="text-xs text-white/60 mt-1">Past return date</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Due Today</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {isLoading ? <span className="animate-pulse">...</span> : stats.dueToday}
              </div>
              <p className="text-xs text-white/60 mt-1">Returning today</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoading ? <span className="animate-pulse">...</span> : `£${stats.totalRevenue.toFixed(2)}`}
              </div>
              <p className="text-xs text-white/60 mt-1">From active rentals</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="liquid-glass rounded-2xl p-4 border border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by customer name, email, phone, or car..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/50 border-white/20 text-white placeholder:text-gray-500 focus:border-red-500/50"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="liquid-glass border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="liquid-glass rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 flex items-start gap-4">
                    <div className="w-24 h-24 rounded-lg bg-white/10" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-white/10 rounded w-1/3" />
                      <div className="h-4 bg-white/5 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="lg:w-64 space-y-3">
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="liquid-glass rounded-2xl p-12 border border-white/10 text-center">
            <Car className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No active bookings found</p>
            <p className="text-gray-500 text-sm mt-2">
              {searchQuery ? "Try a different search term" : "All cars are currently available"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedBookings.map((booking) => {
              const daysRemaining = getDaysRemaining(booking.dropoff_date)
              const overdue = isOverdue(booking.dropoff_date)

              return (
                <div
                  key={booking.id}
                  className={`liquid-glass rounded-2xl p-6 border ${
                    overdue
                      ? "border-red-500/30 bg-red-500/5"
                      : daysRemaining === 0
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : "border-white/10"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Car Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {booking.car_image && (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/5 shrink-0">
                            <Image
                              src={booking.car_image}
                              alt={booking.car_name || "Car"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">
                              {booking.car_brand} {booking.car_name}
                            </h3>
                            <Badge
                              className={
                                overdue
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : daysRemaining === 0
                                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                    : "bg-green-500/20 text-green-400 border border-green-500/30"
                              }
                            >
                              {overdue
                                ? `Overdue by ${Math.abs(daysRemaining)} days`
                                : daysRemaining === 0
                                  ? "Due Today"
                                  : `${daysRemaining} days remaining`}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm">Booking ID: {booking.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="lg:w-64 space-y-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Customer</p>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-red-400" />
                          <p className="text-sm font-medium text-white">{booking.customer_name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Contact</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-500" />
                            <p className="text-xs text-gray-300 break-all">{booking.customer_email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <p className="text-xs text-gray-300">{booking.customer_phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rental Period */}
                    <div className="lg:w-64 space-y-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Pickup</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-white">
                              {new Date(booking.pickup_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">{booking.pickup_time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <p className="text-xs text-gray-300">{booking.pickup_location}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Dropoff</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-red-400" />
                          <div>
                            <p className="text-sm font-medium text-white">
                              {new Date(booking.dropoff_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">{booking.dropoff_time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <p className="text-xs text-gray-300">{booking.dropoff_location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="lg:w-48 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-white">£{booking.total_amount?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Link href={`/admin/agreement-steps/${booking.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
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
                  Load More ({filteredBookings.length - displayedBookings.length} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

