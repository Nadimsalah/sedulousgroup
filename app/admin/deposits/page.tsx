"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Eye,
  ExternalLink,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Plus,
  Car,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  History,
} from "lucide-react"
import {
  getDepositsAction,
  refundDepositAction,
  deductDepositAction,
  createDepositAction
} from "@/app/actions/deposits"
import { getAllBookingsAction } from "@/app/actions/bookings"
import { getAgreementsByBookingAction } from "@/app/actions/agreements"
import { toast } from "sonner"
import type { DepositWithDetails } from "@/app/actions/deposits"
import type { BookingWithDetails } from "@/app/actions/bookings"

const ITEMS_PER_PAGE = 15

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<DepositWithDetails[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "held" | "refunded" | "deducted" | "partially_refunded">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [error, setError] = useState<string | null>(null)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [showDeductDialog, setShowDeductDialog] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<DepositWithDetails | null>(null)
  const [refundAmount, setRefundAmount] = useState("")
  const [deductionAmount, setDeductionAmount] = useState("")
  const [deductionReason, setDeductionReason] = useState("")
  const [deductionProof, setDeductionProof] = useState<string | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [activeBookings, setActiveBookings] = useState<BookingWithDetails[]>([])
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [newDeposit, setNewDeposit] = useState({
    amount: "",
    payment_method: "card" as const,
    transaction_id: "",
    notes: "",
  })
  const [isCreating, setIsCreating] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    held: 0,
    refunded: 0,
    deducted: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [depResult, bookResult] = await Promise.all([
        getDepositsAction(),
        getAllBookingsAction()
      ])

      if (depResult.success) {
        setDeposits(depResult.data || [])
        calculateStats(depResult.data || [])
      } else {
        setError(depResult.error || "Failed to load deposits")
      }

      if (bookResult.success) {
        // Filter for active/confirmed bookings
        const active = bookResult.data.filter((b) =>
          ["active", "approved", "confirmed", "on rent"].includes((b.status || "").toLowerCase())
        )
        setActiveBookings(active)
      }
    } catch (err) {
      console.error("[Deposits Page] Error loading data:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (data: DepositWithDetails[]) => {
    setStats({
      total: data.length,
      totalAmount: data.reduce((sum, d) => sum + (d.amount || 0), 0),
      held: data.filter((d) => d.status === "held").length,
      refunded: data.filter((d) => d.status === "refunded" || d.status === "partially_refunded").length,
      deducted: data.filter((d) => d.status === "deducted").length,
    })
  }

  const filteredDeposits = deposits.filter((deposit) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      deposit.customer_name?.toLowerCase().includes(query) ||
      deposit.bookingId?.toLowerCase().includes(query) ||
      deposit.transactionId?.toLowerCase().includes(query) ||
      deposit.vehicle_name?.toLowerCase().includes(query) ||
      deposit.vehicle_registration?.toLowerCase().includes(query)

    const matchesStatus = statusFilter === "all" || deposit.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const displayedDeposits = filteredDeposits.slice(0, displayCount)
  const hasMore = displayedDeposits.length < filteredDeposits.length

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "held":
        return {
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          icon: <ShieldCheck className="h-3 w-3" />,
          label: "Held Safely"
        }
      case "refunded":
        return {
          color: "bg-green-500/10 text-green-400 border-green-500/20",
          icon: <CheckCircle className="h-3 w-3" />,
          label: "Fully Refunded"
        }
      case "partially_refunded":
        return {
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: <RefreshCw className="h-3 w-3" />,
          label: "Partially Refunded"
        }
      case "deducted":
        return {
          color: "bg-red-500/10 text-red-400 border-red-500/20",
          icon: <XCircle className="h-3 w-3" />,
          label: "Deducted"
        }
      default:
        return {
          color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
          icon: <AlertCircle className="h-3 w-3" />,
          label: status
        }
    }
  }

  const handleRefund = async () => {
    if (!selectedDeposit) return
    const amount = parseFloat(refundAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsProcessing(true)
    const result = await refundDepositAction(selectedDeposit.id, amount, notes)
    if (result.success) {
      toast.success("Refund processed successfully")
      setShowRefundDialog(false)
      loadData()
    } else {
      toast.error(result.error || "Failed to process refund")
    }
    setIsProcessing(false)
  }

  const handleDeduct = async () => {
    if (!selectedDeposit) return
    const amount = parseFloat(deductionAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!deductionReason) {
      toast.error("Reason is required")
      return
    }

    setIsProcessing(true)
    const result = await deductDepositAction(selectedDeposit.id, amount, deductionReason, notes, deductionProof || undefined)
    if (result.success) {
      toast.success("Deduction recorded successfully")
      setShowDeductDialog(false)
      setDeductionProof(null)
      loadData()
    } else {
      toast.error(result.error || "Failed to process deduction")
    }
    setIsProcessing(false)
  }

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingProof(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/upload", { method: "POST", body: formData })
      if (response.ok) {
        const { url } = await response.json()
        setDeductionProof(url)
        toast.success("Proof document uploaded")
      } else {
        toast.error("Failed to upload proof")
      }
    } catch (error) {
      console.error("Proof upload error:", error)
      toast.error("Error uploading document")
    } finally {
      setUploadingProof(false)
    }
  }

  const handleCreateDeposit = async () => {
    if (!selectedBooking) return
    const amount = parseFloat(newDeposit.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valid amount required")
      return
    }

    setIsCreating(true)
    try {
      const agreements = await getAgreementsByBookingAction(selectedBooking.id)
      if (!agreements || agreements.length === 0) {
        toast.error("No agreement found for this booking. Create one first.")
        return
      }

      const result = await createDepositAction({
        bookingId: selectedBooking.id,
        agreementId: agreements[0].id,
        customerId: selectedBooking.user_id || "",
        amount,
        paymentMethod: newDeposit.payment_method,
        transactionId: newDeposit.transaction_id,
        notes: newDeposit.notes
      })

      if (result.success) {
        toast.success("Deposit created")
        setShowCreateDialog(false)
        loadData()
      } else {
        toast.error(result.error || "Failed to create")
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header section with liquid glass style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
            Deposits Fleet
          </h1>
          <p className="text-zinc-400">Total liability management and refund processing</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-white text-black hover:bg-zinc-200 font-semibold px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Register Deposit
          </Button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Deposits", value: stats.held, icon: ShieldCheck, color: "text-blue-400" },
          { label: "Total Volume", value: `£${stats.totalAmount.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
          { label: "Refunded/Settled", value: stats.refunded, icon: CheckCircle, color: "text-zinc-400" },
          { label: "Alerts / Deductions", value: stats.deducted, icon: AlertCircle, color: "text-red-400" },
        ].map((stat, i) => (
          <Card key={i} className="bg-zinc-900/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-white/5">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <Badge variant="outline" className="border-white/5 bg-white/5 text-[10px]">REAL-TIME</Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold font-mono">{isLoading ? "---" : stat.value}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />
          <Input
            placeholder="Search by customer, VRN, or booking reference..."
            className="pl-10 bg-zinc-900/50 border-white/5 focus:border-white/20 transition-all w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto">
          {(["all", "held", "refunded", "deducted"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${statusFilter === filter
                ? "bg-white text-black border-white"
                : "bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/10"
                }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />
            <p className="text-zinc-500 text-sm">Synchronizing ledger...</p>
          </div>
        ) : displayedDeposits.length === 0 ? (
          <div className="bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl py-20 text-center">
            <History className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400">No transactions found</h3>
            <p className="text-zinc-600 text-sm mt-1">Adjust your filters or register a new deposit.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {displayedDeposits.map((deposit) => {
              const config = getStatusConfig(deposit.status)
              return (
                <Card key={deposit.id} className="bg-zinc-900/30 border-white/5 hover:border-white/10 transition-all group overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="h-6 w-6 text-zinc-400" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">{deposit.customer_name}</h3>
                            <Badge className={`${config.color} uppercase text-[10px] tracking-widest px-2`}>
                              {config.icon}
                              <span className="ml-1">{config.label}</span>
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                            <span className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5" /> {deposit.vehicle_name}</span>
                            <span className="px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-[10px] text-zinc-300 uppercase">{deposit.vehicle_registration}</span>
                            <span>Booking ID: <span className="text-zinc-400">{deposit.bookingId?.slice(0, 8)}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="text-center sm:text-right">
                          <p className="text-2xl font-bold">£{deposit.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">{deposit.paymentMethod}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {deposit.status === "held" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                                onClick={() => {
                                  setSelectedDeposit(deposit)
                                  setRefundAmount(deposit.amount.toString())
                                  setShowRefundDialog(true)
                                }}
                              >
                                Refund
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/5 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                onClick={() => {
                                  setSelectedDeposit(deposit)
                                  setShowDeductDialog(true)
                                }}
                              >
                                Deduct
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col text-right">
                              {deposit.refundAmount && (
                                <span className="text-xs text-emerald-500 flex items-center justify-end gap-1">
                                  <CheckCircle className="h-3 w-3" /> Refunded £{deposit.refundAmount}
                                </span>
                              )}
                              {deposit.deductionAmount && (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs text-red-400 flex items-center justify-end gap-1">
                                    <AlertCircle className="h-3 w-3" /> Deducted £{deposit.deductionAmount}
                                  </span>
                                  {deposit.deductionProofUrl && (
                                    <a
                                      href={deposit.deductionProofUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                      <Eye className="h-2.5 w-2.5" /> View Proof
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom timeline / detail footer if settled */}
                    {(deposit.status !== "held" || deposit.notes) && (
                      <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-4">
                          <span>Registered: {new Date(deposit.createdAt).toLocaleDateString()}</span>
                          {deposit.refundedAt && <span>Action Date: {new Date(deposit.refundedAt).toLocaleDateString()}</span>}
                        </div>
                        {deposit.notes && <span className="italic truncate max-w-[300px]">"{deposit.notes}"</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {!isLoading && hasMore && (
          <Button
            variant="ghost"
            className="w-full text-zinc-500 hover:text-white mt-4 border border-white/5"
            onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
          >
            View More Transactions <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dialogs */}
      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Register Fleet Deposit</DialogTitle>
            <DialogDescription>Attach a security deposit to an active booking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500">Select Active Booking</Label>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {activeBookings.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-white/5 rounded-xl text-zinc-600">No eligible bookings available</div>
                ) : (
                  activeBookings.map(b => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${selectedBooking?.id === b.id
                        ? "bg-white/10 border-white/20"
                        : "bg-white/5 border-white/5 hover:bg-white/[0.07]"
                        }`}
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{b.customer_name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase">{b.car_name} • {b.car_registration_number || 'NO VRN'}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[10px]">{b.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedBooking && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (£)</Label>
                    <Input
                      type="number"
                      placeholder="500.00"
                      value={newDeposit.amount}
                      onChange={e => setNewDeposit({ ...newDeposit, amount: e.target.value })}
                      className="bg-black border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={newDeposit.payment_method} onValueChange={v => setNewDeposit({ ...newDeposit, payment_method: v as any })}>
                      <SelectTrigger className="bg-black border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="card">Bank Card</SelectItem>
                        <SelectItem value="bank_transfer">Wire Transfer</SelectItem>
                        <SelectItem value="cash">Physical Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label>Reference / Transaction ID</Label>
                  <Input
                    placeholder="STRIPE_REF_123"
                    value={newDeposit.transaction_id}
                    onChange={e => setNewDeposit({ ...newDeposit, transaction_id: e.target.value })}
                    className="bg-black border-white/10"
                  />
                </div>
              </div>
            )}

            <Button
              className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold"
              disabled={!selectedBooking || isCreating}
              onClick={handleCreateDeposit}
            >
              {isCreating ? "Processing..." : "Confirm & Commit to Ledger"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Initiate Refund</DialogTitle>
            <DialogDescription>Returning collateral to {selectedDeposit?.customer_name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Refund Amount (£)</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                className="bg-black border-white/10 text-xl font-bold h-12"
              />
              <p className="text-[10px] text-zinc-500 text-right uppercase">Available Balance: £{selectedDeposit?.amount}</p>
            </div>
            <div className="space-y-2">
              <Label>internal Note</Label>
              <Textarea
                placeholder="Reason for refund (optional)..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="bg-black border-white/10"
                rows={3}
              />
            </div>
            <Button
              variant="outline"
              className="w-full h-12 bg-emerald-500 text-white hover:bg-emerald-600 border-none font-bold"
              disabled={isProcessing}
              onClick={handleRefund}
            >
              {isProcessing ? "Transacting..." : "Execute Settlement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deduct Dialog */}
      <Dialog open={showDeductDialog} onOpenChange={setShowDeductDialog}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">Process Deduction</DialogTitle>
            <DialogDescription>Charge the collateral for damage or administrative fees.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deduction (£)</Label>
                <Input
                  type="number"
                  value={deductionAmount}
                  onChange={e => setDeductionAmount(e.target.value)}
                  className="bg-black border-red-500/20 focus:border-red-500 text-red-500 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label>Primary Reason</Label>
                <Select value={deductionReason} onValueChange={setDeductionReason}>
                  <SelectTrigger className="bg-black border-white/10 text-xs">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    <SelectItem value="Vehicle Damage">Vehicle Damage</SelectItem>
                    <SelectItem value="Traffic Fine / PCN">Traffic Fine / PCN</SelectItem>
                    <SelectItem value="Cleaning Fee">Cleaning Fee</SelectItem>
                    <SelectItem value="Administrative Penalty">Admin Penalty</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Details for Customer</Label>
              <Textarea
                placeholder="Detailed explanation of the charge..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="bg-black border-white/10"
                rows={3}
              />
            </div>
            <div className="space-y-2 text-sm">
              <Label className="text-zinc-400">Documentation / Proof</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  onChange={handleProofUpload}
                  className="bg-black border-white/10 hidden"
                  id="proof-upload"
                  accept="image/*,.pdf"
                />
                <Label
                  htmlFor="proof-upload"
                  className="flex-1 h-10 px-3 flex items-center justify-center border border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                >
                  {uploadingProof ? "Uploading..." : (deductionProof ? "Change Document" : "Upload Evidence (JPG, PDF)")}
                </Label>
                {deductionProof && (
                  <div className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                )}
              </div>
              {deductionProof && <p className="text-[10px] text-emerald-500/80">Documentation attached successfully.</p>}
            </div>
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <p className="text-[10px] text-red-200/60 leading-relaxed uppercase tracking-tighter">
                This action will reduce the refundable balance of the deposit. Ensure you have documentation supporting this deduction.
              </p>
            </div>
            <Button
              className="w-full h-12 bg-red-500 text-white hover:bg-red-600 font-bold"
              disabled={isProcessing || !deductionAmount || !deductionReason}
              onClick={handleDeduct}
            >
              {isProcessing ? "Processing..." : "Commit Charge"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
