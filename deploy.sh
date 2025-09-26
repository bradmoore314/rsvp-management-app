#!/bin/bash

echo "🚀 RSVP App Deployment Script"
echo "=============================="

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Please login to Railway..."
echo "This will open a browser window for authentication."
echo "Press Enter when ready..."
read

# Login to Railway
railway login

echo "🚀 Deploying your RSVP app..."
railway up

echo "✅ Deployment complete!"
echo "Your app will be available at: https://your-app.railway.app"
echo ""
echo "🔧 Next steps:"
echo "1. Set environment variables in Railway dashboard"
echo "2. Update Google OAuth settings with your Railway URL"
echo "3. Test your web-based RSVP forms!"
