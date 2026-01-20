"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
    Wrench,
    Home as HomeIcon,
    Shield,
    MoreHorizontal,
    Trash2,
    RefreshCw,
} from "lucide-react"
import { getCompanyExpenses, createCompanyExpense, deleteCompanyExpense, getExpenseStats, syncLoanPaymentsData } from "@/app/actions/company-charges"
import { toast } from "sonner"

const CATEGORIES = ["All", "Maintenance", "Loan Payment", "Office", "Insurance", "Marketing", "Utilities", "Other"]

export default function CompanyChargesPage() {
    const [expenses, setExpenses] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [selectedStatus, setSelectedStatus] = useState("All")
    const [selectedRecurrence, setSelectedRecurrence] = useState("All")

    // Form state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        amount: "",
        expense_date: new Date().toISOString().split("T")[0],
        category: "Other",
        status: "paid" as "paid" | "pending",
        recurrence: "one_time" as "one_time" | "monthly",
        recipient: "",
        payment_method: "bank_transfer",
        notes: ""
    })

    useEffect(() => {
        loadData()
    }, [selectedCategory, selectedStatus, selectedRecurrence])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [expensesRes, statsRes] = await Promise.all([
                getCompanyExpenses({
                    category: selectedCategory,
                    status: selectedStatus,
                    recurrence: selectedRecurrence,
                    search: searchQuery
                }),
                getExpenseStats()
            ])

            if (expensesRes.success) setExpenses(expensesRes.data || [])
            if (statsRes.success) setStats(statsRes.data)
        } catch (error) {
            console.error("Error loading company charges:", error)
            toast.error("Failed to load company charges")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const result = await createCompanyExpense({
                ...formData,
                amount: parseFloat(formData.amount),
                source: "manual"
            })

            if (result.success) {
                toast.success("Expense added successfully!")
                setIsAddModalOpen(false)
                setFormData({
                    title: "",
                    amount: "",
                    expense_date: new Date().toISOString().split("T")[0],
                    category: "Other",
                    status: "paid",
                    recurrence: "one_time",
                    recipient: "",
                    payment_method: "bank_transfer",
                    notes: ""
                })
                loadData()
            } else {
                toast.error(result.error || "Failed to add expense")
            }
        } catch (error) {
            console.error("Error creating expense:", error)
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteExpense = async (id: string) => {
        if (!confirm("Are you sure you want to delete this charge?")) return

        try {
            const result = await deleteCompanyExpense(id)
            if (result.success) {
                toast.success("Expense deleted")
                loadData()
            } else {
                toast.error(result.error || "Failed to delete expense")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            const result = await syncLoanPaymentsData()
            if (result.success) {
                if (result.count) {
                    toast.success(`Successfully synced ${result.count} new payments!`)
                } else {
                    toast.info(result.message || "Everything is already up to date")
                }
                loadData()
            } else {
                toast.error(result.error || "Failed to sync payments")
            }
        } catch (error) {
            console.error("Error syncing:", error)
            toast.error("An error occurred during sync")
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

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "Loan Payment": return <Banknote className="h-4 w-4" />
            case "Maintenance": return <Wrench className="h-4 w-4" />
            case "Office": return <HomeIcon className="h-4 w-4" />
            case "Insurance": return <Shield className="h-4 w-4" />
            default: return <Receipt className="h-4 w-4" />
        }
    }

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case "Loan Payment": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
            case "Maintenance": return "bg-orange-500/20 text-orange-400 border-orange-500/30"
            case "Insurance": return "bg-green-500/20 text-green-400 border-green-500/30"
            case "Other": return "bg-slate-500/20 text-slate-400 border-slate-500/30"
            default: return "bg-red-500/20 text-red-400 border-red-500/30"
        }
    }

    return (
        <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Company Charges</h1>
                    <p className="text-white/60 mt-1">Central tracking for all business expenses</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/10"
                        onClick={handleSync}
                        disabled={isSyncing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? "Syncing..." : "Sync From Loans"}
                    </Button>
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-red-500 hover:bg-red-600 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Manual Charge
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Add Company Charge</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateExpense} className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label>Expense Title</Label>
                                        <Input
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="bg-white/5 border-white/10"
                                            placeholder="e.g., Office Rent, Van Repair"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Amount (£)</Label>
                                        <Input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="bg-white/5 border-white/10"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                            required
                                            type="date"
                                            value={formData.expense_date}
                                            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                {CATEGORIES.filter(c => c !== "All").map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value: "paid" | "pending") => setFormData({ ...formData, status: value })}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Recurrence</Label>
                                        <Select
                                            value={formData.recurrence}
                                            onValueChange={(value: "one_time" | "monthly") => setFormData({ ...formData, recurrence: value })}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="one_time">One Time</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Recipient / Payee</Label>
                                        <Input
                                            value={formData.recipient}
                                            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                                            className="bg-white/5 border-white/10"
                                            placeholder="Who was paid?"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                        placeholder="Additional details..."
                                    />
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full bg-red-500 hover:bg-red-600">
                                    {isSubmitting ? "Adding..." : "Add Expense"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="liquid-glass border-white/10 p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-white/60 text-sm">Monthly Expenses</p>
                        <Banknote className="h-4 w-4 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">
                        {stats ? formatCurrency(stats.thisMonth) : "£0.00"}
                    </p>
                    <p className="text-xs text-white/40 mt-1">Actual spent this month</p>
                </Card>
                <Card className="liquid-glass border-white/10 p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-white/60 text-sm">Monthly Loan Commitment</p>
                        <RefreshCw className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">
                        {stats ? formatCurrency(stats.loanObligations) : "£0.00"}
                    </p>
                    <p className="text-xs text-white/40 mt-1">Total from active car loans</p>
                </Card>
                <Card className="liquid-glass border-white/10 p-5 text-zinc-400">
                    <div className="flex items-center justify-between">
                        <p className="text-white/60 text-sm">Top Category</p>
                        <Receipt className="h-4 w-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">
                        {stats && Object.keys(stats.byCategory).length > 0
                            ? Object.entries(stats.byCategory).sort((a: any, b: any) => b[1] - a[1])[0][0]
                            : "N/A"}
                    </p>
                    <p className="text-xs text-white/40 mt-1">Highest spend area</p>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="liquid-glass border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex gap-2">
                        {CATEGORIES.map(cat => (
                            <Button
                                key={cat}
                                size="sm"
                                variant={selectedCategory === cat ? "default" : "outline"}
                                onClick={() => setSelectedCategory(cat)}
                                className={selectedCategory === cat ? "bg-red-500" : "border-white/10"}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-[120px] bg-white/5 border-white/10 text-xs text-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                <SelectItem value="All">All Status</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={selectedRecurrence} onValueChange={setSelectedRecurrence}>
                            <SelectTrigger className="w-[120px] bg-white/5 border-white/10 text-xs text-white">
                                <SelectValue placeholder="Frequency" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                <SelectItem value="All">All Freq</SelectItem>
                                <SelectItem value="one_time">One Time</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                            placeholder="Search charges..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && loadData()}
                            className="pl-9 bg-white/5 border-white/10"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-white/60 text-sm">
                                <th className="p-4 font-medium">Charge Details</th>
                                <th className="p-4 font-medium">Category</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Frequency</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium text-right">Amount</th>
                                <th className="p-4 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="p-8 text-center text-white/20">Loading charges...</td>
                                    </tr>
                                ))
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-white/40">No charges found matching your criteria</td>
                                </tr>
                            ) : expenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <p className="text-white font-medium">{expense.title}</p>
                                        {expense.notes && <p className="text-xs text-white/40 mt-1 line-clamp-1">{expense.notes}</p>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold border flex items-center gap-1.5 w-fit ${getCategoryStyles(expense.category)}`}>
                                            {getCategoryIcon(expense.category)}
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${expense.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                            {expense.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-white/60 text-xs capitalize">
                                        {expense.recurrence?.replace('_', ' ')}
                                    </td>
                                    <td className="p-4 text-white/60 text-sm">{new Date(expense.expense_date).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <p className="text-white font-bold">{formatCurrency(expense.amount)}</p>
                                        <div className="flex justify-end gap-1.5 mt-1">
                                            <span className={`text-[9px] uppercase font-bold px-1 rounded ${expense.source === 'car_loan' ? "bg-blue-500/10 text-blue-400" : "bg-slate-500/10 text-slate-400"}`}>
                                                {expense.source.replace('_', ' ')}
                                            </span>
                                            <span className="text-[9px] text-white/30 uppercase">{expense.payment_method?.replace('_', ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteExpense(expense.id)}
                                            className="text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
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
