import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
        return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        console.error("⚠️ Webhook signature verification failed:", err)
        return NextResponse.json(
            { error: "Webhook signature verification failed" },
            { status: 400 }
        )
    }

    const supabase = await createClient()

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session

                console.log("✅ Payment successful:", session.id)

                // Extract booking ID from metadata
                const bookingId = session.metadata?.bookingId

                if (!bookingId) {
                    console.error("No bookingId found in session metadata")
                    break
                }

                // Update booking status to "paid" using booking ID
                const { data: booking, error: bookingError } = await supabase
                    .from("bookings")
                    .update({
                        status: "paid",
                        payment_status: "paid",
                        stripe_session_id: session.id,
                        stripe_payment_intent: session.payment_intent as string,
                    })
                    .eq("id", bookingId)
                    .select()
                    .single()

                if (bookingError) {
                    console.error("Error updating booking:", bookingError)
                } else {
                    console.log("✅ Booking updated:", booking?.id)
                }

                break
            }

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                console.log("✅ Payment intent succeeded:", paymentIntent.id)
                break
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                console.log("❌ Payment failed:", paymentIntent.id)

                // Update booking status to "payment_failed"
                const { error } = await supabase
                    .from("bookings")
                    .update({
                        payment_status: "failed",
                    })
                    .eq("stripe_payment_intent", paymentIntent.id)

                if (error) {
                    console.error("Error updating booking:", error)
                }

                break
            }

            case "charge.refunded": {
                const charge = event.data.object as Stripe.Charge
                console.log("💰 Refund processed:", charge.id)

                // Update booking status to "refunded"
                const { error } = await supabase
                    .from("bookings")
                    .update({
                        payment_status: "refunded",
                        status: "cancelled",
                    })
                    .eq("stripe_payment_intent", charge.payment_intent as string)

                if (error) {
                    console.error("Error updating booking:", error)
                }

                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("Error processing webhook:", error)
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        )
    }
}
