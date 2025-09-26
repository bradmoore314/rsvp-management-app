# Manual Testing Checklist for "Yes or No Invites"

## 🎯 **Pre-Testing Setup**

### Environment Setup
- [ ] Server is running on correct port (3000 for local, 8080 for production)
- [ ] Google Drive API credentials are configured
- [ ] Environment variables are set correctly
- [ ] Database/Google Drive connection is working
- [ ] All dependencies are installed (`npm install`)

### Browser Setup
- [ ] Test in Chrome/Chromium
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test on mobile device/browser
- [ ] Clear browser cache and cookies before testing

---

## 🏠 **Host Dashboard Testing**

### Authentication & Access
- [ ] Can access host dashboard at `/host-dashboard`
- [ ] Google OAuth authentication works
- [ ] Session persists after page refresh
- [ ] Can log out and log back in
- [ ] Authentication errors are handled gracefully

### Event Creation
- [ ] **Basic Event Creation**
  - [ ] Can create event with all required fields
  - [ ] Event name validation works (required, not empty)
  - [ ] Date validation works (required, valid format)
  - [ ] Time validation works (required, valid format)
  - [ ] Location validation works (required, not empty)
  - [ ] Host name validation works (required, not empty)
  - [ ] Host email validation works (required, valid email format)

- [ ] **Optional Fields**
  - [ ] Description field is optional
  - [ ] Event category can be selected
  - [ ] Event tags can be added
  - [ ] Event image can be uploaded and previewed
  - [ ] Image preview shows correctly
  - [ ] Can remove uploaded image

- [ ] **Display Options**
  - [ ] "Show dietary restrictions" checkbox works
  - [ ] "Show dress code" checkbox works
  - [ ] "Show host message" checkbox works
  - [ ] Dress code field appears/disappears based on checkbox
  - [ ] Host message field appears/disappears based on checkbox
  - [ ] Settings persist when editing event

- [ ] **Reminder Settings**
  - [ ] "Enable reminders" checkbox works
  - [ ] Reminder days field appears/disappears based on checkbox
  - [ ] Reminder days validation works (1-30 days)

- [ ] **Event Status**
  - [ ] Can set event status (Active, Paused, Cancelled)
  - [ ] Status is displayed correctly in event list

### Event Management
- [ ] **Event List**
  - [ ] Created events appear in the list
  - [ ] Event details are displayed correctly
  - [ ] Event status is shown
  - [ ] Event category and tags are displayed
  - [ ] Quick action buttons work (Pause/Resume)

- [ ] **Event Editing**
  - [ ] Can edit existing event
  - [ ] All fields load with current values
  - [ ] Changes are saved correctly
  - [ ] Display options persist correctly
  - [ ] Event updates are reflected in the list

- [ ] **Event Deletion**
  - [ ] Can delete an event
  - [ ] Confirmation dialog appears
  - [ ] Event is removed from list
  - [ ] Associated invites and RSVPs are cleaned up

- [ ] **Event Duplication**
  - [ ] Can duplicate an event
  - [ ] Duplicated event has new ID
  - [ ] All settings are copied correctly
  - [ ] Can modify duplicated event independently

### Dashboard Statistics
- [ ] **Overview Stats**
  - [ ] Total Events count is correct
  - [ ] Total Guests count is correct
  - [ ] Response Rate percentage is correct
  - [ ] Attending count is correct
  - [ ] Upcoming Events count is correct
  - [ ] Stats update when events/RSVPs change

- [ ] **Event Stats**
  - [ ] Individual event stats are accurate
  - [ ] Attending/Not Attending/Maybe counts are correct
  - [ ] Total guest count is accurate
  - [ ] Response rate is calculated correctly

### Invite Generation
- [ ] **Generate Invites**
  - [ ] Can generate invites for an event
  - [ ] Can specify number of invites
  - [ ] QR codes are generated correctly
  - [ ] QR codes are saved as image files
  - [ ] Can view QR codes in modal
  - [ ] Can print QR codes
  - [ ] Print layout is correct

- [ ] **Invite Management**
  - [ ] Generated invites appear in event details
  - [ ] Can view individual invite details
  - [ ] QR codes are accessible via URLs
  - [ ] Invite URLs work correctly

### RSVP Management
- [ ] **View RSVPs**
  - [ ] Can view RSVP responses for an event
  - [ ] Guest details are displayed correctly
  - [ ] Phone numbers and emergency contacts are shown
  - [ ] Dietary restrictions are displayed
  - [ ] Messages are shown
  - [ ] Attendance status is correct

- [ ] **RSVP Search & Filter**
  - [ ] Can search RSVPs by guest name
  - [ ] Can filter by attendance status
  - [ ] Search results are accurate
  - [ ] Filter results are correct

- [ ] **Export RSVPs**
  - [ ] Can export RSVP data as CSV
  - [ ] CSV contains all required fields
  - [ ] Data is formatted correctly
  - [ ] File downloads successfully

