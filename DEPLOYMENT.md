# RSVP Management App - Cloud Deployment Guide

## 🚀 Deploy to Cloud for External QR Code Access

Your RSVP Management App now supports **Google Drive hosting** for QR codes, which means guests can access RSVP forms from anywhere without needing your local server running.

### ✅ What's Already Set Up

1. **Google Drive Integration** - RSVP forms are hosted on Google Drive
2. **Cloud-Ready QR Codes** - QR codes point to Google Drive hosted forms
3. **External Access** - Guests can access forms from anywhere

### 🌐 Deployment Options

#### Option 1: Heroku (Recommended - Free Tier Available)

1. **Install Heroku CLI**
   ```bash
   # Install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App**
   ```bash
   cd "/home/linux/Fun Apps/Kathleen's App"
   heroku create your-rsvp-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set GOOGLE_CLIENT_ID=your_google_client_id
   heroku config:set GOOGLE_CLIENT_SECRET=your_google_client_secret
   heroku config:set GOOGLE_REDIRECT_URI=https://your-rsvp-app-name.herokuapp.com/auth/google/callback
   heroku config:set APP_URL=https://your-rsvp-app-name.herokuapp.com
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy RSVP app"
   git push heroku main
   ```

#### Option 2: Vercel (Free Tier Available)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd "/home/linux/Fun Apps/Kathleen's App"
   vercel
   ```

3. **Set Environment Variables** in Vercel dashboard:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (your Vercel URL)
   - `APP_URL` (your Vercel URL)

#### Option 3: Railway (Free Tier Available)

1. **Connect GitHub** to Railway
2. **Deploy from GitHub** repository
3. **Set Environment Variables** in Railway dashboard

### 🔧 Google Cloud Console Updates

After deploying, update your Google OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add your cloud URL to **Authorized redirect URIs**:
   - `https://your-app-name.herokuapp.com/auth/google/callback`
   - `https://your-app-name.vercel.app/auth/google/callback`
   - etc.

### 🎯 How It Works Now

1. **Create Events** - Use your local app or deployed app
2. **Generate QR Codes** - Choose "Use Google Drive hosting" option
3. **QR Codes Point to Google Drive** - Forms are hosted on Google Drive
4. **Guests Access Anywhere** - No need for your server to be running
5. **RSVP Data** - Still saved to Google Drive and your app

### 📱 Testing

1. **Generate QR codes** with Google Drive hosting enabled
2. **Scan QR code** with your phone
3. **Verify** it opens the Google Drive hosted form
4. **Test RSVP submission** - should work from anywhere

### 🔄 Current Status

- ✅ **Local App**: Running on http://localhost:4000
- ✅ **Google Drive Integration**: Working
- ✅ **QR Code Generation**: Working with Google Drive hosting
- ✅ **External Access**: Ready (QR codes point to Google Drive)

### 🎉 Next Steps

1. **Deploy to cloud** using one of the options above
2. **Update Google OAuth** redirect URIs
3. **Test QR codes** from external devices
4. **Share with guests** - they can access from anywhere!

Your app is now ready for external use with Google Drive hosting! 🚀






