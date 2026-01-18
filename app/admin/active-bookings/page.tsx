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
  DollarSign,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Loader2,
  ChevronDown,
  ArrowUpDown,
  MessageCircle,
  CalendarClock,
  CheckCheck,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllBookingsAction, type BookingWithDetails } from "@/app/actions/bookings"
import Link from "next/link"
import Image from "next/image"

const ITEMS_PER_PAGE = 10

type StatusFilter = "all" | "overdue" | "due_today" | "due_week" | "normal"
type SortOption = "return_asc" | "return_desc" | "start_desc" | "revenue_desc" | "customer_asc"

export default function ActiveBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [fleetSize, setFleetSize] = useState(0)

  // New filters and sorting
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("return_asc")

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    filterAndSortBookings()
  }, [bookings, searchQuery, statusFilter, sortBy])

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchQuery, statusFilter])

  const loadBookings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await getAllBookingsAction()
      if (result?.success && result?.data) {
        // Show all bookings except completed, cancelled, or rejected
        const activeBookings = result.data.filter((b) => {
          const status = (b.status || "").toLowerCase()
          const excludedStatuses = ["completed", "cancelled", "rejected"]
          return !excludedStatuses.includes(status)
        })
        setBookings(activeBookings)
      } else {
        setError(result?.error || "Failed to load bookings")
      }

      const { getFleetStatsAction } = await import("@/app/actions/bookings")
      const fleetResult = await getFleetStatsAction()
      if (fleetResult.success) {
        setFleetSize(fleetResult.totalCars)
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

  const getDaysRemaining = (dropoffDate: string) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset to start of day
    const dropoff = new Date(dropoffDate)
    dropoff.setHours(0, 0, 0, 0) // Reset to start of day
    const diffTime = dropoff.getTime() - now.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getTotalDays = (pickupDate: string, dropoffDate: string) => {
    const pickup = new Date(pickupDate)
    pickup.setHours(0, 0, 0, 0)
    const dropoff = new Date(dropoffDate)
    dropoff.setHours(0, 0, 0, 0)
    const diffTime = dropoff.getTime() - pickup.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(1, diffDays)
  }

  const getCurrentDay = (pickupDate: string) => {
    const pickup = new Date(pickupDate)
    pickup.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diffTime = now.getTime() - pickup.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(1, diffDays + 1) // +1 because day 1 starts on pickup date
  }

  const getProgress = (pickupDate: string, dropoffDate: string) => {
    const total = getTotalDays(pickupDate, dropoffDate)
    const current = getCurrentDay(pickupDate)
    return Math.min(100, Math.max(0, (current / total) * 100))
  }

  const isOverdue = (dropoffDate: string) => getDaysRemaining(dropoffDate) < 0
  const isDueToday = (dropoffDate: string) => getDaysRemaining(dropoffDate) === 0
  const isDueThisWeek = (dropoffDate: string) => {
    const days = getDaysRemaining(dropoffDate)
    return days >= 0 && days <= 7
  }

  const getStatusCategory = (booking: BookingWithDetails): StatusFilter => {
    if (isOverdue(booking.dropoff_date)) return "overdue"
    if (isDueToday(booking.dropoff_date)) return "due_today"
    if (isDueThisWeek(booking.dropoff_date)) return "due_week"
    return "normal"
  }

  const filterAndSortBookings = () => {
    let filtered = bookings

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => getStatusCategory(b) === statusFilter)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.customer_name?.toLowerCase().includes(query) ||
          b.customer_email?.toLowerCase().includes(query) ||
          b.customer_phone?.toLowerCase().includes(query) ||
          b.car_name?.toLowerCase().includes(query) ||
          b.car_brand?.toLowerCase().includes(query) ||
          b.id?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "return_asc":
          return new Date(a.dropoff_date).getTime() - new Date(b.dropoff_date).getTime()
        case "return_desc":
          return new Date(b.dropoff_date).getTime() - new Date(a.dropoff_date).getTime()
        case "start_desc":
          return new Date(b.pickup_date).getTime() - new Date(a.pickup_date).getTime()
        case "revenue_desc":
          return (b.total_amount || 0) - (a.total_amount || 0)
        case "customer_asc":
          return (a.customer_name || "").localeCompare(b.customer_name || "")
        default:
          return 0
      }
    })

    setFilteredBookings(sorted)
  }

  const stats = {
    total: bookings.length,
    overdue: bookings.filter((b) => isOverdue(b.dropoff_date)).length,
    dueToday: bookings.filter((b) => isDueToday(b.dropoff_date)).length,
    dueWeek: bookings.filter((b) => isDueThisWeek(b.dropoff_date)).length,
    totalRevenue: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
    available: Math.max(0, fleetSize - bookings.length),
  }

  const displayedBookings = filteredBookings.slice(0, displayCount)
  const hasMore = displayedBookings.length < filteredBookings.length

  const getStatusColor = (booking: BookingWithDetails) => {
    const category = getStatusCategory(booking)
    switch (category) {
      case "overdue": return { border: "border-red-500", bg: "bg-red-500/10", text: "text-red-400", badge: "bg-red-500/20 text-red-400 border-red-500/30" }
      case "due_today": return { border: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-400 border-orange-500/30" }
      case "due_week": return { border: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }
      default: return { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" }
    }
  }

  const getStatusLabel = (booking: BookingWithDetails) => {
    const days = getDaysRemaining(booking.dropoff_date)
    if (days < 0) return `${Math.abs(days)} days overdue`
    if (days === 0) return "Due today"
    if (days === 1) return "Due tomorrow"
    return `${days} days remaining`
  }

  return (
    <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Active Bookings</h1>
            <p className="text-white/40 text-sm mt-1">Manage all vehicles currently on rent</p>
          </div>
          <Button
            onClick={loadBookings}
            variant="outline"
            size="sm"
            className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Sync Fleet
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Total Active", value: stats.total, icon: Car, color: "text-green-400" },
            { label: "Overdue", value: stats.overdue, icon: AlertCircle, color: "text-red-400" },
            { label: "Due Today", value: stats.dueToday, icon: Clock, color: "text-orange-400" },
            { label: "Due This Week", value: stats.dueWeek, icon: Calendar, color: "text-yellow-400" },
            { label: "Active Revenue", value: `£${stats.totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "text-blue-400" },
            { label: "Available", value: stats.available, icon: CheckCircle, color: "text-emerald-400" },
          ].map((stat, i) => (
            <div key={i} className="liquid-glass p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest truncate">{stat.label}</p>
                  <p className="text-lg font-bold text-white mt-0.5">{isLoading ? "..." : stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="liquid-glass p-4 rounded-xl border border-white/10 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <Input
                placeholder="Search by customer, car, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black border-white/5 text-white placeholder:text-white/20 h-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "all", label: "All", count: bookings.length },
                { value: "overdue", label: "Overdue", count: stats.overdue },
                { value: "due_today", label: "Today", count: stats.dueToday },
                { value: "due_week", label: "This Week", count: stats.dueWeek },
                { value: "normal", label: "Normal", count: bookings.length - stats.overdue - stats.dueToday - stats.dueWeek },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value as StatusFilter)}
                  className={
                    statusFilter === filter.value
                      ? "bg-red-500 hover:bg-red-600 text-white h-10"
                      : "border-white/5 text-white/40 hover:text-white h-10"
                  }
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-white/10 text-white text-xs px-1.5 h-5">
                      {filter.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[200px] bg-black border-white/5 text-white h-10">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10 text-white">
                <SelectItem value="return_asc">Return Date ↑</SelectItem>
                <SelectItem value="return_desc">Return Date ↓</SelectItem>
                <SelectItem value="start_desc">Start Date (Latest)</SelectItem>
                <SelectItem value="revenue_desc">Revenue (High-Low)</SelectItem>
                <SelectItem value="customer_asc">Customer A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="liquid-glass border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="liquid-glass rounded-xl p-6 border border-white/10 animate-pulse h-40" />
            ))}
          </div>
        ) : displayedBookings.length === 0 ? (
          <div className="liquid-glass p-20 rounded-xl border border-white/10 text-center">
            <Car className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white font-medium">No active bookings found</p>
            <p className="text-sm text-white/40 mt-1">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedBookings.map((booking) => {
              const colors = getStatusColor(booking)
              const totalDays = getTotalDays(booking.pickup_date, booking.dropoff_date)
              const currentDay = getCurrentDay(booking.pickup_date)
              const progress = getProgress(booking.pickup_date, booking.dropoff_date)

              return (
                <div
                  key={booking.id}
                  className={`liquid-glass rounded-xl p-5 border-l-4 ${colors.border} hover:bg-white/[0.03] transition-all`}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Car Image */}
                    <div className="w-full lg:w-32 h-32 rounded-lg overflow-hidden bg-white/5 shrink-0">
                      {booking.car_image ? (
                        <Image
                          src={booking.car_image}
                          alt={booking.car_name || "Car"}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-12 h-12 text-white/10" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">{booking.car_name || "Unknown Vehicle"}</h3>
                          <p className="text-sm text-white/40">{booking.car_brand}</p>
                        </div>
                        <Badge className={`${colors.badge} border uppercase text-xs font-bold px-2 py-1`}>
                          {getStatusLabel(booking)}
                        </Badge>
                      </div>

                      {/* Customer & Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-white/60">
                            <User className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-white">{booking.customer_name || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/60">
                            <Phone className="w-4 h-4 text-green-400" />
                            <span className="text-sm">{booking.customer_phone || "No phone"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/60">
                            <Mail className="w-4 h-4 text-purple-400" />
                            <span className="text-sm truncate">{booking.customer_email || "No email"}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-white/60">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm">
                              <span className="text-white/40">Pickup:</span>{" "}
                              <span className="text-white">{new Date(booking.pickup_date).toLocaleDateString()}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-white/60">
                            <CalendarClock className="w-4 h-4 text-orange-400" />
                            <span className="text-sm">
                              <span className="text-white/40">Return:</span>{" "}
                              <span className={colors.text}>{new Date(booking.dropoff_date).toLocaleDateString()}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-white/60">
                            <DollarSign className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm">
                              <span className="text-white/40">Total:</span>{" "}
                              <span className="text-white font-bold">£{(booking.total_amount || 0).toFixed(2)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs text-white/40 mb-2">
                          <span>Day {currentDay} of {totalDays}</span>
                          <span>{Math.round(progress)}% complete</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors.bg} transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2 lg:w-32 shrink-0">
                      <Link href={`/admin/bookings/${booking.id}`} className="flex-1 lg:flex-none">
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 lg:flex-none border-white/10 text-white/60 hover:text-white h-9"
                        onClick={() => window.open(`tel:${booking.customer_phone}`, "_self")}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 lg:flex-none border-white/10 text-white/60 hover:text-white h-9"
                        onClick={() => window.open(`mailto:${booking.customer_email}`, "_blank")}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Load More */}
            {hasMore && (
              <Button
                onClick={handleLoadMore}
                variant="outline"
                className="w-full border-white/5 bg-white/[0.02] text-white/40 hover:text-white h-12"
              >
                Load more bookings <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
