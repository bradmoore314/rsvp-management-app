# 🚀 Complete Google Apps Script Setup Guide

## Step 1: Create Google Apps Script

1. **Go to**: https://script.google.com/
2. **Click**: "New Project"
3. **Replace all code** with the content below:

```javascript
/**
 * RSVP Management App - Google Apps Script
 * Handles RSVP form submissions and stores them in Google Sheets
 */

// Configuration - UPDATE THESE VALUES
const SPREADSHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Replace with your actual Google Sheet ID
const SHEET_NAME = 'RSVP Responses';

/**
 * Handle POST requests from RSVP forms
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    if (action === 'storeRSVP') {
      const rsvpData = requestData.data;
      const result = storeRSVP(rsvpData);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'RSVP submitted successfully',
        data: result
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'createEventSheet') {
      const eventData = requestData.data;
      const result = createEventSheet(eventData);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Event sheet created successfully',
        data: result
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Invalid action'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Google Apps Script is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Store RSVP data in the appropriate sheet
 */
function storeRSVP(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(data.eventId);
    
    // If sheet doesn't exist, create it
    if (!sheet) {
      sheet = createEventSheet({
        eventId: data.eventId,
        eventName: data.eventName || 'Unknown Event',
        eventDate: data.eventDate || '',
        eventLocation: data.eventLocation || ''
      });
    }

    // Add headers if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Guest Name', 'Guest Email', 'Attendance', 
        'Guest Count', 'Dietary Restrictions', 'Message', 'Invite ID'
      ]);
    }

    // Add the RSVP data
    sheet.appendRow([
      data.timestamp,
      data.guestName,
      data.guestEmail,
      data.attendance,
      data.guestCount,
      data.dietaryRestrictions ? data.dietaryRestrictions.join(', ') : '',
      data.message,
      data.inviteId
    ]);

    return {
      eventId: data.eventId,
      rowAdded: sheet.getLastRow(),
      timestamp: data.timestamp
    };
  } catch (error) {
    console.error('Error storing RSVP:', error);
    throw new Error('Failed to store RSVP: ' + error.message);
  }
}

/**
 * Create a new sheet for an event
 */
function createEventSheet(eventData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Create new sheet with event ID as name
    const sheet = spreadsheet.insertSheet(eventData.eventId);
    
    // Add event information at the top
    sheet.getRange('A1:H1').setValues([[
      'Event Information', '', '', '', '', '', '', ''
    ]]);
    sheet.getRange('A2:B2').setValues([['Event Name', eventData.eventName]]);
    sheet.getRange('A3:B3').setValues([['Event Date', eventData.eventDate]]);
    sheet.getRange('A4:B4').setValues([['Event Location', eventData.eventLocation]]);
    sheet.getRange('A5:B5').setValues([['Created', new Date().toISOString()]]);
    
    // Add empty row
    sheet.getRange('A6:H6').setValues([['', '', '', '', '', '', '', '']]);
    
    // Add headers for RSVP data
    sheet.getRange('A7:H7').setValues([[
      'Timestamp', 'Guest Name', 'Guest Email', 'Attendance', 
      'Guest Count', 'Dietary Restrictions', 'Message', 'Invite ID'
    ]]);
    
    // Format headers
    sheet.getRange('A7:H7').setFontWeight('bold');
    sheet.getRange('A1:H1').setFontWeight('bold');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 8);
    
    return {
      eventId: eventData.eventId,
      sheetName: eventData.eventId,
      created: true
    };
  } catch (error) {
    console.error('Error creating event sheet:', error);
    throw new Error('Failed to create event sheet: ' + error.message);
  }
}
```

## Step 2: Create Google Sheet

1. **Go to**: https://sheets.google.com/
2. **Create a new spreadsheet**
3. **Copy the Sheet ID** from the URL (the long string between `/d/` and `/edit`)
4. **Update the script** with your Sheet ID

## Step 3: Deploy the Script

1. **In Google Apps Script**, click "Deploy" → "New deployment"
2. **Choose type**: "Web app"
3. **Execute as**: "Me"
4. **Who has access**: "Anyone"
5. **Click "Deploy"**
6. **Copy the Web App URL** - you'll need this!

## Step 4: Configure Your App

Add this to your `.env` file:
```
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Step 5: Test Everything

1. Restart your app
2. Create an event
3. Generate QR codes
4. Scan and submit RSVP
5. Check your Google Sheet!

## 🎉 You're Done!

Your RSVP forms will now automatically save to Google Sheets!






