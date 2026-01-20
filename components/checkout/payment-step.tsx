"use client"

import { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
import { Loader2, CheckCircle2 } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentStepProps {
    clientSecret: string
    onPaymentSuccess: () => void
    onPaymentError: (error: string) => void
    totalAmount: number
    carName: string
}

export function PaymentStep({
    clientSecret,
    onPaymentSuccess,
    onPaymentError,
    totalAmount,
    carName
}: PaymentStepProps) {
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending')

    useEffect(() => {
        if (!clientSecret) return

        // Listen for payment completion
        const checkStatus = async () => {
            try {
                const stripe = await stripePromise
                if (!stripe) return

                // This will be called by the embedded checkout on completion
                console.log('Payment form ready')
            } catch (err) {
                console.error('Error initializing payment:', err)
                onPaymentError('Failed to initialize payment')
            }
        }

        checkStatus()
    }, [clientSecret, onPaymentError])

    if (!clientSecret) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
                    <p className="text-gray-400">Preparing payment...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Payment Header */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Complete Payment</h3>
                        <p className="text-gray-400 text-sm">Secure payment powered by Stripe</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Total Amount</p>
                        <p className="text-2xl font-bold text-white">£{totalAmount.toFixed(2)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Your payment is secure and encrypted</span>
                </div>
            </div>

            {/* Stripe Embedded Checkout */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[400px]">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={{ clientSecret }}
                    >
                        <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                </Elements>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div className="text-sm text-gray-300">
                    <p className="font-semibold text-white mb-1">Secure Payment</p>
                    <p className="text-gray-400">
                        Your payment information is processed securely. We do not store your card details.
                        All transactions are encrypted and PCI-DSS compliant.
                    </p>
                </div>
            </div>
        </div>
    )
}
