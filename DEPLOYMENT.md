# Vercel Deployment Guide

This guide will help you deploy your Sedulous Group car rental platform to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your Supabase project credentials
3. Your Stripe secret key
4. Git installed on your machine

## Step 1: Prepare Your Repository

The project is already initialized with git. Make sure all your changes are committed:

```bash
git add .
git commit -m "Initial commit - Ready for deployment"
```

## Step 2: Push to GitHub (Recommended)

1. Create a new repository on GitHub
2. Add the remote and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Configure your project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build` (or leave default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install` (or leave default)

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

Follow the prompts. For production deployment:
```bash
vercel --prod
```

## Step 4: Configure Environment Variables

After your first deployment, you need to add environment variables in Vercel:

1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

### Required Environment Variables:

| Variable Name | Description | Where to Find |
|--------------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret!) | Supabase Dashboard → Settings → API |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard → Developers → API keys |
| `NEXT_PUBLIC_SITE_URL` | Your production URL (optional) | Will be `https://your-project.vercel.app` |

### Adding Variables:

1. Click **"Add New"**
2. Enter the variable name (exactly as shown above)
3. Enter the variable value
4. Select environments: **Production**, **Preview**, and **Development**
5. Click **"Save"**

### Important Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is sensitive - never commit it to git
- `STRIPE_SECRET_KEY` is sensitive - never commit it to git
- After adding variables, you need to **redeploy** for them to take effect

## Step 5: Redeploy with Environment Variables

After adding all environment variables:

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger automatic redeployment

## Step 6: Verify Deployment

1. Visit your deployment URL (e.g., `https://your-project.vercel.app`)
2. Test key features:
   - User signup/login
   - Car browsing
   - Booking creation
   - PDF generation
   - Payment processing (if configured)

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Check the build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version (Vercel uses Node 18.x by default)

### Environment Variable Issues

- Make sure variable names match exactly (case-sensitive)
- Ensure all required variables are set
- Redeploy after adding variables

### Database Connection Issues

- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure RLS (Row Level Security) policies are configured

### Image/Asset Issues

- Verify all images in `/public` folder are committed
- Check that logo file (`sed.jpg`) exists in `/public`

## Additional Configuration

### Custom Domain

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

### Environment-Specific Variables

You can set different values for Production, Preview, and Development:
- Production: Live site
- Preview: Pull request previews
- Development: Local development

## Support

For issues:
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs

---

**Last Updated**: December 30, 2024

