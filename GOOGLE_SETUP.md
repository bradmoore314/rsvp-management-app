# Google Drive API Setup Guide

This guide will help you set up Google Drive API credentials for the RSVP Management App.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "RSVP Management App")
5. Click "Create"

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on "Google Drive API"
4. Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required fields:
     - App name: "RSVP Management App"
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/drive.file`
     - `https://www.googleapis.com/auth/drive.metadata.readonly`
   - Add test users (your email address)
4. Choose "Web application" as the application type
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `https://yourdomain.com/auth/google/callback` (for production)
6. Click "Create"
7. Copy the Client ID and Client Secret

## Step 4: Configure Environment Variables

1. Copy the `env.example` file to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file and add your credentials:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   ```

## Step 5: Test the Setup

1. Start the application:
   ```bash
   npm start
   ```

2. Test the authentication endpoint:
   ```bash
   curl http://localhost:3000/auth/google
   ```

3. You should receive a response with an `authUrl` that you can visit to authenticate.

## API Endpoints

Once set up, the following endpoints will be available:

### Authentication
- `GET /auth/google` - Get Google OAuth URL
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/status` - Check authentication status
- `POST /auth/revoke` - Revoke authentication

### Google Drive Operations
- `POST /drive/folder` - Create a folder
- `POST /drive/file` - Create a text file
- `GET /drive/files` - List files
- `POST /drive/rsvp-data` - Store RSVP data
- `GET /drive/rsvp-data/:eventId` - Retrieve RSVP data

## Troubleshooting

### Common Issues

1. **"Google Drive service not initialized"**
   - Check that your `.env` file exists and contains valid credentials
   - Ensure the Google Drive API is enabled in your Google Cloud project

2. **"Invalid redirect URI"**
   - Make sure the redirect URI in your OAuth credentials matches exactly
   - Check that the URI is added to the authorized redirect URIs list

3. **"Access blocked"**
   - Your app might be in testing mode
   - Add your email as a test user in the OAuth consent screen
   - For production, you'll need to verify your app with Google

### Testing Authentication

You can test the authentication flow manually:

1. Get the auth URL:
   ```bash
   curl http://localhost:3000/auth/google
   ```

2. Visit the returned URL in your browser
3. Complete the OAuth flow
4. Check the status:
   ```bash
   curl http://localhost:3000/auth/status
   ```

## Security Notes

- Never commit your `.env` file to version control
- Keep your Client Secret secure
- Use HTTPS in production
- Regularly rotate your credentials
- Monitor API usage in the Google Cloud Console

## Production Deployment

For production deployment:

1. Update the OAuth consent screen to "Production"
2. Add your production domain to authorized redirect URIs
3. Verify your app with Google (if required)
4. Use environment variables for all sensitive data
5. Enable HTTPS for your application










