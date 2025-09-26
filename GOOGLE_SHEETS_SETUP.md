# Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets integration for your RSVP Management App, so that RSVP responses are automatically saved to Google Sheets instead of just downloading JSON files.

## Prerequisites

- A Google account
- Access to Google Apps Script
- Your RSVP Management App running

## Step 1: Create a Google Apps Script

1. **Go to Google Apps Script**: https://script.google.com/
2. **Create a new project** by clicking "New Project"
3. **Replace the default code** with the content from `google-apps-script.js` in your project
4. **Update the configuration**:
   - Replace `YOUR_GOOGLE_SHEET_ID` with your actual Google Sheet ID
   - Update `SHEET_NAME` if you want a different sheet name

## Step 2: Create a Google Sheet

1. **Go to Google Sheets**: https://sheets.google.com/
2. **Create a new spreadsheet**
3. **Copy the Sheet ID** from the URL (the long string between `/d/` and `/edit`)
4. **Update the Google Apps Script** with your Sheet ID

## Step 3: Deploy the Google Apps Script

1. **In Google Apps Script**, click "Deploy" → "New deployment"
2. **Choose type**: "Web app"
3. **Execute as**: "Me"
4. **Who has access**: "Anyone"
5. **Click "Deploy"**
6. **Copy the Web App URL** - you'll need this for your app

## Step 4: Configure Your App

1. **Add the Google Apps Script URL** to your `.env` file:
   ```
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

2. **Restart your app** to load the new environment variable

## Step 5: Test the Integration

1. **Create an event** in your RSVP Management App
2. **Generate QR codes** with Google Drive hosting enabled
3. **Scan a QR code** and fill out the RSVP form
4. **Check your Google Sheet** - the response should appear automatically

## How It Works

1. **Event Creation**: When you create an event, the app creates a Google Sheet for that event
2. **QR Code Generation**: QR codes point to beautiful HTML forms hosted on Google Drive
3. **Form Submission**: When someone fills out the form, it submits data to your Google Apps Script
4. **Data Storage**: The Google Apps Script automatically adds the response to your Google Sheet
5. **Real-time Updates**: You can see RSVP responses in real-time in your Google Sheet

## Features

- **Automatic Sheet Creation**: Each event gets its own Google Sheet
- **Real-time Updates**: Responses appear immediately in the sheet
- **Organized Data**: Responses are organized with headers and formatting
- **Event Information**: Each sheet includes event details at the top
- **Multiple Responses**: Handle unlimited RSVP responses per event

## Troubleshooting

### Google Apps Script Not Working
- Make sure the script is deployed as a web app
- Check that "Anyone" has access to the web app
- Verify the script URL is correct in your `.env` file

### Sheet Not Created
- Check that your Google account has permission to create sheets
- Verify the Google Sheets API is enabled in your Google Cloud Console

### Form Submissions Not Appearing
- Check the browser console for JavaScript errors
- Verify the Google Apps Script URL is accessible
- Make sure the script has permission to edit your sheet

## Security Notes

- The Google Apps Script is set to "Anyone" access for form submissions
- Only you can see and edit the Google Sheet
- RSVP data is stored securely in your Google account
- No sensitive data is exposed in the hosted forms

## Next Steps

Once set up, you can:
- **View responses in real-time** in your Google Sheet
- **Export data** to Excel or CSV
- **Create charts and graphs** of attendance
- **Share the sheet** with other event organizers
- **Set up notifications** for new responses

Your RSVP Management App now has full Google Sheets integration! 🎉
