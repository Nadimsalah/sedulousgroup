# Quick Start - Deploy to Vercel

## 🚀 Fastest Way to Deploy

### Method 1: Using Vercel Dashboard (Recommended for First Time)

1. **Push to GitHub:**
   ```bash
   # Create a new repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your repository
   - Click "Deploy" (don't worry about env vars yet)

3. **Add Environment Variables:**
   After first deployment, go to:
   - **Settings** → **Environment Variables**
   - Add these 4 required variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `STRIPE_SECRET_KEY`

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** → **"Redeploy"**

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login
vercel login

# Deploy (preview)
vercel

# Deploy to production
vercel --prod
```

Or use the helper script:
```bash
./deploy.sh
```

## 📋 Required Environment Variables

Get these from your service dashboards:

| Variable | Where to Find |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel URL (optional, auto-set) |

## ✅ Verification Checklist

After deployment, verify:
- [ ] Site loads without errors
- [ ] User can sign up/login
- [ ] Cars are visible
- [ ] Bookings can be created
- [ ] PDFs generate correctly
- [ ] Logo appears in PDFs

## 🆘 Need Help?

See `DEPLOYMENT.md` for detailed instructions.


