# ⚠️ IMPORTANT: Production Environment Variables

This file contains the production Stripe API keys and other sensitive credentials for deployment.

## 🔐 Stripe Configuration (Production)

**Publishable Key:**
```
pk_live_51Qe0ExAYhIzSTqYQyEkxfNvjnjEvykSZhgX8lq0xg3WU6how6nvthwEhHLWzPe6cuOyu0HoiNJ3WgGvZMc5VgVBA00mSxfWppN
```

**Secret Key:**
```
mk_1QeIG0AYhIzSTqYQQTmdPHe3
```

**Webhook Signing Secret:**
```
whsec_2mqWT9incxI7VhNxNnJqnZGcA2BMxZN0
```

---

## 📋 Deployment Checklist

### ✅ Local Environment (.env.local)
- [x] Updated with production Stripe keys
- [x] Webhook secret configured

### 🚀 Production Environment (Vercel/Hosting)
Add these environment variables to your production deployment:

```env
# Stripe Production Keys
STRIPE_SECRET_KEY=mk_1QeIG0AYhIzSTqYQQTmdPHe3
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51Qe0ExAYhIzSTqYQyEkxfNvjnjEvykSZhgX8lq0xg3WU6how6nvthwEhHLWzPe6cuOyu0HoiNJ3WgGvZMc5VgVBA00mSxfWppN
STRIPE_WEBHOOK_SECRET=whsec_2mqWT9incxI7VhNxNnJqnZGcA2BMxZN0
```

### 🔗 Stripe Dashboard Configuration
1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://sedulousgroup.net/api/webhooks/stripe`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
5. Verify the webhook secret matches: `whsec_2mqWT9incxI7VhNxNnJqnZGcA2BMxZN0`

---

## 🧪 Testing

### Test Payment Flow:
1. Create a booking
2. Use Stripe test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any 3-digit CVC
5. Verify booking status updates to "paid"

### Test Webhook:
```bash
# Using Stripe CLI
stripe trigger checkout.session.completed
```

---

## ⚠️ Security Notes

- **Never commit** `.env.local` to Git (already in `.gitignore`)
- **Rotate keys** if accidentally exposed
- **Use test keys** for development/testing
- **Monitor** Stripe Dashboard for suspicious activity

---

## 📞 Support

If you encounter issues:
1. Check Stripe Dashboard → Webhooks for delivery status
2. Review server logs for webhook processing errors
3. Verify environment variables are set correctly in production
