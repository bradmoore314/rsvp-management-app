# 🚀 Deploy RSVP App to Railway (Web-Based)

## ✅ **What This Achieves**
- **Web-based access**: Your app will be accessible from anywhere in the world
- **Real QR codes**: QR codes will point to your live web app, not localhost
- **No downloads**: Users get web forms, not downloadable HTML files
- **Professional URLs**: Like `https://your-app.railway.app/rsvp/event-id/invite-id`

## 🚀 **Step 1: Deploy to Railway**

### Option A: Using Railway CLI (Recommended)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Deploy your app**:
   ```bash
   cd "/home/linux/Fun Apps/Kathleen's App"
   railway deploy
   ```

### Option B: Using Railway Web Interface

1. **Go to**: https://railway.app/
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Connect your GitHub account** (you'll need to push to GitHub first)

## 🔧 **Step 2: Set Environment Variables**

After deployment, set these environment variables in Railway dashboard:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.railway.app/auth/google/callback
APP_URL=https://your-app.railway.app
NODE_ENV=production
```

## 🔧 **Step 3: Update Google OAuth Settings**

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Edit your OAuth 2.0 Client ID**
3. **Add to Authorized redirect URIs**:
   - `https://your-app.railway.app/auth/google/callback`
4. **Add to Authorized JavaScript origins**:
   - `https://your-app.railway.app`

## 🎯 **Step 4: Test Your Web-Based App**

1. **Visit your live app**: `https://your-app.railway.app`
2. **Create an event**
3. **Generate QR codes** (make sure "Use Google Drive hosting" is UNCHECKED)
4. **Test QR codes** - they should now point to your live web app!

## 📱 **What Your Users Will Experience**

1. **Scan QR code** → Opens `https://your-app.railway.app/rsvp/event-id/invite-id`
2. **Fill out form** → Beautiful web form (no downloads!)
3. **Submit RSVP** → Data saved to Google Sheets
4. **Get confirmation** → Professional web experience

## 🔄 **Alternative: Deploy to Vercel (Also Free)**

If Railway doesn't work, try Vercel:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd "/home/linux/Fun Apps/Kathleen's App"
   vercel
   ```

3. **Set environment variables** in Vercel dashboard
4. **Update Google OAuth settings** with your Vercel URL

## 🎉 **Result**

Your RSVP app will be:
- ✅ **Web-based** (no localhost)
- ✅ **Accessible worldwide**
- ✅ **Professional URLs**
- ✅ **No file downloads**
- ✅ **Real-time Google Sheets integration**
