# Environment Variables Setup Guide

## Required Environment Variables

Your application needs the following environment variables to be set in your deployment platform (Vercel, etc.):

### Supabase Variables (Required)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)

### Stripe Variables (Required for payments)
- `STRIPE_SECRET_KEY` - Stripe secret key

### Optional Variables
- `NEXT_PUBLIC_SITE_URL` - Your production URL (auto-set by Vercel)

## How to Set Environment Variables in Vercel

### Option 1: Using Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Add each variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - **Environments**: Select Production, Preview, and Development
   - Click **"Save"**

5. Repeat for all required variables:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`

6. After adding all variables, **redeploy** your application

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link your project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_SECRET_KEY
```

## Where to Find Your Values

### Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Find:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → Use for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### Stripe Credentials
1. Go to Stripe Dashboard
2. Navigate to **Developers** → **API keys**
3. Copy the **Secret key** → Use for `STRIPE_SECRET_KEY`

## Fixing the "Secret does not exist" Error

If you're getting an error about secrets not existing, you have two options:

### Option A: Use Regular Environment Variables (Recommended)

1. **Remove or update `vercel.json`** to not use secrets
2. Set environment variables directly in Vercel dashboard (as shown above)

### Option B: Create Vercel Secrets

If you want to use Vercel secrets (with `@` prefix):

1. Go to Vercel Dashboard → **Settings** → **Secrets**
2. Create secrets with these exact names:
   - `next_public_supabase_url`
   - `next_public_supabase_anon_key`
   - `supabase_service_role_key`
   - `stripe_secret_key`

3. Then your `vercel.json` will work with the `@` references

## After Setting Variables

1. **Redeploy** your application:
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

2. **Verify** the deployment:
   - Check build logs for errors
   - Test your application functionality

## Important Notes

- ⚠️ Never commit secrets to git
- ✅ Variable names are case-sensitive
- ✅ After adding variables, you must redeploy
- ✅ Use the same variables for Production, Preview, and Development environments

