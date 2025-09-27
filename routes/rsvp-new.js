const express = require('express');
const router = express.Router();
const rsvpService = require('../services/rsvpService');

// Helper function to safely get form values
function getFormValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value : '';
}

// Generate RSVP form HTML
function generateRSVPForm(eventData, inviteId) {
    return `
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
                    margin-bottom: 20px;
                }
                
                .header h1 {
                    color: #2d3748;
                    margin-bottom: 8px;
                    font-size: 1.5rem;
                    font-weight: 600;
                    letter-spacing: -0.02em;
                }
                
                .header p {
                    color: #718096;
                    font-size: 0.9rem;
                }
                
                .event-card {
                    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                    border-radius: 16px;
                    padding: 16px;
                    margin-bottom: 20px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                }
                
                .event-title {
                    color: #2d3748;
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                
                .event-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: #4a5568;
                }
                
                .event-detail {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .form-section {
                    margin-bottom: 16px;
                }
                
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                
                .form-group {
                    margin-bottom: 12px;
                }
                
                .form-group.full-width {
                    grid-column: 1 / -1;
                }
                
                label {
                    display: block;
                    margin-bottom: 4px;
                    color: #4a5568;
                    font-weight: 500;
                    font-size: 0.85rem;
                }
                
                input, select, textarea {
                    width: 100%;
                    padding: 10px 12px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    background: #fff;
                    color: #2d3748;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }
                
                input:focus, select:focus, textarea:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                input::placeholder, textarea::placeholder {
                    color: #a0aec0;
                }
                
                .attendance-options {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 8px;
                    margin-top: 8px;
                }
                
                .attendance-option {
                    position: relative;
                }
                
                .attendance-option input[type="radio"] {
                    position: absolute;
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .attendance-option label {
                    display: block;
                    padding: 10px 8px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.8rem;
                    font-weight: 500;
                    margin: 0;
                }
                
                .attendance-option input[type="radio"]:checked + label {
                    border-color: #667eea;
                    background: #667eea;
                    color: white;
                }
                
                .btn {
                    width: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 14px 24px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 16px;
                    font-family: inherit;
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                }
                
                .btn:active {
                    transform: translateY(0);
                }
                
                .status-message {
                    margin-top: 16px;
                    padding: 12px 16px;
                    border-radius: 8px;
                    text-align: center;
                    display: none;
                    font-size: 0.9rem;
                }
                
                .status-message.success {
                    background: rgba(72, 187, 120, 0.1);
                    color: #2f855a;
                    border: 1px solid rgba(72, 187, 120, 0.2);
                }
                
                .status-message.error {
                    background: rgba(245, 101, 101, 0.1);
                    color: #c53030;
                    border: 1px solid rgba(245, 101, 101, 0.2);
                }
                
                .required {
                    color: #e53e3e;
                }
                
                @media (max-width: 480px) {
                    .container {
                        padding: 16px;
                        margin: 0;
                        border-radius: 0;
                    }
                    
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .event-details {
                        grid-template-columns: 1fr;
                    }
                    
                    .attendance-options {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>You're Invited! 🎉</h1>
                    <p>Please RSVP for this event</p>
                </div>
                
                <div class="event-card">
                    <div class="event-title">${eventData.name}</div>
                    <div class="event-details">
                        <div class="event-detail">
                            <span>📅</span>
                            <span>${eventData.date}</span>
                        </div>
                        <div class="event-detail">
                            <span>🕐</span>
                            <span>${eventData.time}</span>
                        </div>
                        <div class="event-detail">
                            <span>📍</span>
                            <span>${eventData.location}</span>
                        </div>
                        <div class="event-detail">
                            <span>👤</span>
                            <span>${eventData.hostName}</span>
                        </div>
                    </div>
                </div>
                
                <form id="rsvpForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="guestName">Full Name <span class="required">*</span></label>
                            <input type="text" id="guestName" name="guestName" required placeholder="Your full name">
                        </div>
                        
                        <div class="form-group">
                            <label for="guestEmail">Email <span class="required">*</span></label>
                            <input type="email" id="guestEmail" name="guestEmail" required placeholder="your@email.com">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="attendance">Will you be attending? <span class="required">*</span></label>
                        <div class="attendance-options">
                            <div class="attendance-option">
                                <input type="radio" id="attendance-yes" name="attendance" value="yes" required>
                                <label for="attendance-yes">Yes! 🎉</label>
                            </div>
                            <div class="attendance-option">
                                <input type="radio" id="attendance-no" name="attendance" value="no" required>
                                <label for="attendance-no">No 😔</label>
                            </div>
                            <div class="attendance-option">
                                <input type="radio" id="attendance-maybe" name="attendance" value="maybe" required>
                                <label for="attendance-maybe">Maybe</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="guestCount">Number of Guests</label>
                            <input type="number" id="guestCount" name="guestCount" min="1" max="10" value="1">
                        </div>
                        
                        <div class="form-group">
                            <label for="guestPhone">Phone (Optional)</label>
                            <input type="tel" id="guestPhone" name="guestPhone" placeholder="(555) 123-4567">
                        </div>
                    </div>
                    
                    ${eventData.displayOptions?.showDietaryRestrictions === true ? `
                    <div class="form-group">
                        <label for="dietaryRestrictions">Dietary Restrictions</label>
                        <textarea id="dietaryRestrictions" name="dietaryRestrictions" rows="2" placeholder="Any allergies or dietary needs?"></textarea>
                    </div>
                    ` : ''}
                    
                    <div class="form-group">
                        <label for="message">Message to Host (Optional)</label>
                        <textarea id="message" name="message" rows="2" placeholder="Any special message for the host..."></textarea>
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
                    
                    // Get form values safely
                    const guestName = getFormValue('guestName');
                    const guestEmail = getFormValue('guestEmail');
                    const attendance = getFormValue('attendance');
                    const guestCount = parseInt(getFormValue('guestCount')) || 1;
                    const guestPhone = getFormValue('guestPhone');
                    const dietaryRestrictions = getFormValue('dietaryRestrictions');
                    const message = getFormValue('message');
                    
                    // Client-side validation
                    if (!guestName || !guestEmail || !attendance) {
                        statusMessage.textContent = 'Please fill in all required fields.';
                        statusMessage.className = 'status-message error';
                        statusMessage.style.display = 'block';
                        return;
                    }
                    
                    // Disable submit button
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitting...';
                    
                    try {
                        const response = await fetch('/rsvp/submit', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                eventId: '${eventData.id}',
                                inviteId: '${inviteId}',
                                guestName: guestName,
                                guestEmail: guestEmail,
                                attendance: attendance,
                                guestCount: guestCount,
                                guestPhone: guestPhone,
                                dietaryRestrictions: dietaryRestrictions,
                                message: message,
                                ipAddress: '',
                                userAgent: navigator.userAgent
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            statusMessage.textContent = 'Thank you! Your RSVP has been submitted successfully.';
                            statusMessage.className = 'status-message success';
                            statusMessage.style.display = 'block';
                            
                            // Clear form
                            document.getElementById('rsvpForm').reset();
                        } else {
                            throw new Error(result.message || 'Failed to submit RSVP');
                        }
                    } catch (error) {
                        console.error('RSVP submission error:', error);
                        statusMessage.textContent = 'Sorry, there was an error submitting your RSVP. Please try again.';
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
}

// RSVP form route
router.get('/:eventId/:inviteId', async (req, res) => {
    try {
        const { eventId, inviteId } = req.params;
        
        // Get event data (simplified for demo)
        const eventData = {
            id: eventId,
            name: eventId === 'demo-event-123' ? 'Demo Birthday Party' : 'Sample Event',
            date: eventId === 'demo-event-123' ? 'December 25, 2024' : 'January 15, 2025',
            time: eventId === 'demo-event-123' ? '7:00 PM' : '6:00 PM',
            location: eventId === 'demo-event-123' ? '123 Party Street, Celebration City' : 'Sample Venue',
            hostName: eventId === 'demo-event-123' ? 'John & Jane Doe' : 'Event Host',
            description: eventId === 'demo-event-123' ? 'Join us for a fun birthday celebration!' : 'Sample event description',
            displayOptions: {
                showDietaryRestrictions: true
            }
        };
        
        const rsvpFormHTML = generateRSVPForm(eventData, inviteId);
        res.send(rsvpFormHTML);
    } catch (error) {
        console.error('Error generating RSVP form:', error);
        res.status(500).send('Error generating RSVP form');
    }
});

// RSVP submission route
router.post('/submit', async (req, res) => {
    try {
        console.log('🔍 DEBUG: RSVP submission received');
        console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
        
        const rsvpData = req.body;

        // Add request metadata
        rsvpData.ipAddress = req.ip || req.connection.remoteAddress;
        rsvpData.userAgent = req.get('User-Agent');

        console.log('🔍 DEBUG: Processing RSVP data:', JSON.stringify(rsvpData, null, 2));

        // Submit RSVP using the service
        const rsvpResponse = await rsvpService.submitRSVP(rsvpData);

        console.log('🔍 DEBUG: RSVP submission successful:', JSON.stringify(rsvpResponse, null, 2));

        res.json({
            success: true,
            message: 'RSVP submitted successfully',
            data: {
                id: rsvpResponse.id,
                eventId: rsvpResponse.eventId,
                inviteId: rsvpResponse.inviteId,
                submittedAt: rsvpResponse.submittedAt
            }
        });
    } catch (error) {
        console.error('🔍 DEBUG: RSVP submission error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit RSVP'
        });
    }
});

module.exports = router;
