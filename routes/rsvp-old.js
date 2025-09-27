const express = require('express');
const { eventService, rsvpService, qrCodeService } = require('../services/sharedServices');
const router = express.Router();

/**
 * GET /rsvp/:eventId/:inviteId
 * Display RSVP form for a specific invite
 */
router.get('/:eventId/:inviteId', async (req, res) => {
    try {
        const { eventId, inviteId } = req.params;

        // Validate the invite ID format
        if (!eventId || !inviteId) {
            return res.status(400).send(`
                <html>
                    <head><title>Invalid Invite</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>❌ Invalid Invite</h1>
                        <p>The invite link is invalid or incomplete.</p>
                        <p>Please check the QR code and try again.</p>
                    </body>
                </html>
            `);
        }

        // Load event data
        const event = await eventService.getEvent(eventId);
        
        // If no event found, create a mock event for testing
        const eventData = event || {
            id: eventId,
            name: eventId === 'demo-event-123' ? 'Demo Birthday Party' : 'Sample Event',
            description: eventId === 'demo-event-123' 
                ? 'Join us for a fun birthday celebration with food, drinks, and great company! This is a demo event to showcase the RSVP functionality with image support.'
                : 'This is a sample event for testing purposes',
                date: eventId === 'demo-event-123' 
                    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
                    : new Date().toLocaleDateString(),
                time: '7:00 PM',
                endTime: eventId === 'demo-event-123' ? '11:00 PM' : null,
            location: eventId === 'demo-event-123' 
                ? '123 Party Street, Celebration City'
                : 'Sample Location',
            hostName: eventId === 'demo-event-123' ? 'Demo Host' : 'Sample Host',
            hostEmail: 'host@example.com',
            maxGuests: eventId === 'demo-event-123' ? 50 : null,
            rsvpDeadline: eventId === 'demo-event-123' 
                ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()
                : null,
            dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-Free', 'No Restrictions'],
            specialInstructions: eventId === 'demo-event-123'
                ? 'Please let us know about any dietary restrictions or allergies. We\'ll have a variety of food options available!'
                : 'Please let us know about any dietary restrictions or allergies.',
            
            // Enhanced configuration options
            displayOptions: {
                showDietaryRestrictions: true, // Default true for demo
                showDressCode: false,
                showHostMessage: false
            },
            dressCode: '',
            hostMessage: '',
            eventCategory: 'General',
            eventTags: [],
            
            // Event management
            status: 'active',
            reminderSettings: {
                enabled: false,
                daysBefore: 7
            },
            
            image: eventId === 'demo-event-123' ? {
                id: 'demo-image-123',
                filename: 'demo-birthday-party.jpg',
                originalName: 'birthday-party.jpg',
                size: 1024000,
                mimetype: 'image/jpeg',
                uploadedAt: new Date().toISOString(),
                driveFileId: null,
                driveUrl: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=500&h=300&fit=crop&crop=center'
            } : null
        };
        const rsvpFormHTML = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>RSVP - ${eventData.name}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: #333;
                        height: 100vh;
                        overflow: hidden;
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                    }
                    
                    .container {
                        max-width: 450px;
                        margin: 0 auto;
                        background: rgba(255, 255, 255, 0.95);
                        border-radius: 24px;
                        padding: 24px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(20px);
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 16px;
                    }
                    
                        .header h1 {
                            color: #6b5b95;
                            margin-bottom: 8px;
                            font-size: 1.8rem;
                            font-weight: 300;
                            letter-spacing: -0.01em;
                            text-shadow: 0 2px 4px rgba(107, 91, 149, 0.1);
                        }
                        
                        .header p {
                            color: #9a8bb5;
                            font-size: 0.95rem;
                        }
                    
                    .form-group {
                        margin-bottom: 16px;
                    }
                    
                        label {
                            display: block;
                            margin-bottom: 4px;
                            color: #6b5b95;
                            font-weight: 500;
                            font-size: 0.85rem;
                        }
                        
                        input, select, textarea {
                            width: 100%;
                            padding: 12px 16px;
                            border: 1px solid rgba(168, 216, 234, 0.3);
                            border-radius: 12px;
                            font-size: 0.95rem;
                            background: rgba(255, 255, 255, 0.8);
                            transition: all 0.2s ease;
                            font-family: inherit;
                            backdrop-filter: blur(10px);
                        }
                        
                        input:focus, select:focus, textarea:focus {
                            outline: none;
                            border-color: #a8d8ea;
                            box-shadow: 0 0 0 3px rgba(168, 216, 234, 0.2);
                            background: rgba(255, 255, 255, 0.9);
                        }
                    
                        .btn {
                            width: 100%;
                            padding: 14px 24px;
                            background: linear-gradient(135deg, #a8d8ea 0%, #c7b8e8 100%);
                            color: white;
                            border: none;
                            border-radius: 12px;
                            font-size: 0.95rem;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            box-shadow: 0 4px 16px rgba(168, 216, 234, 0.2);
                        }
                        
                        .btn:hover {
                            background: linear-gradient(135deg, #c7b8e8 0%, #a8d8ea 100%);
                            transform: translateY(-2px);
                            box-shadow: 0 8px 25px rgba(199, 184, 232, 0.3);
                        }
                        
                        .btn:disabled {
                            opacity: 0.6;
                            cursor: not-allowed;
                            transform: none;
                        }
                    
                        .status-message {
                            margin-top: 20px;
                            padding: 12px 16px;
                            border-radius: 12px;
                            text-align: center;
                            display: none;
                            font-size: 0.9rem;
                        }
                        
                        .status-message.success {
                            background: rgba(168, 216, 234, 0.2);
                            color: #4a7c7e;
                            border: 1px solid rgba(168, 216, 234, 0.3);
                        }
                        
                        .status-message.error {
                            background: rgba(255, 182, 193, 0.2);
                            color: #8b5a6b;
                            border: 1px solid rgba(255, 182, 193, 0.3);
                        }
                    
                        .event-info {
                            background: rgba(255, 255, 255, 0.6);
                            padding: 24px;
                            border-radius: 16px;
                            margin-bottom: 32px;
                            border: 1px solid rgba(255, 255, 255, 0.4);
                            backdrop-filter: blur(10px);
                        }
                        
                        .event-info h3 {
                            color: #6b5b95;
                            margin-bottom: 12px;
                            font-size: 1.2rem;
                            font-weight: 500;
                        }
                        
                        .event-info p {
                            color: #9a8bb5;
                            margin-bottom: 8px;
                            font-size: 0.9rem;
                            line-height: 1.5;
                        }
                        
                        .event-info p:last-child {
                            margin-bottom: 0;
                        }
                    
                        .required {
                            color: #ffb6c1;
                        }
                    
                    .dietary-options {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                        gap: 12px;
                        margin-top: 12px;
                    }
                    
                    .dietary-option {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .dietary-option input[type="checkbox"] {
                        width: auto;
                        margin: 0;
                    }
                    
                        .dietary-option label {
                            margin: 0;
                            font-weight: 400;
                            color: #9a8bb5;
                            font-size: 0.9rem;
                        }
                    
                    .event-image {
                        margin-bottom: 20px;
                    }
                    
                        .event-image img {
                            width: 100%;
                            max-height: 200px;
                            object-fit: cover;
                            border-radius: 12px;
                            box-shadow: 0 4px 16px rgba(139, 122, 168, 0.1);
                        }
                    
                    @media (max-width: 600px) {
                        .container {
                            padding: 24px;
                            margin: 10px;
                        }
                        
                        .dietary-options {
                            grid-template-columns: 1fr;
                        }
                        
                        .header h1 {
                            font-size: 1.5rem;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>You're Invited</h1>
                        <p>Please RSVP for this event</p>
                    </div>
                    
                <div class="event-info">
                    ${eventData.image ? `
                        <div class="event-image">
                            <img src="${eventData.image.driveUrl || `/images/${eventData.image.filename}`}" alt="${eventData.name}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 20px;">
                        </div>
                    ` : ''}
                        <h3>${eventData.name}</h3>
                        <p><strong>Date:</strong> ${eventData.date}</p>
                        <p><strong>Time:</strong> ${eventData.time}${eventData.endTime ? ` - ${eventData.endTime}` : ''}</p>
                        <p><strong>Location:</strong> ${eventData.location}</p>
                        <p><strong>Host:</strong> ${eventData.hostName}</p>
                    ${eventData.description ? `<p><strong>Description:</strong> ${eventData.description}</p>` : ''}
                    ${eventData.rsvpDeadline ? `<p><strong>RSVP Deadline:</strong> ${eventData.rsvpDeadline}</p>` : ''}
                    ${eventData.specialInstructions ? `<p><strong>Special Instructions:</strong> ${eventData.specialInstructions}</p>` : ''}
                    ${eventData.displayOptions?.showDressCode === true && eventData.dressCode ? `<p><strong>Dress Code:</strong> ${eventData.dressCode}</p>` : ''}
                    ${eventData.displayOptions?.showHostMessage === true && eventData.hostMessage ? `<p><strong>Host Message:</strong> ${eventData.hostMessage}</p>` : ''}
                </div>
                    
                    <form id="rsvpForm">
                        <div class="form-group">
                            <label for="guestName">Full Name *</label>
                            <input type="text" id="guestName" name="guestName" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="guestEmail">Email Address *</label>
                            <input type="email" id="guestEmail" name="guestEmail" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="guestPhone">Phone Number (Optional)</label>
                            <input type="tel" id="guestPhone" name="guestPhone" placeholder="(555) 123-4567">
                            <small>Helpful for last-minute updates or emergencies</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="emergencyContact">Emergency Contact (Optional)</label>
                            <input type="text" id="emergencyContact" name="emergencyContact" placeholder="Name and phone number">
                            <small>In case we need to reach someone if you can't attend</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="attendance">Will you be attending? *</label>
                            <select id="attendance" name="attendance" required>
                                <option value="">Please select...</option>
                                <option value="yes">Yes, I'll be there! 🎉</option>
                                <option value="no">Sorry, I can't make it 😔</option>
                                <option value="maybe">Maybe, I'll let you know</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="guestCount">Number of Guests (including yourself)</label>
                            <input type="number" id="guestCount" name="guestCount" min="1" max="10" value="1">
                        </div>
                        
                        ${eventData.displayOptions?.showDietaryRestrictions === true ? `
                        <div class="form-group">
                            <label for="dietaryRestrictions">Dietary Restrictions or Allergies</label>
                            ${eventData.dietaryOptions && eventData.dietaryOptions.length > 0 ? `
                                <div style="margin-bottom: 10px;">
                                    <p style="font-size: 14px; color: #718096; margin-bottom: 8px;">Available options:</p>
                                    ${eventData.dietaryOptions.map(option => `
                                        <label style="display: inline-block; margin-right: 15px; margin-bottom: 5px; font-weight: normal;">
                                            <input type="checkbox" name="dietaryOptions" value="${option}" style="margin-right: 5px;">
                                            ${option}
                                        </label>
                                    `).join('')}
                                </div>
                            ` : ''}
                            <textarea id="dietaryRestrictions" name="dietaryRestrictions" rows="3" placeholder="Please let us know about any dietary restrictions or allergies..."></textarea>
                        </div>
                        ` : ''}
                        
                        <div class="form-group">
                            <label for="message">Message to Host (Optional)</label>
                            <textarea id="message" name="message" rows="3" placeholder="Any special message for the host..."></textarea>
                        </div>
                        
                        <button type="submit" class="btn" id="submitBtn">Submit RSVP</button>
                    </form>
                    
                    <div id="statusMessage" class="status-message"></div>
                </div>
                
                <script>
                    document.getElementById('rsvpForm').addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        const submitBtn = document.getElementById('submitBtn');
                        const statusMessage = document.getElementById('statusMessage');
                        
                        // Disable submit button
                        submitBtn.disabled = true;
                        submitBtn.textContent = 'Submitting...';
                        
                        // Collect dietary options
                        const dietaryOptions = Array.from(document.querySelectorAll('input[name="dietaryOptions"]:checked'))
                            .map(checkbox => checkbox.value);
                        
                        // Helper function to safely get form element value
                        function getFormValue(elementId) {
                            const element = document.getElementById(elementId);
                            return element ? element.value : '';
                        }
                        
                        // Collect form data with null checks
                        const formData = {
                            eventId: '${eventId}',
                            inviteId: '${inviteId}',
                            guestName: getFormValue('guestName'),
                            guestEmail: getFormValue('guestEmail'),
                            guestPhone: getFormValue('guestPhone'),
                            emergencyContact: getFormValue('emergencyContact'),
                            attendance: getFormValue('attendance'),
                            guestCount: parseInt(getFormValue('guestCount')) || 1,
                            dietaryOptions: dietaryOptions,
                            dietaryRestrictions: getFormValue('dietaryRestrictions'),
                            message: getFormValue('message'),
                            timestamp: new Date().toISOString()
                        };
                        
                        // Validate required fields
                        if (!formData.guestName || !formData.guestEmail || !formData.attendance) {
                            statusMessage.textContent = '❌ Please fill in all required fields (Name, Email, and Attendance).';
                            statusMessage.className = 'status-message error';
                            statusMessage.style.display = 'block';
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Submit RSVP';
                            return;
                        }
                        
                        try {
                            const response = await fetch('/api/rsvp/submit', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(formData)
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                statusMessage.textContent = '✅ RSVP submitted successfully! Thank you for responding.';
                                statusMessage.className = 'status-message success';
                                statusMessage.style.display = 'block';
                                
                                // Clear form
                                document.getElementById('rsvpForm').reset();
                            } else {
                                throw new Error(result.message || 'Failed to submit RSVP');
                            }
                        } catch (error) {
                            statusMessage.textContent = '❌ Error: ' + error.message;
                            statusMessage.className = 'status-message error';
                            statusMessage.style.display = 'block';
                        } finally {
                            // Re-enable submit button
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Submit RSVP';
                        }
                    });
                </script>
            </body>
            </html>
        `;

        res.send(rsvpFormHTML);
    } catch (error) {
        console.error('Error displaying RSVP form:', error);
        res.status(500).send(`
            <html>
                <head><title>Error</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>❌ Error</h1>
                    <p>Sorry, there was an error loading the RSVP form.</p>
                    <p>Please try again later.</p>
                </body>
            </html>
        `);
    }
});

/**
 * POST /rsvp/submit
 * Handle RSVP form submission
 */
router.post('/submit', async (req, res) => {
    try {
        console.log('🔍 DEBUG: RSVP submission received');
        console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
        
        const rsvpData = req.body;

        // Add request metadata
        rsvpData.ipAddress = req.ip || req.connection.remoteAddress;
        rsvpData.userAgent = req.get('User-Agent');

        console.log('🔍 DEBUG: RSVP data with metadata:', JSON.stringify(rsvpData, null, 2));

        // Submit RSVP using the service
        console.log('🔍 DEBUG: Calling rsvpService.submitRSVP...');
        const rsvpResponse = await rsvpService.submitRSVP(rsvpData);
        console.log('🔍 DEBUG: RSVP service response:', JSON.stringify(rsvpResponse, null, 2));

        const response = {
            success: true,
            message: 'RSVP submitted successfully',
            data: {
                id: rsvpResponse.id,
                eventId: rsvpResponse.eventId,
                inviteId: rsvpResponse.inviteId,
                submittedAt: rsvpResponse.submittedAt
            }
        };

        console.log('🔍 DEBUG: Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit RSVP',
            message: error.message
        });
    }
});

module.exports = router;
