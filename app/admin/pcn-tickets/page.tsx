"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Search, Plus, Send, Check, X, FileText, KeyRound as Pound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getBookingsAction } from "@/app/actions/requests"
import { getCarsAction } from "@/app/actions/database"
import { getAgreementsByBookingAction } from "@/app/actions/agreements"
import {
  createPCNTicketAction,
  getPCNsByAgreementAction,
  sendPCNToCustomerAction,
  updatePCNTicketStatusAction,
} from "@/app/actions/pcn-tickets"
import { toast } from "sonner"

export default function PCNTicketsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [cars, setCars] = useState<any[]>([])
  const [agreements, setAgreements] = useState<Record<string, any[]>>({})
  const [tickets, setTickets] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
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

  const loadData = async () => {
    setIsLoading(true)
    const [bookingsData, carsData] = await Promise.all([getBookingsAction(), getCarsAction()])

    const activeBookings = bookingsData.filter((b: any) => b.status === "On Rent" || b.status === "Completed")
    setBookings(activeBookings)
    setCars(carsData)

    const agreementsData: Record<string, any[]> = {}
    const ticketsData: Record<string, any[]> = {}

    for (const booking of activeBookings) {
      const bookingAgreements = await getAgreementsByBookingAction(booking.id)
      agreementsData[booking.id] = bookingAgreements

      for (const agreement of bookingAgreements) {
        const agreementTickets = await getPCNsByAgreementAction(agreement.id)
        ticketsData[agreement.id] = agreementTickets
      }
    }

    setAgreements(agreementsData)
    setTickets(ticketsData)
    setIsLoading(false)
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
      console.error("[v0] Error uploading document:", error)
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

    const bookingAgreements = agreements[selectedBooking.id] || []
    const agreement = bookingAgreements.find((a) => a.status === "Signed")

    if (!agreement) {
      toast.error("No signed agreement found for this booking")
      setIsCreatingTicket(false)
      return
    }

    const result = await createPCNTicketAction({
      agreementId: agreement.id,
      bookingId: selectedBooking.id,
      customerId: selectedBooking.userId,
      vehicleId: selectedBooking.carId,
      ticketType,
      ticketNumber: ticketNumber || undefined,
      issueDate,
      dueDate: dueDate || undefined,
      amount: Number.parseFloat(amount),
      ticketDocumentUrl,
      notes: notes || undefined,
      uploadedBy: "Admin",
    })

    if (result.success) {
      toast.success("PCN Ticket created successfully!")
      setShowCreateDialog(false)
      setSelectedBooking(null)
      setTicketType("parking")
      setTicketNumber("")
      setIssueDate("")
      setDueDate("")
      setAmount("")
      setNotes("")
      setTicketDocumentUrl("")
      await loadData()
    } else {
      toast.error(result.error || "Failed to create ticket")
    }

    setIsCreatingTicket(false)
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

  const getCarName = (carId: string) => {
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

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      booking.customerName?.toLowerCase().includes(searchLower) ||
      booking.id.toLowerCase().includes(searchLower) ||
      getCarName(booking.carId).toLowerCase().includes(searchLower)
    )
  })

  // Calculate stats
  const allTickets = Object.values(tickets).flat()
  const totalTickets = allTickets.length
  const pendingTickets = allTickets.filter((t: any) => t.status === "pending").length
  const paidTickets = allTickets.filter((t: any) => t.status === "paid").length
  const totalAmount = allTickets.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)

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

      {/* Bookings List */}
      {isLoading ? (
        <div className="liquid-glass p-12 rounded-xl border border-white/10 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent mb-4"></div>
          <p className="text-white/60">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="liquid-glass p-12 rounded-xl border border-white/10 text-center">
          <AlertCircle className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-white/80 mb-2">No bookings found</p>
          <p className="text-sm text-white/50">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredBookings.map((booking) => {
            const bookingAgreements = agreements[booking.id] || []
            const agreement = bookingAgreements.find((a) => a.status === "Signed")
            const agreementTickets = agreement ? tickets[agreement.id] || [] : []

            return (
              <div key={booking.id} className="liquid-glass p-4 rounded-xl border border-white/10">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{getCarName(booking.carId)}</h3>
                    <p className="text-sm text-white/60">Booking: {booking.id.substring(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-white/60">Customer: {booking.customerName}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(booking)
                      setShowCreateDialog(true)
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Ticket
                  </Button>
                </div>

                {agreementTickets.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    {agreementTickets.map((ticket: any) => (
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
                            {ticket.ticketNumber && `${ticket.ticketNumber} • `}
                            Issued: {new Date(ticket.issueDate).toLocaleDateString()}
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add PCN Ticket</DialogTitle>
            {selectedBooking && (
              <p className="text-sm text-white/60">
                {getCarName(selectedBooking.carId)} - {selectedBooking.customerName}
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
