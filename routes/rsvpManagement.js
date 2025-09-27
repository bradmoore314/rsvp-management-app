const express = require('express');
const { rsvpService } = require('../services/sharedServices');
const router = express.Router();

/**
 * POST /rsvp-management/submit
 * Submit an RSVP response
 */
router.post('/submit', async (req, res) => {
    try {
        const rsvpData = req.body;

        // Add request metadata
        rsvpData.ipAddress = req.ip || req.connection.remoteAddress;
        rsvpData.userAgent = req.get('User-Agent');

        const rsvpResponse = await rsvpService.submitRSVP(rsvpData);
        
        res.json({
            success: true,
            data: rsvpResponse,
            message: 'RSVP submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit RSVP',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-management/event/:eventId
 * Get all RSVP responses for an event
 */
router.get('/event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const responses = await rsvpService.getRSVPResponses(eventId);
        
        res.json({
            success: true,
            data: responses,
            count: responses.length,
            message: `Found ${responses.length} RSVP responses`
        });
    } catch (error) {
        console.error('Error getting RSVP responses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get RSVP responses',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-management/responses/:eventId
 * Get all RSVP responses for an event (alternative endpoint)
 */
router.get('/responses/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const responses = await rsvpService.getRSVPResponses(eventId);
        
        res.json({
            success: true,
            data: responses,
            count: responses.length,
            message: `Found ${responses.length} RSVP responses`
        });
    } catch (error) {
        console.error('Error getting RSVP responses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get RSVP responses',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-management/response/:rsvpId
 * Get a specific RSVP response
 */
router.get('/response/:rsvpId', async (req, res) => {
    try {
        const { rsvpId } = req.params;
        const response = await rsvpService.getRSVPResponse(rsvpId);

        if (!response) {
            return res.status(404).json({
                success: false,
                error: 'RSVP response not found',
                message: `No RSVP response found with ID: ${rsvpId}`
            });
        }

        res.json({
            success: true,
            data: response,
            message: 'RSVP response retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting RSVP response:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get RSVP response',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-management/stats/:eventId
 * Get RSVP statistics for an event
 */
router.get('/stats/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const stats = await rsvpService.getRSVPStats(eventId);

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
            message: 'RSVP statistics retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting RSVP stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get RSVP statistics',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-management/export/:eventId
 * Export RSVP data for an event
 */
router.get('/export/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { format = 'json' } = req.query;

        if (!['json', 'csv'].includes(format)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid format',
                message: 'Format must be either json or csv'
            });
        }

        const exportData = await rsvpService.exportRSVPData(eventId, format);
        
        // Set appropriate headers for download
        const filename = `rsvp-data-${eventId}-${new Date().toISOString().split('T')[0]}.${format}`;
        const contentType = format === 'csv' ? 'text/csv' : 'application/json';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(exportData);
    } catch (error) {
        console.error('Error exporting RSVP data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export RSVP data',
            message: error.message
        });
    }
});

/**
 * POST /rsvp-management/validate
 * Validate RSVP data
 */
router.post('/validate', async (req, res) => {
    try {
        const rsvpData = req.body;
        const validation = rsvpService.validateRSVPData(rsvpData);
        
        res.json({
            success: true,
            validation: validation,
            message: validation.isValid ? 'RSVP data is valid' : 'RSVP data validation failed'
        });
    } catch (error) {
        console.error('Error validating RSVP data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate RSVP data',
            message: error.message
        });
    }
});

module.exports = router;




