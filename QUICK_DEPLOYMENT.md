# 🚀 Quick Web Deployment Guide

## 🎯 **Goal**: Make your RSVP app web-based (no more localhost!)

## ⚡ **Fastest Option: Render (Free & Easy)**

1. **Go to**: https://render.com/
2. **Sign up** with GitHub
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub account**
5. **Create a new repository** on GitHub with your code
6. **Select your repository** in Render
7. **Configure**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

## 🔧 **Environment Variables to Set in Render**

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.onrender.com/auth/google/callback
APP_URL=https://your-app.onrender.com
NODE_ENV=production
PORT=10000
```

## 🔧 **Update Google OAuth Settings**

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Edit your OAuth 2.0 Client ID**
3. **Add to Authorized redirect URIs**:
   - `https://your-app.onrender.com/auth/google/callback`
4. **Add to Authorized JavaScript origins**:
   - `https://your-app.onrender.com`

## 🎉 **Result**

Your QR codes will now point to:
- `https://your-app.onrender.com/rsvp/event-id/invite-id`

Instead of:
- `http://localhost:4000/rsvp/event-id/invite-id` ❌
- Google Drive downloads ❌

## 📱 **What Your Users Experience**

1. **Scan QR code** → Opens beautiful web form
2. **Fill out form** → No downloads needed!
3. **Submit RSVP** → Data saved to Google Sheets
4. **Get confirmation** → Professional experience

## 🚀 **Alternative: Railway**

If Render doesn't work, try Railway:

1. **Go to**: https://railway.app/
2. **Sign up** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Follow the same environment variable setup**

## 🎯 **After Deployment**

1. **Test your live app**: `https://your-app.onrender.com`
2. **Create an event**
3. **Generate QR codes** (make sure "Use Google Drive hosting" is UNCHECKED)
4. **Scan QR codes** - they should open your live web app!

Your RSVP system will be fully web-based and professional! 🎉
