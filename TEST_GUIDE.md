# 🧪 Google Drive Hosting Test Guide

## ✅ **Complete Test Suite for Google Drive Hosting**

This guide provides step-by-step instructions to test all Google Drive hosting functionality.

## 🚀 **Prerequisites**

1. **App Running**: http://localhost:4000
2. **Google Drive Connected**: OAuth tokens loaded
3. **Browser Access**: Chrome/Firefox/Safari

## 📋 **Test Checklist**

### Test 1: UI Components ✅
- [ ] **Host Dashboard Access**
  - Go to: http://localhost:4000/host-dashboard
  - Verify: Page loads without errors
  - Verify: "Generate Invites" button is visible

- [ ] **Google Drive Checkbox**
  - Click "Generate Invites"
  - Verify: "Use Google Drive hosting" checkbox is present
  - Verify: Checkbox is checked by default
  - Verify: Explanatory text is visible

### Test 2: Event Creation ✅
- [ ] **Create Test Event**
  - Click "Create Event" button
  - Fill in:
    - Name: "Google Drive Test Event"
    - Date: Tomorrow's date
    - Time: "18:00"
    - Location: "Test Location"
  - Click "Create Event"
  - Verify: Event appears in events list

### Test 3: QR Code Generation with Google Drive Hosting ✅
- [ ] **Generate QR Codes**
  - Click "Generate Invites"
  - Select your test event
  - Set invite count to: 3
  - **IMPORTANT**: Ensure "Use Google Drive hosting" is checked
  - Click "Generate Invites"
  - Verify: Success message appears
  - Verify: QR codes are generated

### Test 4: Verify Google Drive Hosting ✅
- [ ] **Check Server Logs**
  - Look for: "Generated QR code for invite [ID] (Google Drive)"
  - Look for: "Created hosted RSVP form: rsvp-[ID].html"
  - Look for: "Made the file publicly viewable"

- [ ] **Check QR Code URLs**
  - Right-click on a QR code → "Inspect"
  - Verify: QR code data URL contains Google Drive URL
  - Verify: URL format: `https://drive.google.com/uc?export=view&id=[FILE_ID]`

### Test 5: External Access Test ✅
- [ ] **Test QR Code Scanning**
  - Use your phone to scan a QR code
  - Verify: Opens Google Drive hosted form
  - Verify: Form displays event information correctly
  - Verify: Form is fully functional

- [ ] **Test Form Submission**
  - Fill out the RSVP form:
    - Name: "Test Guest"
    - Email: "test@example.com"
    - Attendance: "Yes, I'll be there!"
    - Guest Count: "2 people"
  - Click "Submit RSVP"
  - Verify: Success message appears
  - Verify: Form data is processed

### Test 6: Google Drive File Verification ✅
- [ ] **Check Google Drive**
  - Go to: https://drive.google.com/
  - Look for: "RSVP-Events" folder
  - Look for: HTML files named "rsvp-[ID].html"
  - Verify: Files are publicly accessible

- [ ] **Test Direct URL Access**
  - Copy the Google Drive URL from QR code
  - Open in incognito/private browser window
  - Verify: Form loads without authentication
  - Verify: Form is fully functional

## 🔍 **Expected Results**

### ✅ **Success Indicators:**
- QR codes show "Google Drive" in server logs
- QR code URLs point to `drive.google.com`
- Forms are accessible without local server
- Forms work in incognito mode
- RSVP submissions are processed

### ❌ **Failure Indicators:**
- QR codes show "App URL" in server logs
- QR code URLs point to `localhost:4000`
- Forms require local server to be running
- Forms don't work in incognito mode

## 🐛 **Troubleshooting**

### Issue: QR codes still use localhost
**Solution:**
1. Ensure "Use Google Drive hosting" checkbox is checked
2. Restart the server: `pkill -f "node server.js" && PORT=4000 node server.js`
3. Clear browser cache and try again

### Issue: Google Drive files not accessible
**Solution:**
1. Check Google Drive permissions
2. Verify OAuth tokens are valid
3. Check server logs for Google Drive API errors

### Issue: Forms don't load
**Solution:**
1. Verify Google Drive file is publicly accessible
2. Check file permissions in Google Drive
3. Test direct URL access

## 📊 **Test Results Template**

```
Google Drive Hosting Test Results
================================

Date: ___________
Tester: ___________

Test 1 - UI Components: [ ] PASS [ ] FAIL
Test 2 - Event Creation: [ ] PASS [ ] FAIL  
Test 3 - QR Code Generation: [ ] PASS [ ] FAIL
Test 4 - Google Drive Hosting: [ ] PASS [ ] FAIL
Test 5 - External Access: [ ] PASS [ ] FAIL
Test 6 - File Verification: [ ] PASS [ ] FAIL

Overall Result: [ ] PASS [ ] FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

## 🎯 **Quick Test Commands**

```bash
# Check server status
curl -s http://localhost:4000/health

# Check if Google Drive hosting is working
# Look for "Google Drive" in server logs when generating QR codes

# Test external access
# Scan QR code with phone and verify it works without local server
```

## 🎉 **Success Criteria**

All tests pass when:
- ✅ QR codes use Google Drive hosting
- ✅ Forms are accessible externally
- ✅ No local server dependency for guests
- ✅ RSVP data is collected properly

Your Google Drive hosting is working correctly when guests can access RSVP forms from anywhere in the world! 🌍
