"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import { createClient } from "@supabase/supabase-js"

interface Deposit {
  id: string
  booking_id: string
  customer_name: string
  customer_email: string
  vehicle_name: string
  amount: number
  status: "pending" | "held" | "refunded" | "deducted"
  payment_method: string
  transaction_id: string
  created_at: string
  refunded_at: string | null
  refund_amount: number | null
  deduction_amount: number | null
  deduction_reason: string | null
  notes: string | null
}

function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "held" | "refunded" | "deducted">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [showDeductDialog, setShowDeductDialog] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [refundAmount, setRefundAmount] = useState("")
  const [deductionAmount, setDeductionAmount] = useState("")
  const [deductionReason, setDeductionReason] = useState("")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
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
  }, [])

  const loadDeposits = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createAdminSupabase()

      // Try to fetch from deposits table
      const { data: depositsData, error: depositsError } = await supabase
        .from("deposits")
        .select("*")
        .order("created_at", { ascending: false })

      if (depositsError) {
        if (depositsError.code === "42P01") {
          // Table doesn't exist, try to get deposits from bookings
          const { data: bookingsData, error: bookingsError } = await supabase
            .from("bookings")
            .select("id, customer_name, customer_email, deposit_amount, status, created_at, car_id")
            .not("deposit_amount", "is", null)
            .order("created_at", { ascending: false })

          if (bookingsError) {
            setError("Deposits table not found. Please create the table first.")
            setDeposits([])
          } else {
            // Get car names
            const carIds = [...new Set((bookingsData || []).map((b) => b.car_id).filter(Boolean))]
            let carsMap: Record<string, string> = {}

            if (carIds.length > 0) {
              const { data: cars } = await supabase.from("cars").select("id, name").in("id", carIds)
              if (cars) {
                carsMap = Object.fromEntries(cars.map((c) => [c.id, c.name]))
              }
            }

            const mappedDeposits: Deposit[] = (bookingsData || []).map((b) => ({
              id: b.id,
              booking_id: b.id,
              customer_name: b.customer_name || "N/A",
              customer_email: b.customer_email || "N/A",
              vehicle_name: carsMap[b.car_id] || "Unknown Vehicle",
              amount: b.deposit_amount || 0,
              status: b.status?.toLowerCase().includes("completed") ? "refunded" : "held",
              payment_method: "Card",
              transaction_id: `TXN-${b.id.slice(0, 8)}`,
              created_at: b.created_at,
              refunded_at: null,
              refund_amount: null,
              deduction_amount: null,
              deduction_reason: null,
              notes: null,
            }))

            setDeposits(mappedDeposits)
            calculateStats(mappedDeposits)
          }
        } else {
          setError(depositsError.message)
        }
      } else {
        setDeposits(depositsData || [])
        calculateStats(depositsData || [])
      }
    } catch (err) {
      setError("Failed to load deposits")
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
    setIsProcessing(true)
    try {
      const supabase = createAdminSupabase()
      const { error: updateError } = await supabase
        .from("deposits")
        .update({
          status: "refunded",
          refund_amount: Number.parseFloat(refundAmount),
          refunded_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq("id", selectedDeposit.id)

      if (updateError) throw updateError
      setShowRefundDialog(false)
      loadDeposits()
    } catch (err) {
      setError("Failed to process refund")
    } finally {
      setIsProcessing(false)
    }
  }

  const processDeduction = async () => {
    if (!selectedDeposit) return
    setIsProcessing(true)
    try {
      const supabase = createAdminSupabase()
      const refundAmt = selectedDeposit.amount - Number.parseFloat(deductionAmount)
      const { error: updateError } = await supabase
        .from("deposits")
        .update({
          status: "deducted",
          deduction_amount: Number.parseFloat(deductionAmount),
          deduction_reason: deductionReason,
          refund_amount: refundAmt > 0 ? refundAmt : 0,
          refunded_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq("id", selectedDeposit.id)

      if (updateError) throw updateError
      setShowDeductDialog(false)
      loadDeposits()
    } catch (err) {
      setError("Failed to process deduction")
    } finally {
      setIsProcessing(false)
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
          <Button className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Deposits</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">£{stats.totalAmount.toLocaleString()} total value</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Held</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.held}</div>
              <p className="text-xs text-gray-500 mt-1">Currently held deposits</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Refunded</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.refunded}</div>
              <p className="text-xs text-gray-500 mt-1">Successfully refunded</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Deducted</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.deducted}</div>
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-zinc-700 border-t-red-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400 mt-4">Loading deposits...</p>
            </div>
          ) : filteredDeposits.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <CreditCard className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No deposits found</p>
            </div>
          ) : (
            filteredDeposits.map((deposit) => (
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
    </div>
  )
}
