# Stripe Payment Flow Testing Guide

## 🧪 Test Environment Setup

### Prerequisites
- ✅ Database migration applied (`add_payment_fields.sql`)
- ✅ Stripe test keys configured in `.env.local`
- ✅ Development server running (`npm run dev`)
- ✅ Code pushed to GitHub

---

## 📋 Test Checklist

### Test 1: Checkout Flow - Personal Info to Payment

**Steps:**
1. Navigate to http://localhost:3000
2. Browse cars and click "Book Now" on any vehicle
3. Select pickup/dropoff dates and times
4. Click "Continue to Checkout" or similar
5. Fill in personal information:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Phone: `+44 7700 900000`
   - Driving License: `TEST123456`
6. Click **"Continue to Payment"**

**Expected Results:**
- ✅ Button text changes to "Processing..." briefly
- ✅ Page transitions to Step 2: Payment
- ✅ Stripe embedded checkout form appears
- ✅ Total amount is displayed correctly
- ✅ Security notice is shown

**If it fails:**
- Check browser console for errors
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check network tab for API calls

---

### Test 2: Stripe Payment Processing

**Steps:**
1. In the Stripe payment form, enter test card details:
   - **Card Number:** `4242 4242 4242 4242`
   - **Expiry:** `12/25` (any future date)
   - **CVC:** `123` (any 3 digits)
   - **Name:** `Test User`
   - **Postal Code:** `12345`
2. Click **"Pay"** button in Stripe form
3. Wait for payment to process (should be instant in test mode)

**Expected Results:**
- ✅ Payment processes successfully
- ✅ Page automatically transitions to Step 3: Documents
- ✅ No errors in console
- ✅ Booking created in database with `payment_status: "paid"`

**If it fails:**
- Check Stripe Dashboard → Payments for the test payment
- Check browser console for errors
- Verify webhook endpoint is accessible

---

### Test 3: Document Upload (After Payment)

**Steps:**
1. After successful payment, you should be on Step 3: Documents
2. Upload required documents:
   - Driving License Front
   - Driving License Back
   - Proof of Address
   - NI Number
3. Click **"Continue to Confirm"**

**Expected Results:**
- ✅ Document upload works normally
- ✅ Can proceed to confirmation step
- ✅ All uploaded documents are saved

---

### Test 4: Final Confirmation & Submission

**Steps:**
1. Review all information on Step 4: Confirmation
2. Click **"Confirm Booking"**

**Expected Results:**
- ✅ Booking is updated with document URLs
- ✅ Redirects to confirmation page
- ✅ Booking status is "Documents Submitted"
- ✅ Payment status is "paid"

---

## 🔍 Database Verification

### Check Booking in Supabase

1. Go to Supabase Dashboard → Table Editor → `bookings`
2. Find the test booking
3. Verify fields:
   ```
   status: "Documents Submitted"
   payment_status: "paid"
   stripe_session_id: "cs_test_..."
   stripe_payment_intent: "pi_..."
   customer_name: "Test User"
   customer_email: "test@example.com"
   ```

---

## 🎯 Stripe Dashboard Verification

### Check Payment in Stripe

1. Go to https://dashboard.stripe.com/test/payments
2. Find the test payment (should be at the top)
3. Verify:
   - ✅ Amount matches booking total
   - ✅ Status is "Succeeded"
   - ✅ Metadata contains `bookingId`
   - ✅ Customer email matches

### Check Webhook Delivery

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Check **Recent deliveries**
4. Find the `checkout.session.completed` event
5. Verify:
   - ✅ Status is "Succeeded" (200 response)
   - ✅ Response body shows `{"received":true}`

---

## 🧪 Test Scenarios

### Scenario 1: Successful Payment Flow
- ✅ Personal info → Payment → Documents → Confirm
- ✅ All steps work smoothly
- ✅ Booking created with paid status

### Scenario 2: Payment Failure
**Test with card:** `4000 0000 0000 0002` (card declined)
- ✅ Payment fails
- ✅ Error message shown
- ✅ User can retry payment
- ✅ Booking remains in "pending" status

### Scenario 3: Cannot Skip Payment
- ✅ Try to access documents step without payment
- ✅ Should show "Please complete payment first" error
- ✅ Cannot proceed without successful payment

---

## 🐛 Common Issues & Solutions

### Issue 1: Stripe Form Not Loading
**Symptoms:** Blank payment step or "Preparing payment..." forever

**Solutions:**
- Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`
- Verify it starts with `pk_test_` or `pk_live_`
- Check browser console for errors
- Restart dev server

### Issue 2: Payment Succeeds but Doesn't Redirect
**Symptoms:** Payment goes through but stuck on payment step

**Solutions:**
- Check webhook is configured correctly
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check webhook delivery in Stripe Dashboard
- Manually check booking status in database

### Issue 3: "Missing booking or document data" Error
**Symptoms:** Error when trying to submit on confirmation step

**Solutions:**
- Ensure payment completed successfully
- Check `bookingId` is stored in state
- Verify documents were uploaded
- Check browser console for state issues

---

## 📊 Success Criteria

All of the following must be true for a successful test:

- [x] Checkout page loads without errors
- [x] Personal info form validates correctly
- [x] "Continue to Payment" creates booking and shows Stripe form
- [x] Stripe embedded checkout loads successfully
- [x] Test card payment processes successfully
- [x] Webhook updates booking to "paid" status
- [x] Automatically redirects to documents step after payment
- [x] Document upload works normally
- [x] Final submission updates booking with documents
- [x] Booking appears in Supabase with correct status
- [x] Payment appears in Stripe Dashboard
- [x] Webhook delivery shows success

---

## 🚀 Production Deployment Checklist

Before deploying to production:

1. **Environment Variables:**
   - [ ] Update Stripe keys to production (`pk_live_...`, `sk_live_...`)
   - [ ] Set `STRIPE_WEBHOOK_SECRET` to production webhook secret
   - [ ] Verify all env vars in deployment platform (Vercel/etc)

2. **Stripe Configuration:**
   - [ ] Create production webhook endpoint
   - [ ] Configure events: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`
   - [ ] Test webhook delivery with Stripe CLI

3. **Database:**
   - [ ] Apply migration to production database
   - [ ] Verify indexes are created
   - [ ] Test with real payment (small amount)

4. **Testing:**
   - [ ] Test full flow in production
   - [ ] Verify webhook works in production
   - [ ] Check booking appears correctly
   - [ ] Monitor first few real payments

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Stripe Dashboard for payment/webhook status
3. Check Supabase logs for database errors
4. Review server logs for API errors

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient funds: `4000 0000 0000 9995`
- More test cards: https://stripe.com/docs/testing
