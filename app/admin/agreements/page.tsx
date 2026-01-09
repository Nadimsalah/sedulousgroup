"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Search,
  FileSignature,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Download,
  Plus,
  Filter,
  CarIcon,
  Loader2,
  ChevronDown,
} from "lucide-react"
import { getBookingsAction } from "@/app/actions/requests"
import {
  createAgreementAction,
  getAgreementsByBookingAction,
  sendAgreementToCustomerAction,
} from "@/app/actions/agreements"
import { getCarsAction } from "@/app/actions/database"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 10

export default function AgreementsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [cars, setCars] = useState<any[]>([])
  const [agreements, setAgreements] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [loadedAgreementIds, setLoadedAgreementIds] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "signed">("all")
  const [bookingTypeFilter, setBookingTypeFilter] = useState<"all" | "Rent" | "Flexi Hire" | "PCO Hire">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "customer">("newest")

  useEffect(() => {
    loadData()
  }, [])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchTerm, statusFilter, bookingTypeFilter, sortBy])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [bookingsData, carsData] = await Promise.all([getBookingsAction(), getCarsAction()])

      const relevantBookings = bookingsData.filter(
        (b: any) => b.status === "Confirmed" || b.status === "On Rent" || b.status === "Approved",
      )
      setBookings(relevantBookings)
      setCars(carsData)

      // Load agreements for first batch in PARALLEL for faster loading
      const initialBookings = relevantBookings.slice(0, ITEMS_PER_PAGE)
      const loadedIds = new Set<string>()
      
      // Parallel loading - much faster!
      const agreementPromises = initialBookings.map(async (booking: any) => {
        const bookingAgreements = await getAgreementsByBookingAction(booking.id)
        return { bookingId: booking.id, agreements: bookingAgreements }
      })
      
      const results = await Promise.all(agreementPromises)
      const agreementsData: Record<string, any[]> = {}
      results.forEach(({ bookingId, agreements: agr }) => {
        agreementsData[bookingId] = agr
        loadedIds.add(bookingId)
      })
      
      setAgreements(agreementsData)
      setLoadedAgreementIds(loadedIds)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast.error("Failed to load agreements")
    } finally {
      setIsLoading(false)
    }
  }

  // Load agreements for visible bookings in PARALLEL
  const loadAgreementsForBookings = useCallback(async (bookingIds: string[]) => {
    const newIds = bookingIds.filter(id => !loadedAgreementIds.has(id))
    if (newIds.length === 0) return

    setIsLoadingMore(true)
    try {
      // Parallel loading - much faster!
      const agreementPromises = newIds.map(async (bookingId) => {
        const bookingAgreements = await getAgreementsByBookingAction(bookingId)
        return { bookingId, agreements: bookingAgreements }
      })
      
      const results = await Promise.all(agreementPromises)
      const newAgreements: Record<string, any[]> = {}
      results.forEach(({ bookingId, agreements: agr }) => {
        newAgreements[bookingId] = agr
      })
      
      setAgreements(prev => ({ ...prev, ...newAgreements }))
      setLoadedAgreementIds(prev => {
        const updated = new Set(prev)
        newIds.forEach(id => updated.add(id))
        return updated
      })
    } catch (error) {
      console.error("[v0] Error loading more agreements:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [loadedAgreementIds])

  const handleLoadMore = useCallback(() => {
    const newCount = displayCount + ITEMS_PER_PAGE
    setDisplayCount(newCount)
    
    // Load agreements for newly visible bookings
    const newlyVisibleBookings = bookings.slice(displayCount, newCount)
    loadAgreementsForBookings(newlyVisibleBookings.map(b => b.id))
  }, [displayCount, bookings, loadAgreementsForBookings])

  const handleCreateAgreement = async (bookingId: string) => {
    setProcessingBookingId(bookingId)
    const result = await createAgreementAction(bookingId)

    if (result.success) {
      toast.success("Agreement created successfully!")
      await loadData()
    } else {
      toast.error(result.error || "Failed to create agreement")
    }
    setProcessingBookingId(null)
  }

  const handleSendAgreement = async (agreementId: string) => {
    const result = await sendAgreementToCustomerAction(agreementId)

    if (result.success) {
      toast.success("Agreement sent to customer!")
      await loadData()
    } else {
      toast.error(result.error || "Failed to send agreement")
    }
  }

  const getCarName = (carId: string) => {
    const car = cars.find((c) => c.id === carId)
    return car ? `${car.brand} ${car.name}` : "Unknown Car"
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
      case "signed":
        return "bg-green-500/20 text-green-400 border border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30"
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      searchTerm === "" ||
      booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCarName(booking.carId).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = bookingTypeFilter === "all" || booking.bookingType === bookingTypeFilter

    const bookingAgreements = agreements[booking.id] || []
    const agreementStatus = bookingAgreements.length > 0 ? bookingAgreements[0].status?.toLowerCase() : "none"
    const matchesStatus = statusFilter === "all" || agreementStatus === statusFilter

    return matchesSearch && matchesType && (statusFilter === "all" || bookingAgreements.length > 0)
  })

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else {
      return (a.customerName || "").localeCompare(b.customerName || "")
    }
  })

  // Lazy loading: only display up to displayCount items
  const displayedBookings = sortedBookings.slice(0, displayCount)
  const hasMore = displayedBookings.length < sortedBookings.length

  const stats = {
    total: bookings.length,
    pending: Object.values(agreements)
      .flat()
      .filter((a) => a.status === "Pending").length,
    signed: Object.values(agreements)
      .flat()
      .filter((a) => a.status === "Signed").length,
    noAgreement: bookings.filter((b) => !agreements[b.id] || agreements[b.id].length === 0).length,
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="liquid-glass rounded-2xl p-4 md:p-6 border border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Agreements
              </h1>
              <p className="text-gray-400 mt-1">Track and manage rental agreements</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="liquid-glass border-white/10 hover:border-red-500/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Bookings</CardTitle>
              <FileText className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{isLoading ? "..." : stats.total}</div>
              <p className="text-xs text-white/60 mt-1">All confirmed bookings</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10 hover:border-yellow-500/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Pending Signature</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{isLoading ? "..." : stats.pending}</div>
              <p className="text-xs text-white/60 mt-1">Awaiting customer</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10 hover:border-green-500/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Signed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{isLoading ? "..." : stats.signed}</div>
              <p className="text-xs text-white/60 mt-1">Completed agreements</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10 hover:border-red-500/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">No Agreement</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{isLoading ? "..." : stats.noAgreement}</div>
              <p className="text-xs text-white/60 mt-1">Needs creation</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="liquid-glass rounded-2xl p-4 border border-white/10">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by customer name, email, booking ID, or car..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/50 border-white/20 text-white placeholder:text-gray-500 focus:border-red-500/50"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Status:</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(["all", "pending", "signed"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                        statusFilter === status
                          ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/50"
                          : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Booking Type:</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(["all", "Rent", "Flexi Hire", "PCO Hire"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setBookingTypeFilter(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        bookingTypeFilter === type
                          ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/50"
                          : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20"
                      }`}
                    >
                      {type === "all" ? "All" : type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:w-48">
                <label className="text-sm font-medium text-gray-300 mb-2 block">Sort By:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="customer">Customer Name</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Agreements List */}
        <div className="liquid-glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-3">
              Agreements ({sortedBookings.length})
              {displayedBookings.length < sortedBookings.length && (
                <span className="text-sm font-normal text-gray-400 ml-2">
                  Showing {displayedBookings.length} of {sortedBookings.length}
                </span>
              )}
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading agreements...</p>
              </div>
            ) : sortedBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="liquid-glass rounded-2xl border border-white/10 p-8 max-w-md mx-auto">
                  <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-white text-lg font-semibold mb-2">No agreements found</p>
                  <p className="text-gray-400 mb-6">No agreements match your current filters</p>
                  <Button
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setBookingTypeFilter("all")
                    }}
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedBookings.map((booking) => {
                  const bookingAgreements = agreements[booking.id] || []
                  const hasAgreement = bookingAgreements.length > 0
                  const isAgreementLoading = !loadedAgreementIds.has(booking.id)

                  return (
                    <div
                      key={booking.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                    >
                      {/* Booking Info */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {booking.customerName?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{getCarName(booking.carId)}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                              <span>{booking.id.substring(0, 8).toUpperCase()}</span>
                              <span>•</span>
                              <span>{booking.customerName}</span>
                              {booking.bookingType && (
                                <>
                                  <span>•</span>
                                  <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    {booking.bookingType}
                                  </Badge>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{booking.customerEmail}</p>
                          </div>
                        </div>
                        <Badge
                          className={
                            booking.status === "On Rent"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>

                      {/* Agreements or Create Button */}
                      {isAgreementLoading ? (
                        <div className="flex items-center justify-center py-4 text-gray-400">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          <span className="text-sm">Loading agreement...</span>
                        </div>
                      ) : hasAgreement ? (
                        <div className="space-y-2">
                          {bookingAgreements.map((agreement) => (
                            <div key={agreement.id} className="bg-black/30 border border-white/5 rounded-lg p-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1">
                                  <FileSignature className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white">{agreement.agreementNumber}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                                      <span>Created {new Date(agreement.createdAt).toLocaleDateString()}</span>
                                      {agreement.sentToCustomerAt && (
                                        <>
                                          <span>•</span>
                                          <span>Sent {new Date(agreement.sentToCustomerAt).toLocaleDateString()}</span>
                                        </>
                                      )}
                                      {agreement.signedAt && (
                                        <>
                                          <span>•</span>
                                          <span>Signed {new Date(agreement.signedAt).toLocaleDateString()}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  <Badge className={getStatusColor(agreement.status)}>{agreement.status}</Badge>
                                  <div className="flex gap-2">
                                    {agreement.status === "Pending" && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleSendAgreement(agreement.id)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white border-0"
                                      >
                                        <Send className="h-4 w-4 mr-1" />
                                        Send
                                      </Button>
                                    )}
                                    {agreement.signedAgreementUrl && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(agreement.signedAgreementUrl, "_blank")}
                                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleCreateAgreement(booking.id)}
                          disabled={processingBookingId === booking.id}
                          className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0"
                        >
                          {processingBookingId === booking.id ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                              Creating Agreement...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Agreement
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )
                })}

                {/* Load More Button */}
                {hasMore && (
                  <div ref={loadMoreRef} className="pt-4">
                    <Button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading more...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Load More ({sortedBookings.length - displayedBookings.length} remaining)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
