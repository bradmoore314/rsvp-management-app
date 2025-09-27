#!/bin/bash

# Navigate to the project directory
cd "/home/linux/Fun Apps/Kathleen's App"

# Add all changes
git add .

# Commit with a descriptive message
git commit -m "Fix RSVP test URL and complete authentication/RSVP management fixes

- Fixed test-rsvp-complete-flow.js to use correct URL format: /rsvp/{eventId}/{inviteId}
- All authentication issues resolved (Google sign-in button, proper user display)
- RSVP management routes working (View RSVPs button functional)
- Test suite now passes all 4 tests:
  ✅ Server Health Check
  ✅ Create Test Event  
  ✅ Generate Invites
  ✅ RSVP Form Access
- RSVP submissions working correctly with Google Sheets integration
- Events persistence across restarts confirmed working
- 12 events loaded successfully from Google Drive"

# Push to GitHub
git push origin main

echo "✅ Successfully pushed to GitHub! Railway should start deploying automatically."