"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Download, Upload, Eye, Trash2, CreditCard } from "lucide-react"
import Link from "next/link"
import { getCarLoans, deleteCarLoan } from "@/app/actions/car-loans"
import { toast } from "sonner"

export default function CarLoansPage() {
    const [loans, setLoans] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        loadLoans()
    }, [statusFilter])

    const loadLoans = async () => {
        setIsLoading(true)
        try {
            const result = await getCarLoans({
                status: statusFilter === "all" ? undefined : statusFilter,
                search: searchTerm || undefined,
            })

            if (result.success && result.data) {
                setLoans(result.data)
            } else {
                toast.error(result.error || "Failed to load car loans")
            }
        } catch (error) {
            console.error("Error loading loans:", error)
            toast.error("Failed to load car loans")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearch = () => {
        loadLoans()
    }

    const handleDelete = async (id: string, loanNumber: string) => {
        if (!confirm(`Are you sure you want to delete loan ${loanNumber}?`)) return

        const result = await deleteCarLoan(id)
        if (result.success) {
            toast.success("Loan deleted successfully")
            loadLoans()
        } else {
            toast.error(result.error || "Failed to delete loan")
        }
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            active: "bg-green-500/20 text-green-400 border-green-500/30",
            paid_off: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            overdue: "bg-red-500/20 text-red-400 border-red-500/30",
            defaulted: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        }

        return (
            <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.active
                    }`}
            >
                {status.replace("_", " ").toUpperCase()}
            </span>
        )
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
        }).format(amount)
    }

    return (
        <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-red-500" />
                        Car Loans
                    </h1>
                    <p className="text-white/60 mt-1">Manage bank-financed vehicles</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/car-loans/new">
                        <Button className="bg-red-500 hover:bg-red-600 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Loan
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <Card className="liquid-glass border-white/10 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search by loan number or bank..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="bg-white/5 border-white/10 text-white"
                        />
                        <Button onClick={handleSearch} variant="outline" className="border-white/10">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paid_off">Paid Off</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="defaulted">Defaulted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="liquid-glass border-white/10 p-4">
                    <p className="text-white/60 text-sm">Total Loans</p>
                    <p className="text-2xl font-bold text-white mt-1">{loans.length}</p>
                </Card>
                <Card className="liquid-glass border-white/10 p-4">
                    <p className="text-white/60 text-sm">Active Loans</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                        {loans.filter((l) => l.status === "active").length}
                    </p>
                </Card>
                <Card className="liquid-glass border-white/10 p-4">
                    <p className="text-white/60 text-sm">Total Financed</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {formatCurrency(loans.reduce((sum, l) => sum + (l.loan_amount || 0), 0))}
                    </p>
                </Card>
                <Card className="liquid-glass border-white/10 p-4">
                    <p className="text-white/60 text-sm">Total Remaining</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">
                        {formatCurrency(loans.reduce((sum, l) => sum + (l.remaining_balance || 0), 0))}
                    </p>
                </Card>
            </div>

            {/* Loans Table */}
            <Card className="liquid-glass border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-white/10">
                            <tr>
                                <th className="text-left p-4 text-white/80 font-semibold">Loan #</th>
                                <th className="text-left p-4 text-white/80 font-semibold">Vehicle</th>
                                <th className="text-left p-4 text-white/80 font-semibold">Bank</th>
                                <th className="text-left p-4 text-white/80 font-semibold">Loan Amount</th>
                                <th className="text-left p-4 text-white/80 font-semibold">Monthly Payment</th>
                                <th className="text-left p-4 text-white/80 font-semibold">Remaining</th>
                                <th className="text-left p-4 text-white/80 font-semibold">Status</th>
                                <th className="text-left p-4 text-white/80 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-8 text-white/60">
                                        Loading loans...
                                    </td>
                                </tr>
                            ) : loans.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-8 text-white/60">
                                        No loans found
                                    </td>
                                </tr>
                            ) : (
                                loans.map((loan) => (
                                    <tr key={loan.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-4 text-white font-mono">{loan.loan_number}</td>
                                        <td className="p-4 text-white">
                                            {loan.cars ? `${loan.cars.brand} ${loan.cars.name}` : "N/A"}
                                            {loan.cars?.registration_number && (
                                                <div className="text-xs text-white/50">{loan.cars.registration_number}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-white">{loan.bank_name}</td>
                                        <td className="p-4 text-white">{formatCurrency(loan.loan_amount)}</td>
                                        <td className="p-4 text-white">{formatCurrency(loan.monthly_payment)}</td>
                                        <td className="p-4 text-white">{formatCurrency(loan.remaining_balance)}</td>
                                        <td className="p-4">{getStatusBadge(loan.status)}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <Link href={`/admin/car-loans/${loan.id}`}>
                                                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-400 hover:bg-red-500/10"
                                                    onClick={() => handleDelete(loan.id, loan.loan_number)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
