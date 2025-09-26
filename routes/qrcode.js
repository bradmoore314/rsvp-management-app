const express = require('express');
const { qrCodeService, eventService } = require('../services/sharedServices');
const RSVPFormHostingService = require('../services/rsvpFormHosting');
const router = express.Router();

// Initialize services
const rsvpFormHosting = new RSVPFormHostingService();

/**
 * POST /qrcode/generate
 * Generate a single QR code
 */
router.post('/generate', async (req, res) => {
    try {
        const { eventId, inviteId, baseUrl, useGoogleDrive } = req.body;

        if (!eventId) {
            return res.status(400).json({
                error: 'Event ID is required'
            });
        }

        const finalInviteId = inviteId || qrCodeService.generateInviteId();
        
        if (useGoogleDrive) {
            // Get event data for Google Drive hosting
            const eventData = await eventService.getEvent(eventId);
            if (!eventData) {
                return res.status(404).json({
                    error: 'Event not found'
                });
            }
            
            // Generate QR code with Google Drive hosting
            const qrCodeData = await rsvpFormHosting.generateQRCodeForHostedForm(eventData, finalInviteId);
            
            res.json({
                success: true,
                data: qrCodeData,
                message: 'QR code generated successfully with Google Drive hosting'
            });
        } else {
            // Generate traditional QR code
            const qrCodeData = await qrCodeService.generateQRCodeDataURL(finalInviteId, eventId, baseUrl);
            
            res.json({
                success: true,
                data: qrCodeData,
                message: 'QR code generated successfully'
            });
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({
            error: 'Failed to generate QR code',
            message: error.message
        });
    }
});

/**
 * POST /qrcode/generate-file
 * Generate QR code and save as file
 */
router.post('/generate-file', async (req, res) => {
    try {
        const { eventId, inviteId, baseUrl } = req.body;

        if (!eventId) {
            return res.status(400).json({
                error: 'Event ID is required'
            });
        }

        const finalInviteId = inviteId || qrCodeService.generateInviteId();
        const qrCodeFile = await qrCodeService.generateQRCodeFile(finalInviteId, eventId, null, baseUrl);
        
        res.json({
            success: true,
            data: qrCodeFile,
            message: 'QR code file generated successfully'
        });
    } catch (error) {
        console.error('Error generating QR code file:', error);
        res.status(500).json({
            error: 'Failed to generate QR code file',
            message: error.message
        });
    }
});

/**
 * POST /qrcode/generate-batch
 * Generate multiple QR codes for an event
 */
router.post('/generate-batch', async (req, res) => {
    try {
        const { eventId, inviteCount = 1, baseUrl, useGoogleDrive } = req.body;

        if (!eventId) {
            return res.status(400).json({
                error: 'Event ID is required'
            });
        }

        if (inviteCount < 1 || inviteCount > 100) {
            return res.status(400).json({
                error: 'Invite count must be between 1 and 100'
            });
        }

        if (useGoogleDrive) {
            // Get event data for Google Drive hosting
            const eventData = await eventService.getEvent(eventId);
            if (!eventData) {
                return res.status(404).json({
                    error: 'Event not found'
                });
            }
            
            // Generate batch QR codes with Google Drive hosting
            const invites = [];
            for (let i = 0; i < inviteCount; i++) {
                const inviteId = qrCodeService.generateInviteId();
                const qrCodeData = await rsvpFormHosting.generateQRCodeForHostedForm(eventData, inviteId);
                invites.push(qrCodeData);
            }
            
            res.json({
                success: true,
                data: {
                    eventId: eventId,
                    invites: invites,
                    count: invites.length,
                    hostingMethod: 'google-drive'
                },
                message: `Generated ${inviteCount} QR codes with Google Drive hosting successfully`
            });
        } else {
            // Generate traditional batch QR codes
            const batchData = await qrCodeService.generateEventQRCodes(eventId, inviteCount, baseUrl);
            
            res.json({
                success: true,
                data: batchData,
                message: `Generated ${inviteCount} QR codes successfully`
            });
        }
    } catch (error) {
        console.error('Error generating batch QR codes:', error);
        res.status(500).json({
            error: 'Failed to generate batch QR codes',
            message: error.message
        });
    }
});

/**
 * POST /qrcode/generate-batch-files
 * Generate multiple QR code files for an event
 */
router.post('/generate-batch-files', async (req, res) => {
    try {
        const { eventId, inviteCount = 1, baseUrl } = req.body;

        if (!eventId) {
            return res.status(400).json({
                error: 'Event ID is required'
            });
        }

        if (inviteCount < 1 || inviteCount > 100) {
            return res.status(400).json({
                error: 'Invite count must be between 1 and 100'
            });
        }

        const batchData = await qrCodeService.generateEventQRCodeFiles(eventId, inviteCount, baseUrl);
        
        res.json({
            success: true,
            data: batchData,
            message: `Generated ${inviteCount} QR code files successfully`
        });
    } catch (error) {
        console.error('Error generating batch QR code files:', error);
        res.status(500).json({
            error: 'Failed to generate batch QR code files',
            message: error.message
        });
    }
});

/**
 * POST /qrcode/create-invite
 * Create a printable invite with QR code
 */
router.post('/create-invite', async (req, res) => {
    try {
        const { eventData, inviteId, baseUrl } = req.body;

        if (!eventData || !eventData.id) {
            return res.status(400).json({
                error: 'Event data with ID is required'
            });
        }

        const finalInviteId = inviteId || qrCodeService.generateInviteId();
        const inviteData = await qrCodeService.createPrintableInvite(eventData, finalInviteId, baseUrl);
        
        res.json({
            success: true,
            data: inviteData,
            message: 'Printable invite created successfully'
        });
    } catch (error) {
        console.error('Error creating printable invite:', error);
        res.status(500).json({
            error: 'Failed to create printable invite',
            message: error.message
        });
    }
});

/**
 * POST /qrcode/validate-url
 * Validate QR code URL format
 */
router.post('/validate-url', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'URL is required'
            });
        }

        const validation = qrCodeService.validateQRCodeURL(url);
        
        res.json({
            success: true,
            validation: validation,
            message: validation.isValid ? 'URL is valid' : 'URL is invalid'
        });
    } catch (error) {
        console.error('Error validating URL:', error);
        res.status(500).json({
            error: 'Failed to validate URL',
            message: error.message
        });
    }
});

/**
 * GET /qrcode/options
 * Get current QR code options
 */
router.get('/options', (req, res) => {
    try {
        const options = qrCodeService.getQROptions();
        
        res.json({
            success: true,
            options: options,
            message: 'QR code options retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting QR code options:', error);
        res.status(500).json({
            error: 'Failed to get QR code options',
            message: error.message
        });
    }
});

/**
 * PUT /qrcode/options
 * Update QR code options
 */
router.put('/options', (req, res) => {
    try {
        const { options } = req.body;

        if (!options) {
            return res.status(400).json({
                error: 'Options are required'
            });
        }

        qrCodeService.setQROptions(options);
        
        res.json({
            success: true,
            message: 'QR code options updated successfully'
        });
    } catch (error) {
        console.error('Error updating QR code options:', error);
        res.status(500).json({
            error: 'Failed to update QR code options',
            message: error.message
        });
    }
});

module.exports = router;