### Settings
- [ ] **Email Notifications**
  - [ ] Can set notification email address
  - [ ] Default email is set correctly
  - [ ] Can enable/disable email notifications
  - [ ] Settings are saved and persist

---

## 📱 **RSVP Form Testing**

### Form Access
- [ ] **RSVP URL Access**
  - [ ] Can access RSVP form via direct URL
  - [ ] URL format: `/rsvp/:eventId/:inviteId`
  - [ ] Form loads with correct event information
  - [ ] Event details are displayed correctly

- [ ] **QR Code Access**
  - [ ] QR codes link to correct RSVP form
  - [ ] QR codes work on mobile devices
  - [ ] QR codes work on desktop (with camera)

### Form Display
- [ ] **Event Information**
  - [ ] Event name is displayed
  - [ ] Event date and time are shown
  - [ ] Event location is displayed
  - [ ] Event description is shown (if provided)
  - [ ] Host message is displayed (if enabled)
  - [ ] Dress code is shown (if enabled)

- [ ] **Conditional Fields**
  - [ ] Dietary restrictions field appears only when enabled
  - [ ] Host message appears only when enabled
  - [ ] Dress code appears only when enabled
  - [ ] Fields are hidden when disabled

### Form Submission
- [ ] **Required Fields**
  - [ ] Guest name is required
  - [ ] Guest email is required and validated
  - [ ] Attendance selection is required
  - [ ] Guest count is required and validated (minimum 1)

- [ ] **Optional Fields**
  - [ ] Phone number is optional
  - [ ] Emergency contact is optional
  - [ ] Dietary restrictions are optional
  - [ ] Message is optional

- [ ] **Validation**
  - [ ] Email format validation works
  - [ ] Guest count validation works (positive number)
  - [ ] Required field validation works
  - [ ] Error messages are clear and helpful

- [ ] **Submission Process**
  - [ ] Form submits successfully
  - [ ] Success message is displayed
  - [ ] RSVP is saved to database/Google Sheets
  - [ ] Email notification is sent (if enabled)
  - [ ] Form is cleared after successful submission

### Form Behavior
- [ ] **Responsive Design**
  - [ ] Form works on desktop
  - [ ] Form works on tablet
  - [ ] Form works on mobile
  - [ ] Form elements are properly sized
  - [ ] Text is readable on all devices

- [ ] **User Experience**
  - [ ] Form is easy to understand
  - [ ] Instructions are clear
  - [ ] Error handling is user-friendly
  - [ ] Loading states are shown during submission
  - [ ] Success feedback is clear

---

## 🔄 **Data Persistence Testing**

### Server Restart
- [ ] **Event Persistence**
  - [ ] Events are loaded from Google Drive on startup
  - [ ] Events persist after server restart
  - [ ] Events persist after redeployment
  - [ ] No events are lost during maintenance

- [ ] **RSVP Persistence**
  - [ ] RSVPs are saved to Google Sheets
  - [ ] RSVPs persist after server restart
  - [ ] RSVPs persist after redeployment
  - [ ] No RSVP data is lost

- [ ] **Invite Persistence**
  - [ ] Invites are saved to Google Drive
  - [ ] QR codes are saved as image files
  - [ ] Invites persist after server restart
  - [ ] QR codes remain accessible

### Data Integrity
- [ ] **Event Data**
  - [ ] Event data is complete and accurate
  - [ ] Display options are preserved
  - [ ] Settings are maintained
  - [ ] No data corruption occurs

- [ ] **RSVP Data**
  - [ ] RSVP data is complete and accurate
  - [ ] All fields are preserved
  - [ ] No data loss during updates
  - [ ] Statistics are calculated correctly

---

## 📧 **Email Notification Testing**

### Email Configuration
- [ ] **Email Service**
  - [ ] Email service initializes correctly
  - [ ] SMTP configuration is working
  - [ ] Email credentials are valid

- [ ] **Notification Settings**
  - [ ] Default notification email is set
  - [ ] Can change notification email
  - [ ] Email notifications can be enabled/disabled
  - [ ] Settings are saved correctly

### Email Sending
- [ ] **RSVP Notifications**
  - [ ] Email is sent when RSVP is submitted
  - [ ] Email contains correct event information
  - [ ] Email contains correct guest information
  - [ ] Email contains all RSVP details
  - [ ] Email format is readable and professional

- [ ] **Email Content**
  - [ ] Event name is correct
  - [ ] Event date and time are correct
  - [ ] Event location is correct
  - [ ] Guest name and email are correct
  - [ ] Phone number is included (if provided)
  - [ ] Emergency contact is included (if provided)
  - [ ] Attendance status is correct
  - [ ] Guest count is correct
  - [ ] Dietary restrictions are included (if provided)
  - [ ] Message is included (if provided)
  - [ ] Timestamp is correct
  - [ ] Dashboard link is included

---

## 🚀 **Performance Testing**

