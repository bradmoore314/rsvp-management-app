const express = require('express');
const router = express.Router();
const AIInvitationService = require('../services/aiInvitationService');
const AnimationService = require('../services/animationService');
const { sharedEventService, sharedInviteService } = require('../services/sharedServices');
const { requireAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for photo uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/images/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'invitation-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Initialize services
const aiInvitationService = new AIInvitationService();
const animationService = new AnimationService();
const GeminiService = require('../services/geminiService');
const geminiService = new GeminiService();

// Test Gemini AI connection
router.get('/test-gemini', async (req, res) => {
    try {
        const result = await geminiService.testConnection();
        res.json(result);
    } catch (error) {
        console.error('Error testing Gemini:', error);
        res.status(500).json({ success: false, error: 'Failed to test Gemini connection' });
    }
});

// Get available themes and animations
router.get('/themes', (req, res) => {
    try {
        const themes = aiInvitationService.getAvailableThemes();
        res.json({ success: true, themes });
    } catch (error) {
        console.error('Error fetching themes:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch themes' });
    }
});

router.get('/animations', (req, res) => {
    try {
        const animations = animationService.getAvailableAnimations();
        res.json({ success: true, animations });
    } catch (error) {
        console.error('Error fetching animations:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch animations' });
    }
});

// Generate theme variations
router.get('/themes/:themeId/variations', (req, res) => {
    try {
        const { themeId } = req.params;
        const variations = aiInvitationService.generateThemeVariations(themeId, 3);
        res.json({ success: true, variations });
    } catch (error) {
        console.error('Error generating theme variations:', error);
        res.status(500).json({ success: false, error: 'Failed to generate theme variations' });
    }
});

// Generate content suggestions
router.post('/suggestions', async (req, res) => {
    try {
        const { eventType, eventName } = req.body;
        const suggestions = await aiInvitationService.generateContentSuggestions(eventType, eventName);
        res.json({ success: true, suggestions });
    } catch (error) {
        console.error('Error generating suggestions:', error);
        res.status(500).json({ success: false, error: 'Failed to generate suggestions' });
    }
});

// Generate AI invitation
router.post('/generate', upload.array('photos', 5), async (req, res) => {
    try {
        const {
            eventType,
            eventName,
            eventDate,
            eventTime,
            eventLocation,
            hostName,
            customPrompt,
            theme,
            animationType
        } = req.body;

        // Handle uploaded photos
        const userPhotos = req.files ? req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        })) : [];

        // Generate invitation data
        const invitationData = await aiInvitationService.generateInvitation({
            eventType,
            eventName,
            eventDate,
            eventTime,
            eventLocation,
            hostName,
            customPrompt,
            userPhotos,
            theme
        });

        // Add animation configuration
        invitationData.animation = {
            type: animationType || 'cardOpen',
            config: animationService.animations[animationType] || animationService.animations.cardOpen
        };

        res.json({ 
            success: true, 
            invitation: invitationData,
            message: 'Invitation generated successfully!'
        });

    } catch (error) {
        console.error('Error generating invitation:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate invitation',
            details: error.message 
        });
    }
});

// Create event and generate invites from AI invitation
router.post('/create-event', requireAuth, async (req, res) => {
    try {
        const {
            eventName,
            eventDate,
            eventTime,
            eventLocation,
            hostName,
            hostEmail,
            description,
            invitationData,
            inviteCount = 1
        } = req.body;

        // Create the event in the database
        const event = await sharedEventService.createEvent(req.user.id, {
            name: eventName,
            date: eventDate,
            time: eventTime,
            location: eventLocation,
            hostName: hostName,
            hostEmail: hostEmail,
            description: description,
            imageUrl: invitationData.imageUrl || null
        });

        // Generate invites with QR codes
        const invites = [];
        for (let i = 0; i < inviteCount; i++) {
            const invite = await sharedInviteService.createInvite(req.user.id, event.id, process.env.APP_URL);
            invites.push(invite);
        }

        res.json({
            success: true,
            event: event,
            invites: invites,
            invitationData: invitationData,
            message: 'Event created and invites generated successfully!'
        });

    } catch (error) {
        console.error('Error creating event from invitation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create event from invitation',
            details: error.message
        });
    }
});

// Preview invitation with animation
router.post('/preview', async (req, res) => {
    try {
        const { invitationData, animationType } = req.body;
        
        // Generate preview HTML with animation
        const previewHTML = generatePreviewHTML(invitationData, animationType);
        
        res.json({ 
            success: true, 
            preview: previewHTML,
            message: 'Preview generated successfully!'
        });

    } catch (error) {
        console.error('Error generating preview:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate preview',
            details: error.message 
        });
    }
});

