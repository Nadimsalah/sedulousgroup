"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save, Calculator } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createCarLoan } from "@/app/actions/car-loans"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function NewCarLoanPage() {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [vehicles, setVehicles] = useState<any[]>([])
    const [formData, setFormData] = useState({
        loan_number: "",
        vehicle_id: "",
        bank_name: "",
        loan_amount: "",
        interest_rate: "",
        loan_term_months: "",
        monthly_payment: "",
        start_date: "",
        first_payment_date: "",
        notes: "",
    })

    useEffect(() => {
        loadVehicles()
        // Generate loan number
        const loanNumber = `LOAN-${Date.now().toString().slice(-8)}`
        setFormData((prev) => ({ ...prev, loan_number: loanNumber }))
    }, [])

    const loadVehicles = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from("cars")
            .select("id, name, brand, registration_number")
            .order("brand", { ascending: true })

        if (data) setVehicles(data)
    }

    const calculateMonthlyPayment = () => {
        const principal = parseFloat(formData.loan_amount)
        const annualRate = parseFloat(formData.interest_rate)
        const months = parseInt(formData.loan_term_months)

        if (!principal || !annualRate || !months) {
            toast.error("Please fill in loan amount, interest rate, and term")
            return
        }

        const monthlyRate = annualRate / 100 / 12
        let payment: number

        if (monthlyRate === 0) {
            payment = principal / months
        } else {
            payment =
                (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                (Math.pow(1 + monthlyRate, months) - 1)
        }

        setFormData((prev) => ({
            ...prev,
            monthly_payment: payment.toFixed(2),
        }))

        toast.success(`Monthly payment calculated: £${payment.toFixed(2)}`)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const result = await createCarLoan({
                loan_number: formData.loan_number,
                vehicle_id: formData.vehicle_id || null,
                bank_name: formData.bank_name,
                loan_amount: parseFloat(formData.loan_amount),
                interest_rate: parseFloat(formData.interest_rate),
                loan_term_months: parseInt(formData.loan_term_months),
                monthly_payment: parseFloat(formData.monthly_payment),
                start_date: formData.start_date,
                first_payment_date: formData.first_payment_date,
                notes: formData.notes || undefined,
            } as any)

            if (result.success) {
                toast.success("Loan created successfully!")
                router.push(`/admin/car-loans/${result.data.id}`)
            } else {
                toast.error(result.error || "Failed to create loan")
            }
        } catch (error) {
            console.error("Error creating loan:", error)
            toast.error("Failed to create loan")
        } finally {
            setIsSaving(false)
        }
    }

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
                    <h1 className="text-3xl font-bold text-white">Add New Loan</h1>
                    <p className="text-white/60 mt-1">Create a new car loan record</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Loan Details */}
                        <Card className="liquid-glass border-white/10 p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Loan Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="loan_number" className="text-white">
                                        Loan Number
                                    </Label>
                                    <Input
                                        id="loan_number"
                                        value={formData.loan_number}
                                        onChange={(e) => setFormData({ ...formData, loan_number: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vehicle_id" className="text-white">
                                        Vehicle
                                    </Label>
                                    <Select
                                        value={formData.vehicle_id}
                                        onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Select vehicle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehicles.map((vehicle) => (
                                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                                    {vehicle.brand} {vehicle.name} - {vehicle.registration_number}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bank_name" className="text-white">
                                        Bank Name
                                    </Label>
                                    <Input
                                        id="bank_name"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="e.g., Barclays, HSBC"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="loan_amount" className="text-white">
                                        Loan Amount (£)
                                    </Label>
                                    <Input
                                        id="loan_amount"
                                        type="number"
                                        step="0.01"
                                        value={formData.loan_amount}
                                        onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="25000.00"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="interest_rate" className="text-white">
                                        Interest Rate (%)
                                    </Label>
                                    <Input
                                        id="interest_rate"
                                        type="number"
                                        step="0.01"
                                        value={formData.interest_rate}
                                        onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="5.5"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="loan_term_months" className="text-white">
                                        Loan Term (Months)
                                    </Label>
                                    <Input
                                        id="loan_term_months"
                                        type="number"
                                        value={formData.loan_term_months}
                                        onChange={(e) => setFormData({ ...formData, loan_term_months: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="60"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="start_date" className="text-white">
                                        Start Date
                                    </Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="first_payment_date" className="text-white">
                                        First Payment Date
                                    </Label>
                                    <Input
                                        id="first_payment_date"
                                        type="date"
                                        value={formData.first_payment_date}
                                        onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                        required
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Notes */}
                        <Card className="liquid-glass border-white/10 p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Additional Notes</h2>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                                placeholder="Any additional information about this loan..."
                            />
                        </Card>
                    </div>

                    {/* Sidebar - Calculations */}
                    <div className="space-y-6">
                        <Card className="liquid-glass border-white/10 p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Payment Calculator</h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="monthly_payment" className="text-white">
                                        Monthly Payment (£)
                                    </Label>
                                    <Input
                                        id="monthly_payment"
                                        type="number"
                                        step="0.01"
                                        value={formData.monthly_payment}
                                        onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="Auto-calculated"
                                        required
                                    />
                                </div>

                                <Button
                                    type="button"
                                    onClick={calculateMonthlyPayment}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                    <Calculator className="h-4 w-4 mr-2" />
                                    Calculate Payment
                                </Button>

                                {formData.loan_amount && formData.loan_term_months && formData.monthly_payment && (
                                    <div className="pt-4 border-t border-white/10 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/60">Total to Pay:</span>
                                            <span className="text-white font-semibold">
                                                £{(parseFloat(formData.monthly_payment) * parseInt(formData.loan_term_months)).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/60">Total Interest:</span>
                                            <span className="text-red-400 font-semibold">
                                                £{(
                                                    parseFloat(formData.monthly_payment) * parseInt(formData.loan_term_months) -
                                                    parseFloat(formData.loan_amount)
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Actions */}
                        <Card className="liquid-glass border-white/10 p-6">
                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSaving ? "Creating..." : "Create Loan"}
                                </Button>
                                <Link href="/admin/car-loans" className="block">
                                    <Button type="button" variant="outline" className="w-full border-white/10 text-white">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    )
}
