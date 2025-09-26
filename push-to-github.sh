#!/bin/bash

echo "🚀 Push RSVP App to GitHub"
echo "=========================="
echo ""

echo "📋 Your repository is ready: https://github.com/bradmoore314/rsvp-management-app"
echo ""

echo "🔐 You need to authenticate with GitHub first:"
echo ""
echo "Option 1: Personal Access Token (Recommended)"
echo "1. Go to: https://github.com/settings/tokens"
echo "2. Click 'Generate new token' → 'Generate new token (classic)'"
echo "3. Set expiration: 90 days"
echo "4. Select scopes: Check 'repo'"
echo "5. Click 'Generate token'"
echo "6. Copy the token"
echo ""

echo "Option 2: Use GitHub CLI"
echo "1. Install: curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
echo "2. Run: gh auth login"
echo ""

echo "📤 After authentication, run:"
echo "git push -u origin main"
echo ""

echo "🌐 Then deploy to Render:"
echo "1. Go to: https://render.com/"
echo "2. Sign up with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Connect your repository: bradmoore314/rsvp-management-app"
echo "5. Configure:"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "   - Environment: Node"
echo ""

echo "⚙️ Set Environment Variables in Render:"
echo "GOOGLE_CLIENT_ID=your_google_client_id"
echo "GOOGLE_CLIENT_SECRET=your_google_client_secret"
echo "GOOGLE_REDIRECT_URI=https://your-app.onrender.com/auth/google/callback"
echo "APP_URL=https://your-app.onrender.com"
echo "NODE_ENV=production"
echo "PORT=10000"
echo ""

echo "🎉 Result: Your app will be live and web-based!"
echo "QR codes will work from anywhere in the world!"
echo ""

read -p "Press Enter when you're ready to authenticate and push..."
