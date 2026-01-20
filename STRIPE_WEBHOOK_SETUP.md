# Stripe Webhook Configuration Guide

## 📍 Webhook Endpoint URL

Your webhook endpoint is now available at:

```
https://yourdomain.com/api/webhooks/stripe
```

**For local testing:**
```
http://localhost:3000/api/webhooks/stripe
```

---

## 🔧 Setup Instructions

### 1. **Configure Webhook in Stripe Dashboard**

#### For Production:
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your endpoint URL:
   ```
   https://sedulousgroup.net/api/webhooks/stripe
   ```
4. Select events to listen to:
   - ✅ `checkout.session.completed` - When payment is successful
   - ✅ `payment_intent.succeeded` - When payment intent succeeds
   - ✅ `payment_intent.payment_failed` - When payment fails
   - ✅ `charge.refunded` - When a refund is processed
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_...`)

#### For Testing (Local Development):
Use Stripe CLI to forward webhooks to your local machine:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook signing secret for testing.

---

### 2. **Add Webhook Secret to Environment Variables**

Add the webhook signing secret to your `.env.local` file:

```env
# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
```

**Important:** 
- For production, add this to your Vercel/deployment environment variables
- Never commit this secret to version control

---

### 3. **Update Your Booking Flow**

To link Stripe sessions with bookings, update your booking creation to store the `stripe_session_id`:

```typescript
// When creating a booking, store the session ID
const { data: booking } = await supabase
  .from("bookings")
  .insert({
    // ... other booking fields
    stripe_session_id: sessionId, // From createCheckoutSession
    payment_status: "pending",
  })
```

---

## 🎯 What the Webhook Does

The webhook automatically handles these events:

### ✅ `checkout.session.completed`
- Updates booking status to `"paid"`
- Stores payment intent ID
- Confirms successful payment

### ✅ `payment_intent.succeeded`
- Logs successful payment
- Can trigger additional actions (emails, notifications)

### ❌ `payment_intent.payment_failed`
- Updates booking to `payment_status: "failed"`
- Allows you to notify customer or retry

### 💰 `charge.refunded`
- Updates booking to `payment_status: "refunded"`
- Sets booking status to `"cancelled"`

---

## 🧪 Testing Webhooks

### Using Stripe CLI (Recommended):
```bash
# Listen for webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

### Using Stripe Dashboard:
1. Go to **Webhooks** in Stripe Dashboard
2. Click on your endpoint
3. Click **"Send test webhook"**
4. Select event type and send

---

## 📊 Monitoring Webhooks

### In Stripe Dashboard:
- Go to **Webhooks** → Click your endpoint
- View **Recent deliveries** to see webhook attempts
- Check for failed deliveries and retry them

### In Your Application:
- Check server logs for webhook processing
- Look for console logs: `✅ Payment successful`, `❌ Payment failed`, etc.

---

## 🔒 Security Notes

1. **Always verify webhook signatures** - The endpoint already does this
2. **Use HTTPS in production** - Required by Stripe
3. **Keep webhook secret secure** - Never expose in client code
4. **Handle idempotency** - Stripe may send the same event multiple times

---

## 🚀 Next Steps

1. ✅ Add `STRIPE_WEBHOOK_SECRET` to your environment variables
2. ✅ Configure webhook endpoint in Stripe Dashboard
3. ✅ Test with Stripe CLI or test mode
4. ✅ Deploy to production
5. ✅ Monitor webhook deliveries in Stripe Dashboard

---

## 📝 Database Schema Update (Optional)

If you don't have these fields in your `bookings` table, add them:

```sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
```

---

## 🆘 Troubleshooting

**Webhook signature verification failed:**
- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- Check that you're using the right secret (test vs production)

**Webhooks not arriving:**
- Verify endpoint URL is correct
- Check that endpoint is publicly accessible (not localhost in production)
- Ensure selected events match what you're testing

**Database not updating:**
- Check server logs for errors
- Verify booking has `stripe_session_id` stored
- Ensure Supabase RLS policies allow updates
