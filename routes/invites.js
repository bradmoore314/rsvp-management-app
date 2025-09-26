const express = require('express');
const InviteService = require('../services/inviteService');
const router = express.Router();

// Initialize Invite service
const inviteService = new InviteService();

/**
 * Initialize Invite service on startup
 */
(async () => {
    await inviteService.initialize();
})();

/**
 * POST /invites/generate
 * Generate a single invite for an event
 */
router.post('/generate', async (req, res) => {
    try {
        const { eventId, inviteData } = req.body;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                error: 'Event ID is required'
            });
        }

        // Validate invite data if provided
        if (inviteData) {
            const validation = inviteService.validateInviteData(inviteData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    errors: validation.errors
                });
            }
        }

        const result = await inviteService.generateInvite(eventId, inviteData);
        
        res.json({
            success: true,
            data: result,
            message: 'Invite generated successfully'
        });
    } catch (error) {
        console.error('Error generating invite:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate invite',
            message: error.message
        });
    }
});

/**
 * POST /invites/generate-batch
 * Generate multiple invites for an event
 */
router.post('/generate-batch', async (req, res) => {
    try {
        const { eventId, inviteCount, inviteData } = req.body;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                error: 'Event ID is required'
            });
        }

        if (!inviteCount || inviteCount < 1 || inviteCount > 100) {
            return res.status(400).json({
                success: false,
                error: 'Invite count must be between 1 and 100'
            });
        }

        // Validate invite data if provided
        if (inviteData) {
            const validation = inviteService.validateInviteData(inviteData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    errors: validation.errors
                });
            }
        }

        const result = await inviteService.generateBatchInvites(eventId, inviteCount, inviteData);
        
        res.json({
            success: true,
            data: result,
            message: `Generated ${inviteCount} invites successfully`
        });
    } catch (error) {
        console.error('Error generating batch invites:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate batch invites',
            message: error.message
        });
    }
});

/**
 * POST /invites/generate-personalized
 * Generate invites with guest information
 */
router.post('/generate-personalized', async (req, res) => {
    try {
        const { eventId, guestList } = req.body;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                error: 'Event ID is required'
            });
        }

        if (!guestList || !Array.isArray(guestList) || guestList.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Guest list is required and must be a non-empty array'
            });
        }

        if (guestList.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Guest list cannot exceed 100 guests'
            });
        }

        // Validate each guest's data
        for (const guest of guestList) {
            if (guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid email address: ${guest.email}`
                });
            }
        }

        const result = await inviteService.generateInvitesWithGuests(eventId, guestList);
        
        res.json({
            success: true,
            data: result,
            message: `Generated ${guestList.length} personalized invites successfully`
        });
    } catch (error) {
        console.error('Error generating personalized invites:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate personalized invites',
            message: error.message
        });
    }
});

/**
 * GET /invites/:inviteId
 * Get invite by ID
 */
router.get('/:inviteId', async (req, res) => {
    try {
        const { inviteId } = req.params;
        const invite = await inviteService.getInvite(inviteId);

        if (!invite) {
            return res.status(404).json({
                success: false,
                error: 'Invite not found',
                message: `No invite found with ID: ${inviteId}`
            });
        }

        res.json({
            success: true,
            data: invite,
            message: 'Invite retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting invite:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get invite',
            message: error.message
        });
    }
});

/**
 * GET /invites/event/:eventId
 * Get all invites for an event
 */
router.get('/event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const invites = await inviteService.getInvitesForEvent(eventId);
        
        res.json({
            success: true,
            data: invites,
            count: invites.length,
            message: `Found ${invites.length} invites for event`
        });
    } catch (error) {
        console.error('Error getting invites for event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get invites for event',
            message: error.message
        });
    }
});

/**
 * PUT /invites/:inviteId
 * Update an invite
 */
router.put('/:inviteId', async (req, res) => {
    try {
        const { inviteId } = req.params;
        const updateData = req.body;

        // Validate update data
        const validation = inviteService.validateInviteData(updateData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                errors: validation.errors
            });
        }

        const updatedInvite = await inviteService.updateInvite(inviteId, updateData);
        
        res.json({
            success: true,
            data: updatedInvite,
            message: 'Invite updated successfully'
        });
    } catch (error) {
        console.error('Error updating invite:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update invite',
            message: error.message
        });
    }
});

/**
 * DELETE /invites/:inviteId
 * Deactivate an invite
 */
router.delete('/:inviteId', async (req, res) => {
    try {
        const { inviteId } = req.params;
        const deactivatedInvite = await inviteService.deactivateInvite(inviteId);
        
        res.json({
            success: true,
            data: deactivatedInvite,
            message: 'Invite deactivated successfully'
        });
    } catch (error) {
        console.error('Error deactivating invite:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to deactivate invite',
            message: error.message
        });
    }
});

/**
 * GET /invites/stats/:eventId
 * Get invite statistics for an event
 */
router.get('/stats/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const stats = await inviteService.getInviteStats(eventId);

        if (!stats) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
                message: `No event found with ID: ${eventId}`
            });
        }

        res.json({
            success: true,
            data: stats,
            message: 'Invite statistics retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting invite stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get invite statistics',
            message: error.message
        });
    }
});

/**
 * GET /invites/:inviteId/printable
 * Create printable invite
 */
router.get('/:inviteId/printable', async (req, res) => {
    try {
        const { inviteId } = req.params;
        const printableInvite = await inviteService.createPrintableInvite(inviteId);
        
        res.json({
            success: true,
            data: printableInvite,
            message: 'Printable invite created successfully'
        });
    } catch (error) {
        console.error('Error creating printable invite:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create printable invite',
            message: error.message
        });
    }
});

/**
 * POST /invites/generate-files
 * Generate QR code files for printing
 */
router.post('/generate-files', async (req, res) => {
    try {
        const { eventId, inviteIds } = req.body;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                error: 'Event ID is required'
            });
        }

        const result = await inviteService.generateQRCodeFiles(eventId, inviteIds);
        
        res.json({
            success: true,
            data: result,
            message: `Generated ${result.fileCount} QR code files successfully`
        });
    } catch (error) {
        console.error('Error generating QR code files:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate QR code files',
            message: error.message
        });
    }
});

module.exports = router;