// Generate print-ready invitation
router.post('/print', async (req, res) => {
    try {
        const { invitationData, printOptions } = req.body;
        
        // Generate print-optimized HTML
        const printHTML = generatePrintHTML(invitationData, printOptions);
        
        res.json({ 
            success: true, 
            printHTML: printHTML,
            message: 'Print-ready invitation generated!'
        });

    } catch (error) {
        console.error('Error generating print version:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate print version',
            details: error.message 
        });
    }
});

// Generate matching RSVP page
router.post('/rsvp-page', async (req, res) => {
    try {
        const { invitationData, rsvpUrl } = req.body;
        
        // Generate matching RSVP page HTML
        const rsvpHTML = generateRSVPPageHTML(invitationData, rsvpUrl);
        
        res.json({ 
            success: true, 
            rsvpHTML: rsvpHTML,
            message: 'Matching RSVP page generated!'
        });

    } catch (error) {
        console.error('Error generating RSVP page:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate RSVP page',
            details: error.message 
        });
    }
});

// Helper function to generate preview HTML
function generatePreviewHTML(invitationData, animationType) {
    const theme = invitationData.theme;
    const colors = theme.colors;
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation Preview</title>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%);
                    font-family: '${theme.fonts[0]}', sans-serif;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .preview-container {
                    position: relative;
                    width: 100%;
                    max-width: 800px;
                    height: 600px;
                }
                .invitation-card {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    overflow: hidden;
                    transform-style: preserve-3d;
                }
                .invitation-content {
                    padding: 40px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }
                .invitation-title {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: ${colors[0]};
                    margin-bottom: 20px;
                }
                .invitation-details {
                    font-size: 1.2rem;
                    color: #333;
                    margin-bottom: 10px;
                }
                .invitation-host {
                    font-size: 1rem;
                    color: #666;
                    margin-top: 30px;
                }
                .qr-placeholder {
                    width: 100px;
                    height: 100px;
                    background: #f0f0f0;
                    border: 2px dashed #ccc;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 20px;
                    font-size: 0.8rem;
                    color: #999;
                }
            </style>
        </head>
        <body>
            <div class="preview-container">
                <div class="invitation-card" id="invitationCard">
                    <div class="invitation-content">
                        <h1 class="invitation-title">${invitationData.content.title}</h1>
                        <p class="invitation-details">${invitationData.content.date}</p>
                        <p class="invitation-details">${invitationData.content.time}</p>
                        <p class="invitation-details">${invitationData.content.location}</p>
                        <p class="invitation-host">Hosted by ${invitationData.content.host}</p>
                        <div class="qr-placeholder">QR Code</div>
                    </div>
                </div>
            </div>
            
            <script>
                // Initialize animation based on type
                const card = document.getElementById('invitationCard');
                
                // Set initial state
                gsap.set(card, { scale: 0, rotationY: 180, opacity: 0 });
                
                // Animate based on type
                if ('${animationType}' === 'cardOpen') {
                    gsap.to(card, {
                        duration: 1.2,
                        scale: 1,
                        rotationY: 0,
                        opacity: 1,
                        ease: "back.out(1.7)"
                    });
                } else if ('${animationType}' === 'reveal') {
                    gsap.to(card, {
                        duration: 1.5,
                        scale: 1,
                        opacity: 1,
                        ease: "power2.out"
                    });
                } else {
                    gsap.to(card, {
                        duration: 1,
                        scale: 1,
                        opacity: 1,
                        ease: "power2.out"
                    });
                }
            </script>
        </body>
        </html>
    `;
}

// Helper function to generate print HTML
function generatePrintHTML(invitationData, printOptions) {
    const theme = invitationData.theme;
    const colors = theme.colors;
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Print Invitation</title>
            <style>
                @media print {
                    @page {
                        margin: 0.5in;
                        size: A4;
                    }
                    body {
                        font-family: '${theme.fonts[0]}', serif;
                        font-size: 12pt;
                        line-height: 1.4;
                        color: #000;
                        background: white;
                    }
                    .invitation-front, .invitation-back {
                        width: 100%;
                        height: 100vh;
                        page-break-after: always;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        text-align: center;
                    }
                    .invitation-front {
                        background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%);
                        color: white;
                    }
                    .invitation-back {
                        background: white;
                        color: #333;
                    }
                    .invitation-title {
                        font-size: 2.5rem;
                        font-weight: bold;
                        margin-bottom: 20px;
                    }
                    .invitation-details {
                        font-size: 1.2rem;
                        margin-bottom: 10px;
                    }
                    .qr-code {
                        width: 150px;
                        height: 150px;
                        border: 2px solid #000;
                        margin-top: 30px;
                    }
                }
                @media screen {
                    body {
                        font-family: '${theme.fonts[0]}', sans-serif;
                        margin: 20px;
                        background: #f5f5f5;
                    }
                    .invitation-front, .invitation-back {
                        width: 210mm;
                        height: 297mm;
                        margin: 20px auto;
                        border: 1px solid #ccc;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    }
                    .invitation-front {
                        background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%);
                        color: white;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        text-align: center;
                    }
                    .invitation-back {
                        background: white;
                        color: #333;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        text-align: center;
                    }
                    .invitation-title {
                        font-size: 2.5rem;
                        font-weight: bold;
                        margin-bottom: 20px;
                    }
                    .invitation-details {
                        font-size: 1.2rem;
                        margin-bottom: 10px;
                    }
                    .qr-code {
                        width: 150px;
                        height: 150px;
                        border: 2px solid #000;
                        margin-top: 30px;
                    }
                    .print-button {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        z-index: 1000;
                    }
                }
            </style>
        </head>
        <body>
            <button class="print-button" onclick="window.print()">Print Invitation</button>
            
            <!-- Front of invitation -->
            <div class="invitation-front">
                <h1 class="invitation-title">${invitationData.content.title}</h1>
                <p class="invitation-details">${invitationData.content.date}</p>
                <p class="invitation-details">${invitationData.content.time}</p>
                <p class="invitation-details">${invitationData.content.location}</p>
                <p class="invitation-details">Hosted by ${invitationData.content.host}</p>
            </div>
            
            <!-- Back of invitation -->
            <div class="invitation-back">
                <h2>Event Details</h2>
                <p class="invitation-details">${invitationData.content.date} at ${invitationData.content.time}</p>
                <p class="invitation-details">${invitationData.content.location}</p>
                
                <h3>RSVP</h3>
                <p>${invitationData.content.rsvpMessage}</p>
                <div class="qr-code">
                    <!-- QR Code will be inserted here -->
                </div>
                
                <p><strong>Contact:</strong> ${invitationData.content.host}</p>
            </div>
            
            <script>
                // Auto-print when window loads
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `;
}

