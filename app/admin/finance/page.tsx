"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Plus,
    Search,
    Filter,
    Receipt,
    Banknote,
    TrendingUp,
    TrendingDown,
    DollarSign,
    RefreshCw,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    ChevronRight,
    MoreHorizontal,
    Trash2,
} from "lucide-react"
import { getFinanceTransactions, getFinanceSummary, createFinanceTransaction, deleteFinanceTransaction, syncRecurringCharges } from "@/app/actions/finance"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

const PERIOD_PRESETS = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "All Time", value: "all" },
]

const TRANSACTION_TYPES = [
    "All",
    "booking_payment",
    "deposit",
    "refund",
    "damage_charge",
    "late_fee",
    "vendor_cost",
    "loan_payment",
    "subscription",
    "one_time_charge",
    "manual_adjustment",
    "other"
]

export default function FinancePage() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
    const [preset, setPreset] = useState<any>("month")
    const [filters, setFilters] = useState({
        type: "All",
        status: "All",
        direction: "All",
        search: ""
    })

    // Form state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        direction: "out" as "in" | "out",
        type: "one_time_charge" as any,
        source: "manual" as any,
        status: "paid" as any,
        amount_gross: "",
        occurred_at: new Date().toISOString().split("T")[0],
        notes: "",
        method: "bank_transfer",
        reference: ""
    })

    useEffect(() => {
        loadData()
    }, [preset, filters.type, filters.status, filters.direction])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [txRes, summaryRes] = await Promise.all([
                getFinanceTransactions({
                    preset,
                    type: filters.type,
                    status: filters.status,
                    direction: filters.direction,
                    search: filters.search
                }),
                getFinanceSummary({ preset })
            ])

            if (txRes.success) setTransactions(txRes.data || [])
            if (summaryRes.success) setSummary(summaryRes.data)
        } catch (error) {
            console.error("Error loading finance data:", error)
            toast.error("Failed to load finance data")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateTransaction = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const result = await createFinanceTransaction({
                ...formData,
                amount_gross: parseFloat(formData.amount_gross),
                fees: 0,
                amount_net: parseFloat(formData.amount_gross),
                currency: "GBP"
            })

            if (result.success) {
                toast.success("Transaction recorded")
                setIsAddModalOpen(false)
                loadData()
            } else {
                toast.error(result.error || "Failed to record transaction")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    const handleDeleteTransaction = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return
        try {
            const result = await deleteFinanceTransaction(id)
            if (result.success) {
                toast.success("Transaction deleted")
                loadData()
            }
        } catch (error) {
            toast.error("Failed to delete")
        }
    }

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            const result = await syncRecurringCharges()
            if (result.success) {
                toast.success(`Synced ${result.count} recurring charges`)
                loadData()
            }
        } finally {
            setIsSyncing(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
        }).format(amount)
    }

    const getStatusBadge = (status: string) => {
        const styles: any = {
            paid: "bg-green-500/10 text-green-400 border-green-500/20",
            pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            failed: "bg-red-500/10 text-red-400 border-red-500/20",
            refunded: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        }
        return <Badge variant="outline" className={`${styles[status]} capitalize`}>{status}</Badge>
    }

    const getTypeColor = (type: string) => {
        if (type.includes("payment") || type.includes("charge")) return "text-green-400"
        if (type.includes("cost") || type.includes("loan") || type.includes("refund")) return "text-red-400"
        return "text-slate-400"
    }

    return (
        <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Finance</h1>
                    <p className="text-white/60 mt-1">Central Ledger & Money Tracking (GBP £)</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/10"
                        onClick={handleSync}
                        disabled={isSyncing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync Recurring
                    </Button>
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                New Transaction
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Add Manual Transaction</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateTransaction} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label>Direction</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={formData.direction === "in" ? "default" : "outline"}
                                                className={`flex-1 ${formData.direction === "in" ? "bg-green-600 hover:bg-green-700" : "border-white/10"}`}
                                                onClick={() => setFormData({ ...formData, direction: "in", type: "one_time_charge" })}
                                            >
                                                <TrendingUp className="h-4 w-4 mr-2" /> Money In
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={formData.direction === "out" ? "default" : "outline"}
                                                className={`flex-1 ${formData.direction === "out" ? "bg-red-600 hover:bg-red-700" : "border-white/10"}`}
                                                onClick={() => setFormData({ ...formData, direction: "out", type: "one_time_charge" })}
                                            >
                                                <TrendingDown className="h-4 w-4 mr-2" /> Money Out
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Amount (£)</Label>
                                        <Input
                                            required
                                            type="number"
                                            step="0.01"
                                            className="bg-white/5 border-white/10"
                                            value={formData.amount_gross}
                                            onChange={(e) => setFormData({ ...formData, amount_gross: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                            required
                                            type="date"
                                            className="bg-white/5 border-white/10"
                                            value={formData.occurred_at}
                                            onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Category / Type</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TRANSACTION_TYPES.filter(t => t !== "All").map(t => (
                                                    <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Reference (Booking #, Invoice #)</Label>
                                        <Input
                                            className="bg-white/5 border-white/10"
                                            value={formData.reference}
                                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Record Transaction</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {PERIOD_PRESETS.map((p) => (
                    <Button
                        key={p.value}
                        size="sm"
                        variant={preset === p.value ? "default" : "outline"}
                        className={preset === p.value ? "bg-white text-black" : "border-white/10 text-white/60"}
                        onClick={() => setPreset(p.value)}
                    >
                        {p.label}
                    </Button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="liquid-glass border-white/10 p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-white/60 text-sm">Revenue</p>
                        <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">
                        {summary ? formatCurrency(summary.revenue) : "£0.00"}
                    </p>
                    <p className="text-xs text-white/40 mt-1">Total money in</p>
                </Card>
                <Card className="liquid-glass border-white/10 p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-white/60 text-sm">Costs</p>
                        <TrendingDown className="h-4 w-4 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">
                        {summary ? formatCurrency(summary.costs) : "£0.00"}
                    </p>
                    <p className="text-xs text-white/40 mt-1">Total money out</p>
                </Card>
                <Card className="liquid-glass border-white/10 p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-white/60 text-sm">Profit</p>
                        <DollarSign className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className={`text-2xl font-bold mt-1 ${summary?.profit >= 0 ? 'text-white' : 'text-red-400'}`}>
                        {summary ? formatCurrency(summary.profit) : "£0.00"}
                    </p>
                    <p className="text-xs text-white/40 mt-1">Net profit after costs</p>
                </Card>
                <Card className="liquid-glass border-white/10 p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-white/60 text-sm">Cashflow</p>
                        <RefreshCw className="h-4 w-4 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">
                        {summary ? formatCurrency(summary.netCashflow) : "£0.00"}
                    </p>
                    <p className="text-xs text-white/40 mt-1">Current period flow</p>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="liquid-glass border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {["All", "booking_payment", "loan_payment", "vendor_cost", "refund"].map(type => (
                                <Button
                                    key={type}
                                    size="sm"
                                    variant={filters.type === type ? "default" : "outline"}
                                    className={filters.type === type ? "bg-red-600" : "border-white/10"}
                                    onClick={() => setFilters({ ...filters, type })}
                                >
                                    {type.replace('_', ' ')}
                                </Button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                            <Input
                                placeholder="Search reference, notes..."
                                className="pl-9 bg-white/5 border-white/10"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && loadData()}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-white/60 text-sm">
                                <th className="p-4 font-medium">Date & Details</th>
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Source</th>
                                <th className="p-4 font-medium">Reference</th>
                                <th className="p-4 font-medium text-right">Amount (£)</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr><td colSpan={7} className="p-10 text-center text-white/20 animate-pulse">Loading transactions...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={7} className="p-20 text-center text-white/40">No transactions found for this period.</td></tr>
                            ) : transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${tx.direction === 'in' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {tx.direction === 'in' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{new Date(tx.occurred_at).toLocaleDateString()} {new Date(tx.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                {tx.notes && <p className="text-xs text-white/40 mt-1 line-clamp-1">{tx.notes}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className={`text-xs capitalize font-medium ${getTypeColor(tx.type)}`}>
                                            {tx.type.replace('_', ' ')}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-xs text-white/60 capitalize">{tx.source}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-xs text-white/60 font-mono">{tx.reference || "—"}</p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <p className={`font-bold ${tx.direction === 'in' ? 'text-white' : 'text-red-400'}`}>
                                            {tx.direction === 'out' ? '-' : ''}{formatCurrency(tx.amount_net)}
                                        </p>
                                        <p className="text-[10px] text-white/30 uppercase mt-0.5">{tx.method?.replace('_', ' ')}</p>
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(tx.status)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400 hover:bg-red-400/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
