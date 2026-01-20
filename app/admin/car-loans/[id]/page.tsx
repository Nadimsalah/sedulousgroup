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
import { ArrowLeft, DollarSign, Calendar, CheckCircle, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getCarLoanById, recordPayment } from "@/app/actions/car-loans"
import { toast } from "sonner"

export default function CarLoanDetailPage() {
    const params = useParams()
    const [loan, setLoan] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRecordingPayment, setIsRecordingPayment] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<any>(null)
    const [paymentData, setPaymentData] = useState({
        amount_paid: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "bank_transfer",
        reference_number: "",
        notes: "",
    })

    useEffect(() => {
        loadLoan()
    }, [params.id])

    const loadLoan = async () => {
        setIsLoading(true)
        try {
            const result = await getCarLoanById(params.id as string)
            if (result.success && result.data) {
                setLoan(result.data)
            } else {
                toast.error(result.error || "Failed to load loan")
            }
        } catch (error) {
            console.error("Error loading loan:", error)
            toast.error("Failed to load loan")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRecordPayment = async () => {
        if (!selectedPayment) return

        setIsRecordingPayment(true)
        try {
            const result = await recordPayment(loan.id, selectedPayment.id, {
                amount_paid: parseFloat(paymentData.amount_paid),
                payment_date: paymentData.payment_date,
                payment_method: paymentData.payment_method,
                reference_number: paymentData.reference_number,
                notes: paymentData.notes,
            })

            if (result.success) {
                toast.success("Payment recorded successfully!")
                setSelectedPayment(null)
                setPaymentData({
                    amount_paid: "",
                    payment_date: new Date().toISOString().split("T")[0],
                    payment_method: "bank_transfer",
                    reference_number: "",
                    notes: "",
                })
                loadLoan()
            } else {
                toast.error(result.error || "Failed to record payment")
            }
        } catch (error) {
            console.error("Error recording payment:", error)
            toast.error("Failed to record payment")
        } finally {
            setIsRecordingPayment(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
        }).format(amount)
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", icon: Clock },
            paid: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", icon: CheckCircle },
            overdue: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", icon: AlertCircle },
            partial: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", icon: Clock },
        }

        const style = styles[status as keyof typeof styles] || styles.pending
        const Icon = style.icon

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border} flex items-center gap-1`}>
                <Icon className="h-3 w-3" />
                {status.toUpperCase()}
            </span>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-white">Loading loan details...</p>
            </div>
        )
    }

    if (!loan) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-white">Loan not found</p>
            </div>
        )
    }

    const paidPayments = loan.payments.filter((p: any) => p.status === "paid")
    const pendingPayments = loan.payments.filter((p: any) => p.status === "pending")
    const overduePayments = loan.payments.filter((p: any) => p.status === "overdue")

    return (
        <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/car-loans">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">{loan.loan_number}</h1>
                    <p className="text-white/60 mt-1">
                        {loan.cars ? `${loan.cars.brand} ${loan.cars.name}` : "No vehicle assigned"}
                    </p>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="liquid-glass border-white/10 p-4">
                    <p className="text-white/60 text-sm">Loan Amount</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(loan.loan_amount)}</p>
                </Card>
                <Card className="liquid-glass border-white/10 p-4">
                    <p className="text-white/60 text-sm">Monthly Payment</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(loan.monthly_payment)}</p>
                </Card>
                <Card className="liquid-glass border-white/10 p-4">
                    <p className="text-white/60 text-sm">Total Paid</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(loan.total_paid)}</p>
                </Card>
                <Card className="liquid-glass border-white/10 p-4">
                    <p className="text-white/60 text-sm">Remaining</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(loan.remaining_balance)}</p>
                </Card>
            </div>

            {/* Loan Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Payment Schedule */}
                    <Card className="liquid-glass border-white/10 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">Payment Schedule</h2>
                            <div className="flex gap-2">
                                <span className="text-xs text-white/60">
                                    {paidPayments.length} / {loan.payments.length} paid
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-white/10">
                                    <tr>
                                        <th className="text-left p-3 text-white/80 text-sm">#</th>
                                        <th className="text-left p-3 text-white/80 text-sm">Due Date</th>
                                        <th className="text-left p-3 text-white/80 text-sm">Amount Due</th>
                                        <th className="text-left p-3 text-white/80 text-sm">Amount Paid</th>
                                        <th className="text-left p-3 text-white/80 text-sm">Status</th>
                                        <th className="text-left p-3 text-white/80 text-sm">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loan.payments.map((payment: any) => (
                                        <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-3 text-white">{payment.payment_number}</td>
                                            <td className="p-3 text-white">{new Date(payment.due_date).toLocaleDateString()}</td>
                                            <td className="p-3 text-white">{formatCurrency(payment.amount_due)}</td>
                                            <td className="p-3 text-white">{formatCurrency(payment.amount_paid)}</td>
                                            <td className="p-3">{getStatusBadge(payment.status)}</td>
                                            <td className="p-3">
                                                {payment.status !== "paid" && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-white/10 text-white hover:bg-white/10"
                                                                onClick={() => {
                                                                    setSelectedPayment(payment)
                                                                    setPaymentData((prev) => ({
                                                                        ...prev,
                                                                        amount_paid: payment.amount_due.toString(),
                                                                    }))
                                                                }}
                                                            >
                                                                <DollarSign className="h-3 w-3 mr-1" />
                                                                Record
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="bg-zinc-900 border-white/10 text-white">
                                                            <DialogHeader>
                                                                <DialogTitle>Record Payment #{payment.payment_number}</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4 mt-4">
                                                                <div className="space-y-2">
                                                                    <Label>Amount Paid (£)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={paymentData.amount_paid}
                                                                        onChange={(e) => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
                                                                        className="bg-white/5 border-white/10 text-white"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Payment Date</Label>
                                                                    <Input
                                                                        type="date"
                                                                        value={paymentData.payment_date}
                                                                        onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                                                                        className="bg-white/5 border-white/10 text-white"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Payment Method</Label>
                                                                    <Select
                                                                        value={paymentData.payment_method}
                                                                        onValueChange={(value) => setPaymentData({ ...paymentData, payment_method: value })}
                                                                    >
                                                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                                            <SelectItem value="cash">Cash</SelectItem>
                                                                            <SelectItem value="check">Check</SelectItem>
                                                                            <SelectItem value="direct_debit">Direct Debit</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Reference Number</Label>
                                                                    <Input
                                                                        value={paymentData.reference_number}
                                                                        onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                                                                        className="bg-white/5 border-white/10 text-white"
                                                                        placeholder="Optional"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Notes</Label>
                                                                    <Textarea
                                                                        value={paymentData.notes}
                                                                        onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                                                        className="bg-white/5 border-white/10 text-white"
                                                                        placeholder="Optional"
                                                                    />
                                                                </div>

                                                                <Button
                                                                    onClick={handleRecordPayment}
                                                                    disabled={isRecordingPayment}
                                                                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                                                                >
                                                                    {isRecordingPayment ? "Recording..." : "Record Payment"}
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Sidebar - Loan Info */}
                <div className="space-y-6">
                    <Card className="liquid-glass border-white/10 p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Loan Information</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-white/60">Bank</p>
                                <p className="text-white font-semibold">{loan.bank_name}</p>
                            </div>
                            <div>
                                <p className="text-white/60">Interest Rate</p>
                                <p className="text-white font-semibold">{loan.interest_rate}%</p>
                            </div>
                            <div>
                                <p className="text-white/60">Term</p>
                                <p className="text-white font-semibold">{loan.loan_term_months} months</p>
                            </div>
                            <div>
                                <p className="text-white/60">Start Date</p>
                                <p className="text-white font-semibold">{new Date(loan.start_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-white/60">End Date</p>
                                <p className="text-white font-semibold">{new Date(loan.end_date).toLocaleDateString()}</p>
                            </div>
                            {loan.notes && (
                                <div>
                                    <p className="text-white/60">Notes</p>
                                    <p className="text-white text-xs">{loan.notes}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="liquid-glass border-white/10 p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Payment Summary</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/60">Paid Payments</span>
                                <span className="text-green-400 font-semibold">{paidPayments.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Pending Payments</span>
                                <span className="text-yellow-400 font-semibold">{pendingPayments.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Overdue Payments</span>
                                <span className="text-red-400 font-semibold">{overduePayments.length}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
