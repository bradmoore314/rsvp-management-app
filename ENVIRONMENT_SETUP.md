# Environment Setup Guide

## Required Environment Variables

You need to set these environment variables in your Railway deployment:

### Google OAuth Configuration
```
GOOGLE_CLIENT_ID=317952139039-eb0m52pb4ismluq3ujh964n72ftaa8u6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
GOOGLE_REDIRECT_URI=https://rsvp-management-app-production.up.railway.app/auth/google/callback
```

### App Configuration
```
APP_URL=https://rsvp-management-app-production.up.railway.app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
PORT=3000
```

### Database Configuration
```
DATABASE_PATH=./data/app.db
```

## How to Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Add each environment variable listed above
5. Make sure to use your actual Google Client Secret (not the placeholder)

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI to: `https://rsvp-management-app-production.up.railway.app/auth/google/callback`
6. Copy the Client ID and Client Secret

## Local Development

For local development, create a `.env` file in the project root with:

```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
APP_URL=http://localhost:3000
JWT_SECRET=dev-secret-key
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data/app.db
```

## Troubleshooting

- Make sure all environment variables are set in Railway
- Verify the Google OAuth redirect URI matches exactly
- Check that the Google Client Secret is correct
- Ensure the JWT_SECRET is a secure random string
