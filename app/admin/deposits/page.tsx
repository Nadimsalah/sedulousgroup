"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CreditCard,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Plus,
  Car,
  ChevronDown,
} from "lucide-react"
import { getDeposits, refundDeposit, deductFromDeposit, createDeposit } from "@/app/actions/admin-deposits"
import { getAllBookingsAction } from "@/app/actions/bookings"
import { getAgreementsByBookingAction } from "@/app/actions/agreements"
import { toast } from "sonner"
import type { Deposit } from "@/app/actions/admin-deposits"
import type { BookingWithDetails } from "@/app/actions/bookings"

const ITEMS_PER_PAGE = 15

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "held" | "refunded" | "deducted">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [error, setError] = useState<string | null>(null)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [showDeductDialog, setShowDeductDialog] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [refundAmount, setRefundAmount] = useState("")
  const [deductionAmount, setDeductionAmount] = useState("")
  const [deductionReason, setDeductionReason] = useState("")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [activeBookings, setActiveBookings] = useState<BookingWithDetails[]>([])
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [newDeposit, setNewDeposit] = useState({
    amount: "",
    payment_method: "card",
    transaction_id: "",
    notes: "",
  })
  const [isCreating, setIsCreating] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    pending: 0,
    held: 0,
    refunded: 0,
    deducted: 0,
  })

  useEffect(() => {
    loadDeposits()
    loadActiveBookings()
  }, [])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchQuery, statusFilter])

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE)
  }, [])

  const loadActiveBookings = async () => {
    try {
      const result = await getAllBookingsAction()
      if (result?.success && result?.data) {
        // Filter for active bookings that don't already have deposits
        const active = result.data.filter((b) => {
          const status = (b.status || "").toLowerCase()
          return ["active", "approved", "confirmed"].includes(status)
        })
        setActiveBookings(active)
      }
    } catch (error) {
      console.error("Error loading active bookings:", error)
    }
  }

  const loadDeposits = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("[Deposits Page] Loading deposits...")
      const result = await getDeposits()

      if (result.success) {
        console.log(`[Deposits Page] Loaded ${result.data.length} deposits`)
        setDeposits(result.data || [])
        calculateStats(result.data || [])
      } else {
        console.error("[Deposits Page] Error loading deposits:", result.error)
        setError(result.error || "Failed to load deposits")
        setDeposits([])
      }
    } catch (err) {
      console.error("[Deposits Page] Unexpected error:", err)
      setError("Failed to load deposits")
      setDeposits([])
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (data: Deposit[]) => {
    setStats({
      total: data.length,
      totalAmount: data.reduce((sum, d) => sum + (d.amount || 0), 0),
      pending: data.filter((d) => d.status === "pending").length,
      held: data.filter((d) => d.status === "held").length,
      refunded: data.filter((d) => d.status === "refunded").length,
      deducted: data.filter((d) => d.status === "deducted").length,
    })
  }

  const filteredDeposits = deposits.filter((deposit) => {
    const matchesSearch =
      deposit.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.booking_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.vehicle_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || deposit.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Lazy loading
  const displayedDeposits = filteredDeposits.slice(0, displayCount)
  const hasMore = displayedDeposits.length < filteredDeposits.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
      case "held":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/30"
      case "refunded":
        return "bg-green-500/10 text-green-500 border border-green-500/30"
      case "deducted":
        return "bg-red-500/10 text-red-500 border border-red-500/30"
      default:
        return "bg-gray-500/10 text-gray-500 border border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "held":
        return <DollarSign className="h-4 w-4" />
      case "refunded":
        return <CheckCircle className="h-4 w-4" />
      case "deducted":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleRefund = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setRefundAmount(deposit.amount.toString())
    setNotes("")
    setShowRefundDialog(true)
  }

  const handleDeduct = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setDeductionAmount("")
    setDeductionReason("")
    setNotes("")
    setShowDeductDialog(true)
  }

  const processRefund = async () => {
    if (!selectedDeposit) return

    const refundAmt = Number.parseFloat(refundAmount)
    if (isNaN(refundAmt) || refundAmt <= 0) {
      toast.error("Please enter a valid refund amount")
      return
    }

    setIsProcessing(true)
    try {
      console.log("[Deposits Page] Processing refund:", selectedDeposit.id, refundAmt)
      const result = await refundDeposit(selectedDeposit.id, refundAmt, notes || undefined)

      if (result.success) {
        toast.success("Refund processed successfully!")
      setShowRefundDialog(false)
        setRefundAmount("")
        setNotes("")
        await loadDeposits()
      } else {
        console.error("[Deposits Page] Failed to process refund:", result.error)
        toast.error(`Failed to process refund: ${result.error}`)
      }
    } catch (err) {
      console.error("[Deposits Page] Error processing refund:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const processDeduction = async () => {
    if (!selectedDeposit) return

    if (!deductionReason || deductionReason.trim() === "") {
      toast.error("Please enter a reason for the deduction")
      return
    }

    const deductAmt = Number.parseFloat(deductionAmount)
    if (isNaN(deductAmt) || deductAmt <= 0) {
      toast.error("Please enter a valid deduction amount")
      return
    }

    if (deductAmt > selectedDeposit.amount) {
      toast.error("Deduction amount cannot exceed deposit amount")
      return
    }

    setIsProcessing(true)
    try {
      console.log("[Deposits Page] Processing deduction:", selectedDeposit.id, deductAmt, deductionReason)
      const result = await deductFromDeposit(selectedDeposit.id, deductAmt, deductionReason, notes || undefined)

      if (result.success) {
        toast.success("Deduction processed successfully!")
      setShowDeductDialog(false)
        setDeductionAmount("")
        setDeductionReason("")
        setNotes("")
        await loadDeposits()
      } else {
        console.error("[Deposits Page] Failed to process deduction:", result.error)
        toast.error(`Failed to process deduction: ${result.error}`)
      }
    } catch (err) {
      console.error("[Deposits Page] Error processing deduction:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateDeposit = async () => {
    if (!selectedBooking || !newDeposit.amount) return

    const amount = Number.parseFloat(newDeposit.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid deposit amount")
      return
    }

    setIsCreating(true)
    try {
      console.log("[Deposits Page] Creating deposit:", selectedBooking.id, amount)
      
      // Get agreement for this booking - it's required for deposits
      let agreementId: string | null = null
      try {
        const agreements = await getAgreementsByBookingAction(selectedBooking.id)
        if (agreements && agreements.length > 0) {
          agreementId = agreements[0].id
          console.log("[Deposits Page] Found agreement:", agreementId)
        } else {
          console.log("[Deposits Page] No agreement found for booking")
          toast.error("This booking does not have an agreement. Please create an agreement first.")
          setIsCreating(false)
          return
        }
      } catch (err) {
        console.error("[Deposits Page] Error fetching agreement:", err)
        toast.error("Failed to fetch agreement for this booking")
        setIsCreating(false)
        return
      }

      // Get customer_id from booking - it's required
      const customerId = selectedBooking.user_id
      if (!customerId) {
        toast.error("This booking does not have a customer ID. Cannot create deposit.")
        setIsCreating(false)
        return
      }

      console.log("[Deposits Page] Creating deposit with:", {
        booking_id: selectedBooking.id,
        agreement_id: agreementId,
        customer_id: customerId,
        amount: amount,
      })

      const result = await createDeposit({
        booking_id: selectedBooking.id,
        agreement_id: agreementId!,
        customer_id: customerId,
        amount: amount,
        status: "held",
        payment_method: newDeposit.payment_method,
        transaction_id: newDeposit.transaction_id || null,
        notes: newDeposit.notes || null,
      })

      if (result.success) {
        toast.success("Deposit created successfully!")
        setShowCreateDialog(false)
        setSelectedBooking(null)
        setNewDeposit({
          amount: "",
          payment_method: "card",
          transaction_id: "",
          notes: "",
        })
        await loadDeposits()
        await loadActiveBookings()
      } else {
        console.error("[Deposits Page] Failed to create deposit:", result.error)
        toast.error(`Failed to create deposit: ${result.error}`)
      }
    } catch (err) {
      console.error("[Deposits Page] Error creating deposit:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Deposits Management</h1>
            <p className="text-gray-400 mt-1">Track and manage customer deposits and refunds</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowCreateDialog(true)
                loadActiveBookings()
              }}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Deposit
            </Button>
          <Button className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Deposits</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoading ? <span className="animate-pulse">...</span> : stats.total}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isLoading ? "..." : `£${stats.totalAmount.toLocaleString()} total value`}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Held</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoading ? <span className="animate-pulse">...</span> : stats.held}
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently held deposits</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Refunded</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoading ? <span className="animate-pulse">...</span> : stats.refunded}
              </div>
              <p className="text-xs text-gray-500 mt-1">Successfully refunded</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Deducted</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoading ? <span className="animate-pulse">...</span> : stats.deducted}
              </div>
              <p className="text-xs text-gray-500 mt-1">With deductions</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer, booking ID, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black border-zinc-700 text-white placeholder-gray-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "pending", "held", "refunded", "deducted"] as const).map((status) => (
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
              onClick={loadDeposits}
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

        {/* Deposits List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 animate-pulse">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-zinc-800 rounded w-1/3" />
                      <div className="h-4 bg-zinc-800/50 rounded w-1/2" />
                      <div className="h-4 bg-zinc-800/50 rounded w-2/3" />
                    </div>
                    <div className="w-24 h-10 bg-zinc-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDeposits.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <CreditCard className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No deposits found</p>
            </div>
          ) : (
            displayedDeposits.map((deposit) => (
              <div
                key={deposit.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{deposit.customer_name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getStatusColor(deposit.status)}`}
                      >
                        {getStatusIcon(deposit.status)}
                        {deposit.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-400">
                      <p>Booking: {deposit.booking_id?.slice(0, 8)}</p>
                      <p>Vehicle: {deposit.vehicle_name}</p>
                      <p>Transaction: {deposit.transaction_id}</p>
                      <p>Date: {new Date(deposit.created_at).toLocaleDateString()}</p>
                    </div>
                    {(deposit.refund_amount !== null || deposit.deduction_amount !== null) && (
                      <div className="flex gap-4 mt-3 p-3 bg-zinc-800/50 rounded-lg">
                        {deposit.refund_amount !== null && (
                          <div>
                            <p className="text-xs text-gray-400">Refund Amount</p>
                            <p className="text-green-400 font-bold">£{deposit.refund_amount}</p>
                          </div>
                        )}
                        {deposit.deduction_amount !== null && deposit.deduction_amount > 0 && (
                          <div>
                            <p className="text-xs text-gray-400">Deduction</p>
                            <p className="text-red-400 font-bold">-£{deposit.deduction_amount}</p>
                            {deposit.deduction_reason && (
                              <p className="text-xs text-gray-500">{deposit.deduction_reason}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">£{deposit.amount}</p>
                    <p className="text-xs text-gray-400">{deposit.payment_method}</p>
                    {deposit.status === "held" && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => handleRefund(deposit)}
                          size="sm"
                          className="bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Refund
                        </Button>
                        <Button
                          onClick={() => handleDeduct(deposit)}
                          size="sm"
                          className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Deduct
                        </Button>
                      </div>
                    )}
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
                Load More ({filteredDeposits.length - displayedDeposits.length} remaining)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription className="text-gray-400">
              Refund the deposit to {selectedDeposit?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-400">Refund Amount (£)</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="bg-black border-zinc-700 text-white mt-1"
                placeholder="Enter refund amount"
              />
              <p className="text-xs text-gray-500 mt-1">Original deposit: £{selectedDeposit?.amount}</p>
            </div>
            <div>
              <Label className="text-gray-400">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-black border-zinc-700 text-white mt-1"
                placeholder="Add any notes about this refund..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={processRefund}
                disabled={isProcessing}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {isProcessing ? "Processing..." : "Process Refund"}
              </Button>
              <Button variant="outline" onClick={() => setShowRefundDialog(false)} className="border-zinc-700">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deduction Dialog */}
      <Dialog open={showDeductDialog} onOpenChange={setShowDeductDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Process Deduction</DialogTitle>
            <DialogDescription className="text-gray-400">
              Deduct amount from {selectedDeposit?.customer_name}'s deposit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-400">Deduction Amount (£)</Label>
              <Input
                type="number"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(e.target.value)}
                className="bg-black border-zinc-700 text-white mt-1"
                placeholder="Enter deduction amount"
              />
              <p className="text-xs text-gray-500 mt-1">
                Original deposit: £{selectedDeposit?.amount} | Refund will be: £
                {selectedDeposit ? (selectedDeposit.amount - (Number.parseFloat(deductionAmount) || 0)).toFixed(2) : 0}
              </p>
            </div>
            <div>
              <Label className="text-gray-400">Reason for Deduction</Label>
              <Input
                value={deductionReason}
                onChange={(e) => setDeductionReason(e.target.value)}
                className="bg-black border-zinc-700 text-white mt-1"
                placeholder="e.g., Vehicle damage, cleaning fee"
              />
            </div>
            <div>
              <Label className="text-gray-400">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-black border-zinc-700 text-white mt-1"
                placeholder="Additional details..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={processDeduction}
                disabled={isProcessing || !deductionReason}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {isProcessing ? "Processing..." : "Process Deduction"}
              </Button>
              <Button variant="outline" onClick={() => setShowDeductDialog(false)} className="border-zinc-700">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Deposit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Deposit for Active Booking</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select an active booking and enter deposit details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Select Booking */}
            <div>
              <Label className="text-gray-400 mb-2 block">Select Active Booking</Label>
              <div className="max-h-60 overflow-y-auto space-y-2 border border-zinc-700 rounded-lg p-2">
                {activeBookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No active bookings found</p>
                ) : (
                  activeBookings.map((booking) => {
                    const hasDeposit = deposits.some((d) => d.booking_id === booking.id)
                    return (
                      <div
                        key={booking.id}
                        onClick={() => {
                          if (!hasDeposit) {
                            setSelectedBooking(booking)
                            setNewDeposit({
                              amount: "",
                              payment_method: "card",
                              transaction_id: "",
                              notes: "",
                            })
                          }
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedBooking?.id === booking.id
                            ? "border-red-500 bg-red-500/10"
                            : hasDeposit
                              ? "border-zinc-700 bg-zinc-800/50 opacity-50 cursor-not-allowed"
                              : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Car className="h-4 w-4 text-gray-400" />
                              <h4 className="font-semibold text-white">{booking.car_name || "Unknown Vehicle"}</h4>
                              {hasDeposit && (
                                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">
                                  Has Deposit
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">Customer: {booking.customer_name}</p>
                            <p className="text-sm text-gray-400">Email: {booking.customer_email}</p>
                            <p className="text-sm text-gray-400">
                              Booking ID: {booking.id.slice(0, 8)}...
                            </p>
                          </div>
                          {selectedBooking?.id === booking.id && (
                            <CheckCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {selectedBooking && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Deposit Amount (£)</Label>
                    <Input
                      type="number"
                      value={newDeposit.amount}
                      onChange={(e) => setNewDeposit({ ...newDeposit, amount: e.target.value })}
                      className="bg-black border-zinc-700 text-white mt-1"
                      placeholder="Enter amount"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Payment Method</Label>
                    <Select
                      value={newDeposit.payment_method}
                      onValueChange={(value) => setNewDeposit({ ...newDeposit, payment_method: value })}
                    >
                      <SelectTrigger className="bg-black border-zinc-700 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-400">Transaction ID</Label>
                  <Input
                    value={newDeposit.transaction_id}
                    onChange={(e) => setNewDeposit({ ...newDeposit, transaction_id: e.target.value })}
                    className="bg-black border-zinc-700 text-white mt-1"
                    placeholder="Enter transaction ID (optional)"
                  />
                </div>

                <div>
                  <Label className="text-gray-400">Notes</Label>
                  <Textarea
                    value={newDeposit.notes}
                    onChange={(e) => setNewDeposit({ ...newDeposit, notes: e.target.value })}
                    className="bg-black border-zinc-700 text-white mt-1"
                    placeholder="Additional notes (optional)"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateDeposit}
                    disabled={isCreating || !newDeposit.amount || Number.parseFloat(newDeposit.amount) <= 0}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    {isCreating ? "Creating..." : "Create Deposit"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false)
                      setSelectedBooking(null)
                      setNewDeposit({
                        amount: "",
                        payment_method: "card",
                        transaction_id: "",
                        notes: "",
                      })
                    }}
                    className="border-zinc-700"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
