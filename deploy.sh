#!/bin/bash

# Vercel Deployment Helper Script
# This script helps you deploy to Vercel

echo "🚀 Vercel Deployment Helper"
echo "============================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
    echo ""
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 You need to login to Vercel first."
    echo "Running: vercel login"
    vercel login
    echo ""
fi

echo "📋 Current Vercel user:"
vercel whoami
echo ""

echo "🌐 Deploying to Vercel..."
echo "Choose deployment type:"
echo "1. Preview deployment (for testing)"
echo "2. Production deployment"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "2" ]; then
    echo "🚀 Deploying to PRODUCTION..."
    vercel --prod
else
    echo "🧪 Deploying PREVIEW..."
    vercel
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Add environment variables in Settings → Environment Variables"
echo "3. Redeploy after adding variables"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"


