"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Search, Plus, Send, Check, X, FileText, KeyRound as Pound, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAllBookingsAction } from "@/app/actions/bookings"
import { getCarsAction } from "@/app/actions/database"
import { getAgreementsByBookingAction } from "@/app/actions/agreements"
import {
  createPCNTicketAction,
  getAllPCNTicketsAction,
  getPCNsByAgreementAction,
  sendPCNToCustomerAction,
  updatePCNTicketStatusAction,
} from "@/app/actions/pcn-tickets"
import { toast } from "sonner"

interface BookingWithAgreement {
  booking: any
  agreement: any | null
  tickets: any[]
  displayedTickets: number // How many tickets are currently displayed
  hasMoreTickets: boolean // Whether there are more tickets to load
  car: any | null
}

export default function PCNTicketsPage() {
  const [allBookingsWithAgreements, setAllBookingsWithAgreements] = useState<BookingWithAgreement[]>([]) // All loaded bookings
  const [displayedBookings, setDisplayedBookings] = useState<BookingWithAgreement[]>([]) // Currently displayed (5 at a time)
  const [displayedCount, setDisplayedCount] = useState(5) // How many bookings to show
  const [cars, setCars] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAgreements, setIsLoadingAgreements] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Form state
  const [ticketType, setTicketType] = useState<"parking" | "speeding" | "congestion" | "other">("parking")
  const [ticketNumber, setTicketNumber] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [ticketDocumentUrl, setTicketDocumentUrl] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  // Store all active bookings (without agreements/tickets loaded yet)
  const [allActiveBookings, setAllActiveBookings] = useState<any[]>([])

  const loadBookingsWithAgreements = async (bookingsToLoad: any[], append: boolean = false) => {
    setIsLoadingAgreements(true)
    try {
      const carsData = cars.length > 0 ? cars : await getCarsAction()
      if (carsData.length > 0 && cars.length === 0) {
        setCars(carsData)
      }

      const bookingsData: BookingWithAgreement[] = []

      // Load agreements and tickets for the provided bookings
      const batchSize = 5
      for (let i = 0; i < bookingsToLoad.length; i += batchSize) {
        const batch = bookingsToLoad.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (booking: any) => {
          try {
            // Get agreements for this booking
            const bookingAgreements = await getAgreementsByBookingAction(booking.id)
            
            // Find signed or pending agreement
            const agreement = bookingAgreements.find((a: any) => {
              const status = (a.status || "").toLowerCase()
              return ["signed", "active", "confirmed", "pending", "sent"].includes(status)
            })

            // Get only first 5 tickets for fast loading
            let ticketsForAgreement: any[] = []
            let hasMoreTickets = false
            if (agreement) {
              // Fetch first 6 tickets to check if there are more (5 + 1 to check)
              const ticketsWithCheck = await getPCNsByAgreementAction(agreement.id, 6)
              hasMoreTickets = ticketsWithCheck.length > 5
              // Only store first 5 tickets initially
              ticketsForAgreement = ticketsWithCheck.slice(0, 5)
            }

            // Find car
            const car = carsData?.find((c: any) => c.id === booking.car_id || c.id === booking.carId)

            return {
              booking,
              agreement,
              tickets: ticketsForAgreement, // Only first 5 tickets initially
              displayedTickets: ticketsForAgreement.length, // Display all loaded tickets
              hasMoreTickets,
              car,
            }
          } catch (err) {
            console.error(`Error loading data for booking ${booking.id}:`, err)
            return {
              booking,
              agreement: null,
              tickets: [],
              displayedTickets: 0,
              hasMoreTickets: false,
              car: null,
            }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        bookingsData.push(...batchResults)
      }

      // Filter to only show bookings with agreements (signed or pending)
      const bookingsWithAgreementsOnly = bookingsData.filter((item) => item.agreement !== null)

      if (append) {
        setAllBookingsWithAgreements((prev) => [...prev, ...bookingsWithAgreementsOnly])
        setDisplayedBookings((prev) => [...prev, ...bookingsWithAgreementsOnly])
      } else {
        setAllBookingsWithAgreements(bookingsWithAgreementsOnly)
        setDisplayedBookings(bookingsWithAgreementsOnly)
      }
    } catch (error) {
      console.error("Error loading bookings with agreements:", error)
      toast.error("Failed to load agreements and tickets")
    } finally {
      setIsLoadingAgreements(false)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load cars first (needed for display)
      const carsData = await getCarsAction()
      setCars(carsData || [])

      // Load all bookings
      const bookingsResult = await getAllBookingsAction()
      const allBookings = bookingsResult.success ? bookingsResult.data : []

      // Filter for active bookings
      const activeBookings = allBookings.filter((b: any) => {
        const status = (b.status || "").toLowerCase()
        return ["active", "approved", "confirmed", "on rent", "completed"].includes(status)
      })

      // Store all active bookings for pagination
      setAllActiveBookings(activeBookings)

      // Load only first 5 bookings with their agreements and tickets
      const firstBatch = activeBookings.slice(0, 5)
      if (firstBatch.length > 0) {
        await loadBookingsWithAgreements(firstBatch, false)
        setDisplayedCount(5)
      } else {
        // If no bookings, still set empty state
        setAllBookingsWithAgreements([])
        setDisplayedBookings([])
        setDisplayedCount(0)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load PCN tickets data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()
      setTicketDocumentUrl(url)
      toast.success("Document uploaded successfully")
    } catch (error) {
      console.error("Error uploading document:", error)
      toast.error("Failed to upload document")
    }

    setIsUploading(false)
  }

  const handleSubmitTicket = async () => {
    if (!selectedBooking) return

    if (!ticketDocumentUrl) {
      toast.error("Please upload ticket document")
      return
    }

    if (!amount) {
      toast.error("Please enter ticket amount")
      return
    }

    if (!issueDate) {
      toast.error("Please enter issue date")
      return
    }

    setIsCreatingTicket(true)

    try {
      // Find agreement for this booking
      const bookingData = allBookingsWithAgreements.find((item) => item.booking.id === selectedBooking.id)
      const agreement = bookingData?.agreement

      if (!agreement) {
        toast.error("No agreement found for this booking")
        setIsCreatingTicket(false)
        return
      }

      const result = await createPCNTicketAction({
        agreementId: agreement.id,
        bookingId: selectedBooking.id,
        customerId: selectedBooking.user_id || undefined,
        vehicleId: selectedBooking.car_id || selectedBooking.carId || undefined,
        ticketType,
        ticketNumber: ticketNumber || undefined,
        issueDate,
        dueDate: dueDate || undefined,
        amount: Number.parseFloat(amount),
        ticketDocumentUrl,
        notes: notes || undefined,
      })

      if (result.success) {
        toast.success("PCN Ticket created successfully!")
        setShowCreateDialog(false)
        setSelectedBooking(null)
        // Reset form
        setTicketType("parking")
        setTicketNumber("")
        setIssueDate("")
        setDueDate("")
        setAmount("")
        setNotes("")
        setTicketDocumentUrl("")
        // Reload data
        await loadData()
      } else {
        toast.error(result.error || "Failed to create ticket")
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
      toast.error("Failed to create ticket")
    } finally {
      setIsCreatingTicket(false)
    }
  }

  const handleSendTicket = async (ticketId: string) => {
    const result = await sendPCNToCustomerAction(ticketId)

    if (result.success) {
      toast.success("Ticket sent to customer!")
      await loadData()
    } else {
      toast.error(result.error || "Failed to send ticket")
    }
  }

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    const result = await updatePCNTicketStatusAction(ticketId, status)

    if (result.success) {
      toast.success("Ticket status updated!")
      await loadData()
    } else {
      toast.error(result.error || "Failed to update status")
    }
  }

  const handleLoadMoreTickets = async (bookingId: string) => {
    const item = allBookingsWithAgreements.find((item) => item.booking.id === bookingId)
    if (!item || !item.agreement) return

    try {
      // Load all remaining tickets for this agreement
      const allTickets = await getPCNsByAgreementAction(item.agreement.id)
      
      // Update both all bookings and displayed bookings
      setAllBookingsWithAgreements((prev) =>
        prev.map((b) =>
          b.booking.id === bookingId
            ? {
                ...b,
                tickets: allTickets, // Show all tickets now
                displayedTickets: allTickets.length,
                hasMoreTickets: false, // No more to load
              }
            : b
        )
      )
      
      setDisplayedBookings((prev) =>
        prev.map((b) =>
          b.booking.id === bookingId
            ? {
                ...b,
                tickets: allTickets,
                displayedTickets: allTickets.length,
                hasMoreTickets: false,
              }
            : b
        )
      )
    } catch (error) {
      console.error("Error loading more tickets:", error)
      toast.error("Failed to load more tickets")
    }
  }

  const handleLoadMoreBookings = async () => {
    setIsLoadingMore(true)
    try {
      // Calculate which bookings to load next
      const nextCount = displayedCount + 5
      const bookingsToLoad = allActiveBookings.slice(displayedCount, nextCount)
      
      if (bookingsToLoad.length > 0) {
        // Load agreements and tickets for the next 5 bookings
        await loadBookingsWithAgreements(bookingsToLoad, true)
        setDisplayedCount(nextCount)
      }
    } catch (error) {
      console.error("Error loading more bookings:", error)
      toast.error("Failed to load more bookings")
    } finally {
      setIsLoadingMore(false)
    }
  }

  const getCarName = (carId: string | null | undefined) => {
    if (!carId) return "Unknown Car"
    const car = cars.find((c) => c.id === carId)
    return car?.name || "Unknown Car"
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: "bg-yellow-500/20", text: "text-yellow-500", icon: AlertCircle },
      sent_to_customer: { bg: "bg-blue-500/20", text: "text-blue-500", icon: Send },
      paid: { bg: "bg-green-500/20", text: "text-green-500", icon: Check },
      disputed: { bg: "bg-orange-500/20", text: "text-orange-500", icon: AlertCircle },
      cancelled: { bg: "bg-gray-500/20", text: "text-gray-500", icon: X },
    }

    const config = configs[status] || configs.pending
    const Icon = config.icon

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1)}
      </span>
    )
  }

  const getAgreementStatusBadge = (agreement: any) => {
    const status = (agreement?.status || "").toLowerCase()
    if (["signed", "active", "confirmed"].includes(status)) {
      return <span className="text-xs text-green-500 font-semibold">✓ Signed</span>
    }
    if (["pending", "sent"].includes(status)) {
      return <span className="text-xs text-yellow-500 font-semibold">⏳ Pending</span>
    }
    return <span className="text-xs text-gray-500 font-semibold">{status}</span>
  }

  // Filter displayed bookings based on search
  const filteredBookings = displayedBookings.filter((item) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    const carName = getCarName(item.booking.car_id || item.booking.carId).toLowerCase()
    const customerName = (item.booking.customer_name || item.booking.customerName || "").toLowerCase()
    const bookingId = item.booking.id.toLowerCase()
    
    return (
      carName.includes(searchLower) ||
      customerName.includes(searchLower) ||
      bookingId.includes(searchLower)
    )
  })

  // Calculate stats from all loaded bookings (not just displayed)
  const allTickets = allBookingsWithAgreements.flatMap((item) => item.tickets)
  const totalTickets = allTickets.length
  const pendingTickets = allTickets.filter((t: any) => t.status === "pending").length
  const paidTickets = allTickets.filter((t: any) => t.status === "paid").length
  const totalAmount = allTickets.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
  
  const hasMoreBookings = displayedCount < allActiveBookings.length

  return (
    <div className="min-h-screen bg-black p-3 md:p-6 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">PCNs / Tickets</h1>
          <p className="text-sm text-white/60">Manage parking and traffic penalties</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="liquid-glass p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalTickets}</p>
              <p className="text-xs text-white/60">Total Tickets</p>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{pendingTickets}</p>
              <p className="text-xs text-white/60">Pending</p>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{paidTickets}</p>
              <p className="text-xs text-white/60">Paid</p>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Pound className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">£{totalAmount.toFixed(2)}</p>
              <p className="text-xs text-white/60">Total Amount</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="liquid-glass p-4 rounded-xl border border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search by customer name, booking ID, or car..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="liquid-glass p-12 rounded-xl border border-white/10 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent mb-4"></div>
          <p className="text-white/60">Loading bookings and agreements...</p>
        </div>
      ) : isLoadingAgreements ? (
        <div className="liquid-glass p-12 rounded-xl border border-white/10 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent mb-4"></div>
          <p className="text-white/60">Loading agreements and tickets...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="liquid-glass p-12 rounded-xl border border-white/10 text-center">
          <AlertCircle className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-white/80 mb-2">No bookings found</p>
          <p className="text-sm text-white/50">
            {searchTerm ? "Try adjusting your search criteria" : "No bookings with signed or pending agreements"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {filteredBookings.map((item) => {
            const { booking, agreement, tickets, car } = item
            const carId = booking.car_id || booking.carId
            const customerName = booking.customer_name || booking.customerName || "Unknown"

            return (
              <div key={booking.id} className="liquid-glass p-4 rounded-xl border border-white/10">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{getCarName(carId)}</h3>
                      {getAgreementStatusBadge(agreement)}
                    </div>
                    <p className="text-sm text-white/60">Booking: {booking.id.substring(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-white/60">Customer: {customerName}</p>
                    {agreement && (
                      <p className="text-xs text-white/50 mt-1">
                        Agreement: {agreement.agreementNumber || agreement.id.substring(0, 8).toUpperCase()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <a href={`/admin/bookings/${booking.id}`} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white/70 hover:text-white border-white/20 hover:bg-white/10 bg-transparent"
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking)
                        setShowCreateDialog(true)
                      }}
                      disabled={!agreement}
                      className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Ticket
                    </Button>
                  </div>
                </div>

                {tickets.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    {tickets.map((ticket: any) => (
                      <div
                        key={ticket.id}
                        className="bg-white/5 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">
                            {ticket.ticketType.charAt(0).toUpperCase() + ticket.ticketType.slice(1)} - £
                            {ticket.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-white/60">
                            {ticket.ticketNumber && `Ticket #${ticket.ticketNumber} • `}
                            Issued: {new Date(ticket.issueDate).toLocaleDateString()}
                            {ticket.dueDate && ` • Due: ${new Date(ticket.dueDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(ticket.status)}
                          {ticket.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendTicket(ticket.id)}
                              className="border-white/10 text-white hover:bg-white/10"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                          )}
                          {ticket.status === "sent_to_customer" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(ticket.id, "paid")}
                              className="border-white/10 text-white hover:bg-white/10"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Load More Button */}
                    {item.hasMoreTickets && (
                      <div className="flex justify-center pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadMoreTickets(booking.id)}
                          className="border-white/10 text-white hover:bg-white/10"
                        >
                          Load More Tickets
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          </div>

          {/* Load More Bookings Button */}
          {hasMoreBookings && !isLoading && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLoadMoreBookings}
                disabled={isLoadingMore}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3"
              >
                {isLoadingMore ? (
                  <>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                    Loading...
                  </>
                ) : (
                  `Load More Bookings (${Math.min(5, allActiveBookings.length - displayedCount)} more)`
                )}
              </Button>
            </div>
          )}

          {/* End of list message */}
          {!hasMoreBookings && allActiveBookings.length > 0 && (
            <div className="text-center py-4 text-white/60 text-sm">
              Showing all {allBookingsWithAgreements.length} bookings with agreements
            </div>
          )}
        </>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add PCN Ticket</DialogTitle>
            {selectedBooking && (
              <p className="text-sm text-white/60">
                {getCarName(selectedBooking.car_id || selectedBooking.carId)} - {selectedBooking.customer_name || selectedBooking.customerName}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-white/80">Ticket Type</Label>
              <Select value={ticketType} onValueChange={(value: any) => setTicketType(value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="parking">Parking</SelectItem>
                  <SelectItem value="speeding">Speeding</SelectItem>
                  <SelectItem value="congestion">Congestion</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/80">Ticket Number (Optional)</Label>
              <Input
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="e.g., PCN123456"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80">Issue Date *</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-white/80">Due Date (Optional)</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white/80">Amount (£) *</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <Label className="text-white/80">Ticket Document *</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                disabled={isUploading}
                className="bg-white/5 border-white/10 text-white file:text-white"
              />
              {ticketDocumentUrl && <p className="text-xs text-green-500 mt-2">Document uploaded successfully</p>}
            </div>

            <div>
              <Label className="text-white/80">Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional information..."
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmitTicket}
                disabled={isCreatingTicket || isUploading}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {isCreatingTicket ? "Creating..." : "Create Ticket"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