### Load Testing
- [ ] **Multiple Users**
  - [ ] Can handle multiple simultaneous users
  - [ ] Dashboard loads quickly with many events
  - [ ] RSVP form loads quickly
  - [ ] No timeouts or errors under normal load

- [ ] **Large Data Sets**
  - [ ] Can handle many events
  - [ ] Can handle many RSVPs per event
  - [ ] Statistics calculate quickly
  - [ ] Export functions work with large datasets

### Response Times
- [ ] **Page Load Times**
  - [ ] Host dashboard loads in < 3 seconds
  - [ ] RSVP form loads in < 2 seconds
  - [ ] Event list loads quickly
  - [ ] RSVP list loads quickly

- [ ] **Action Response Times**
  - [ ] Event creation completes in < 5 seconds
  - [ ] RSVP submission completes in < 3 seconds
  - [ ] QR code generation completes in < 2 seconds
  - [ ] Email sending completes in < 10 seconds

---

## 🔒 **Security Testing**

### Authentication
- [ ] **Session Management**
  - [ ] Sessions expire appropriately
  - [ ] Invalid sessions are rejected
  - [ ] Session hijacking is prevented
  - [ ] Logout clears session properly

- [ ] **Access Control**
  - [ ] Unauthorized access is blocked
  - [ ] API endpoints are protected
  - [ ] Host data is isolated
  - [ ] No data leakage between hosts

### Data Validation
- [ ] **Input Validation**
  - [ ] XSS attacks are prevented
  - [ ] SQL injection is prevented
  - [ ] File uploads are validated
  - [ ] Email addresses are validated

- [ ] **Output Sanitization**
  - [ ] User input is sanitized
  - [ ] No malicious content is displayed
  - [ ] File paths are secure
  - [ ] URLs are validated

---

## 📱 **Mobile Testing**

### Mobile Compatibility
- [ ] **Touch Interface**
  - [ ] Buttons are touch-friendly
  - [ ] Form inputs work on mobile
  - [ ] Scrolling works smoothly
  - [ ] No horizontal scrolling issues

- [ ] **QR Code Scanning**
  - [ ] QR codes scan correctly on mobile
  - [ ] Camera access works
  - [ ] QR codes are readable
  - [ ] Links open correctly

### Responsive Design
- [ ] **Layout Adaptation**
  - [ ] Layout adapts to screen size
  - [ ] Text is readable
  - [ ] Images scale properly
  - [ ] Navigation works on mobile

---

## 🐛 **Error Handling Testing**

### Network Errors
- [ ] **Connection Issues**
  - [ ] Handles network timeouts gracefully
  - [ ] Shows appropriate error messages
  - [ ] Allows retry of failed operations
  - [ ] No data loss during network issues

- [ ] **Server Errors**
  - [ ] Handles 500 errors gracefully
  - [ ] Shows user-friendly error messages
  - [ ] Logs errors appropriately
  - [ ] Recovers from server restarts

### User Errors
- [ ] **Invalid Input**
  - [ ] Clear error messages for invalid input
  - [ ] Form validation prevents submission
  - [ ] Users can correct errors easily
  - [ ] No crashes from invalid data

- [ ] **Missing Data**
  - [ ] Handles missing events gracefully
  - [ ] Handles missing invites gracefully
  - [ ] Shows appropriate "not found" messages
  - [ ] Provides helpful navigation options

---

## ✅ **Final Verification**

### Complete Workflow
- [ ] **End-to-End Test**
  - [ ] Create event → Generate invites → Submit RSVP → View results
  - [ ] All steps work correctly
  - [ ] Data flows properly between steps
  - [ ] No data loss or corruption
  - [ ] Email notifications work

### Data Consistency
- [ ] **Cross-Platform Consistency**
  - [ ] Data is consistent across all views
  - [ ] Statistics match actual data
  - [ ] No discrepancies between dashboard and RSVP view
  - [ ] Export data matches displayed data

### User Experience
- [ ] **Overall Experience**
  - [ ] App is intuitive to use
  - [ ] Error messages are helpful
  - [ ] Success messages are clear
  - [ ] Loading states are appropriate
  - [ ] App feels responsive and fast

---

## 📝 **Test Results Documentation**

### Test Environment
- **Date**: ___________
- **Tester**: ___________
- **Browser**: ___________
- **Device**: ___________
- **Server Environment**: ___________

### Issues Found
- [ ] **Critical Issues**: ___________
- [ ] **Major Issues**: ___________
- [ ] **Minor Issues**: ___________
- [ ] **Enhancement Suggestions**: ___________

### Test Coverage
- [ ] **Passed Tests**: ___ / ___
- [ ] **Failed Tests**: ___ / ___
- [ ] **Skipped Tests**: ___ / ___
- [ ] **Overall Pass Rate**: ___%

### Sign-off
- [ ] **Ready for Production**: Yes / No
- [ ] **Additional Testing Required**: Yes / No
- [ ] **Comments**: ___________
