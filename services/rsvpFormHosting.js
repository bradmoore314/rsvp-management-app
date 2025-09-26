const { googleDriveService, googleSheetsService } = require('./sharedServices');

class RSVPFormHostingService {
    constructor() {
        this.googleDrive = googleDriveService;
        this.googleSheets = googleSheetsService;
        this.rsvpFormTemplate = this.getRSVPFormTemplate();
    }

    /**
     * Get the HTML template for RSVP forms
     */
    getRSVPFormTemplate() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RSVP Response</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
            color: #2d3748;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .event-title {
            font-size: 24px;
            font-weight: 600;
            color: #1a202c;
            margin: 0 0 8px 0;
        }
        .event-details {
            color: #718096;
            font-size: 16px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #4a5568;
        }
        input, select, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #3182ce;
        }
        .radio-group {
            display: flex;
            gap: 20px;
            margin-top: 8px;
        }
        .radio-option {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .radio-option input[type="radio"] {
            width: auto;
        }
        .checkbox-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-top: 8px;
        }
        .checkbox-option {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .checkbox-option input[type="checkbox"] {
            width: auto;
        }
        .submit-btn {
            background: #3182ce;
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.2s;
        }
        .submit-btn:hover {
            background: #2c5aa0;
        }
        .submit-btn:disabled {
            background: #a0aec0;
            cursor: not-allowed;
        }
        .status-message {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .status-message.success {
            background: #f0fff4;
            color: #22543d;
            border: 1px solid #9ae6b4;
        }
        .status-message.error {
            background: #fed7d7;
            color: #742a2a;
            border: 1px solid #feb2b2;
        }
        .status-message.info {
            background: #ebf8ff;
            color: #2a4365;
            border: 1px solid #90cdf4;
        }
        @media (max-width: 640px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .radio-group {
                flex-direction: column;
                gap: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="event-title">{{EVENT_NAME}}</h1>
            <div class="event-details">
                <p>📅 {{EVENT_DATE}} at {{EVENT_TIME}}</p>
                <p>📍 {{EVENT_LOCATION}}</p>
                <p>👤 Hosted by {{HOST_NAME}}</p>
            </div>
        </div>

        <div id="statusMessage" class="status-message"></div>

        <form id="rsvpForm">
            <div class="form-group">
                <label for="guestName">Your Name *</label>
                <input type="text" id="guestName" name="guestName" required>
            </div>

            <div class="form-group">
                <label for="guestEmail">Email Address *</label>
                <input type="email" id="guestEmail" name="guestEmail" required>
            </div>

            <div class="form-group">
                <label>Will you be attending? *</label>
                <div class="radio-group">
                    <div class="radio-option">
                        <input type="radio" id="attending" name="attendance" value="attending" required>
                        <label for="attending">Yes, I'll be there! 🎉</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="notAttending" name="attendance" value="notAttending" required>
                        <label for="notAttending">Sorry, can't make it 😔</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="maybe" name="attendance" value="maybe" required>
                        <label for="maybe">Maybe 🤔</label>
                    </div>
                </div>
            </div>

            <div class="form-group" id="guestCountGroup" style="display: none;">
                <label for="guestCount">Number of guests (including yourself)</label>
                <select id="guestCount" name="guestCount">
                    <option value="1">1 person</option>
                    <option value="2">2 people</option>
                    <option value="3">3 people</option>
                    <option value="4">4 people</option>
                    <option value="5">5 people</option>
                    <option value="6">6 people</option>
                    <option value="7">7 people</option>
                    <option value="8">8 people</option>
                    <option value="9">9 people</option>
                    <option value="10">10+ people</option>
                </select>
            </div>

            <div class="form-group" id="dietaryGroup" style="display: none;">
                <label>Dietary Restrictions/Preferences</label>
                <div class="checkbox-group" id="dietaryOptions">
                    {{DIETARY_OPTIONS}}
                </div>
            </div>

            <div class="form-group">
                <label for="message">Message to the host (optional)</label>
                <textarea id="message" name="message" rows="3" placeholder="Any special requests, questions, or just say hello!"></textarea>
            </div>

            <button type="submit" class="submit-btn" id="submitBtn">Submit RSVP</button>
        </form>
    </div>

    <script>
        // Event data
        const eventData = {
            eventId: '{{EVENT_ID}}',
            inviteId: '{{INVITE_ID}}',
            eventName: '{{EVENT_NAME}}',
            eventDate: '{{EVENT_DATE}}',
            eventTime: '{{EVENT_TIME}}',
            eventLocation: '{{EVENT_LOCATION}}',
            hostName: '{{HOST_NAME}}',
            hostEmail: '{{HOST_EMAIL}}',
            maxGuests: {{MAX_GUESTS}},
            dietaryOptions: {{DIETARY_OPTIONS_JSON}}
        };

        // Show/hide guest count and dietary options based on attendance
        document.querySelectorAll('input[name="attendance"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const guestCountGroup = document.getElementById('guestCountGroup');
                const dietaryGroup = document.getElementById('dietaryGroup');
                
                if (this.value === 'attending') {
                    guestCountGroup.style.display = 'block';
                    dietaryGroup.style.display = 'block';
                } else {
                    guestCountGroup.style.display = 'none';
                    dietaryGroup.style.display = 'none';
                }
            });
        });

        // Form submission
        document.getElementById('rsvpForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const statusMessage = document.getElementById('statusMessage');
            
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            try {
                const formData = new FormData(this);
                const rsvpData = {
                    eventId: eventData.eventId,
                    inviteId: eventData.inviteId,
                    guestName: formData.get('guestName'),
                    guestEmail: formData.get('guestEmail'),
                    attendance: formData.get('attendance'),
                    guestCount: formData.get('guestCount') || '1',
                    dietaryRestrictions: Array.from(document.querySelectorAll('input[name="dietary"]:checked')).map(cb => cb.value),
                    message: formData.get('message'),
                    timestamp: new Date().toISOString()
                };

                // Submit to Google Sheets via Google Apps Script
                const response = await fetch('{{GOOGLE_APPS_SCRIPT_URL}}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'storeRSVP',
                        data: {
                            ...rsvpData,
                            eventName: eventData.eventName,
                            eventDate: eventData.eventDate,
                            eventLocation: eventData.eventLocation
                        }
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    statusMessage.className = 'status-message success';
                    statusMessage.innerHTML = \`
                        <strong>Thank you! Your RSVP has been recorded.</strong><br>
                        <small>Your response has been saved to the event spreadsheet. The host will be notified.</small>
                    \`;
                    statusMessage.style.display = 'block';
                    this.style.display = 'none';
                } else {
                    throw new Error(result.message || 'Failed to submit RSVP');
                }
            } catch (error) {
                console.error('RSVP submission error:', error);
                statusMessage.className = 'status-message error';
                statusMessage.textContent = 'Sorry, there was an error submitting your RSVP. Please try again.';
                statusMessage.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit RSVP';
            }
        });
    </script>
</body>
</html>`;
    }

    /**
     * Create and host an RSVP form on Google Drive
     */
    async createHostedRSVPForm(eventData, inviteId) {
        try {
            // Ensure Google Drive is initialized and ready
            if (!this.googleDrive.isReady()) {
                await this.googleDrive.initialize();
            }
            
            // Always try to load and set tokens to ensure authentication
            const savedTokens = await this.googleDrive.loadTokens();
            if (savedTokens) {
                await this.googleDrive.setCredentialsFromTokens(savedTokens);
                console.log('✅ Google Drive authentication restored for RSVP form creation');
            } else {
                throw new Error('No Google Drive authentication tokens found');
            }

            // Initialize Google Sheets service
            if (!this.googleSheets.isReady()) {
                await this.googleSheets.initialize();
            }

            // Create Google Sheet for this event (if not already created)
            let spreadsheetInfo;
            try {
                spreadsheetInfo = await this.googleSheets.createRSVPSpreadsheet(eventData);
                console.log(`✅ Created Google Sheet for event: ${eventData.name}`);
            } catch (error) {
                console.log('ℹ️ Google Sheet may already exist, continuing with form creation...');
                // Continue without failing - the sheet might already exist
            }
            
            // Replace template variables
            let htmlContent = this.rsvpFormTemplate
                .replace(/\{\{EVENT_ID\}\}/g, eventData.id)
                .replace(/\{\{INVITE_ID\}\}/g, inviteId)
                .replace(/\{\{EVENT_NAME\}\}/g, eventData.name)
                .replace(/\{\{EVENT_DATE\}\}/g, new Date(eventData.date).toLocaleDateString())
                .replace(/\{\{EVENT_TIME\}\}/g, eventData.time)
                .replace(/\{\{EVENT_LOCATION\}\}/g, eventData.location)
                .replace(/\{\{HOST_NAME\}\}/g, eventData.hostName || 'Event Host')
                .replace(/\{\{HOST_EMAIL\}\}/g, eventData.hostEmail || 'host@example.com')
                .replace(/\{\{MAX_GUESTS\}\}/g, eventData.maxGuests || 'null')
                .replace(/\{\{API_BASE_URL\}\}/g, process.env.APP_URL || 'http://localhost:3000')
                .replace(/\{\{GOOGLE_APPS_SCRIPT_URL\}\}/g, process.env.GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');

            // Handle dietary options
            const dietaryOptions = eventData.dietaryOptions || ['No Restrictions'];
            const dietaryOptionsHtml = dietaryOptions.map(option => 
                `<div class="checkbox-option">
                    <input type="checkbox" id="dietary_${option.replace(/\s+/g, '_')}" name="dietary" value="${option}">
                    <label for="dietary_${option.replace(/\s+/g, '_')}">${option}</label>
                </div>`
            ).join('');
            
            htmlContent = htmlContent
                .replace(/\{\{DIETARY_OPTIONS\}\}/g, dietaryOptionsHtml)
                .replace(/\{\{DIETARY_OPTIONS_JSON\}\}/g, JSON.stringify(dietaryOptions));

            // Create the HTML file on Google Drive
            const fileName = `rsvp-${inviteId}.html`;
            const fileMetadata = {
                name: fileName,
                parents: ['1x6ZyGMIZLGOpeqoHYpMr_BcmT12SL1CX'], // RSVP-Events folder
                mimeType: 'text/html'
            };

            const media = {
                mimeType: 'text/html',
                body: htmlContent
            };

            const file = await this.googleDrive.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id,name,webViewLink,webContentLink'
            });

            // Make the file publicly viewable
            await this.googleDrive.drive.permissions.create({
                fileId: file.data.id,
                resource: {
                    role: 'reader',
                    type: 'anyone'
                }
            });

            console.log(`✅ Created hosted RSVP form: ${fileName} (ID: ${file.data.id})`);
            
            // Use the direct Google Drive hosting URL
            const directUrl = `https://drive.google.com/uc?export=view&id=${file.data.id}`;
            
            return {
                fileId: file.data.id,
                fileName: fileName,
                webViewLink: file.data.webViewLink,
                directUrl: directUrl,
                inviteId: inviteId,
                eventId: eventData.id
            };

        } catch (error) {
            console.error('❌ Failed to create hosted RSVP form:', error);
            throw error;
        }
    }

    /**
     * Generate QR code that points to Google Drive hosted form
     */
    async generateQRCodeForHostedForm(eventData, inviteId) {
        try {
            // Create the hosted form
            const hostedForm = await this.createHostedRSVPForm(eventData, inviteId);
            
            // Generate QR code pointing to the hosted form
            const QRCode = require('qrcode');
            const qrCodeDataURL = await QRCode.toDataURL(hostedForm.directUrl, {
                type: 'png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 300
            });

            return {
                inviteId: inviteId,
                eventId: eventData.id,
                rsvpUrl: hostedForm.directUrl,
                qrCodeDataURL: qrCodeDataURL,
                hostingMethod: 'google-drive',
                fileId: hostedForm.fileId,
                fileName: hostedForm.fileName,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Failed to generate QR code for hosted form:', error);
            throw error;
        }
    }
}

module.exports = RSVPFormHostingService;