// Helper function to generate RSVP page HTML
function generateRSVPPageHTML(invitationData, rsvpUrl) {
    const theme = invitationData.theme;
    const colors = theme.colors;
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RSVP - ${invitationData.content.title}</title>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%);
                    font-family: '${theme.fonts[0]}', sans-serif;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .rsvp-container {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    padding: 40px;
                    max-width: 500px;
                    width: 90%;
                    transform: scale(0);
                    opacity: 0;
                }
                .rsvp-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .rsvp-title {
                    font-size: 2rem;
                    color: ${colors[0]};
                    margin-bottom: 10px;
                }
                .rsvp-subtitle {
                    color: #666;
                    font-size: 1.1rem;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #333;
                }
                .form-group input, .form-group select, .form-group textarea {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.3s;
                }
                .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
                    outline: none;
                    border-color: ${colors[0]};
                }
                .submit-btn {
                    width: 100%;
                    background: ${colors[0]};
                    color: white;
                    border: none;
                    padding: 15px;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .submit-btn:hover {
                    background: ${colors[1]};
                }
            </style>
        </head>
        <body>
            <div class="rsvp-container" id="rsvpContainer">
                <div class="rsvp-header">
                    <h1 class="rsvp-title">RSVP</h1>
                    <p class="rsvp-subtitle">${invitationData.content.title}</p>
                    <p class="rsvp-subtitle">${invitationData.content.date} • ${invitationData.content.time}</p>
                </div>
                
                <form id="rsvpForm">
                    <div class="form-group">
                        <label for="name">Full Name *</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email *</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="attendance">Will you attend? *</label>
                        <select id="attendance" name="attendance" required>
                            <option value="">Please select</option>
                            <option value="yes">Yes, I'll be there!</option>
                            <option value="no">Sorry, I can't make it</option>
                            <option value="maybe">Maybe</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="guests">Number of guests</label>
                        <input type="number" id="guests" name="guests" min="0" max="10" value="0">
                    </div>
                    
                    <div class="form-group">
                        <label for="dietary">Dietary restrictions or comments</label>
                        <textarea id="dietary" name="dietary" rows="3" placeholder="Any allergies, dietary restrictions, or special requests?"></textarea>
                    </div>
                    
                    <button type="submit" class="submit-btn">Submit RSVP</button>
                </form>
            </div>
            
            <script>
                // Animate RSVP form entrance
                gsap.to('#rsvpContainer', {
                    duration: 1,
                    scale: 1,
                    opacity: 1,
                    ease: "back.out(1.7)"
                });
                
                // Handle form submission
                document.getElementById('rsvpForm').addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const formData = new FormData(this);
                    const data = Object.fromEntries(formData);
                    
                    // Here you would send the data to your RSVP endpoint
                    console.log('RSVP Data:', data);
                    
                    // Show success message
                    alert('Thank you for your RSVP!');
                });
            </script>
        </body>
        </html>
    `;
}

module.exports = router;
