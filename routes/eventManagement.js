const express = require('express');
const EventManagementService = require('../services/eventManagementService');
const HostAuthService = require('../services/hostAuthService');
const ImageService = require('../services/imageService');
const router = express.Router();

// Initialize services
const eventManagementService = new EventManagementService();
const imageService = new ImageService();

// Import the same hostAuthService instance from hostAuth route
const hostAuthRoutes = require('./hostAuth');
const hostAuthService = hostAuthRoutes.hostAuthService;

/**
 * Initialize services on startup
 */
(async () => {
    await eventManagementService.initialize();
    await hostAuthService.initialize();
    await imageService.initialize();
})();

/**
 * Middleware to validate host session
 */
const requireHostAuth = async (req, res, next) => {
    try {
        const sessionId = req.headers['x-session-id'] || req.query.sessionId;
        console.log('🔐 Host auth middleware - Session ID:', sessionId ? 'Present' : 'Missing');
        
        if (!sessionId) {
            console.log('❌ No session ID provided');
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'Please provide a valid session ID'
            });
        }

        const validation = await hostAuthService.validateSession(sessionId);
        console.log('🔐 Session validation result:', validation.isValid ? 'Valid' : 'Invalid');
        
        if (!validation.isValid) {
            console.log('❌ Session validation failed:', validation.reason);
            return res.status(401).json({
                success: false,
                error: 'Invalid session',
                message: validation.reason
            });
        }

        req.host = validation.host;
        req.session = validation.session;
        console.log('✅ Host authenticated:', req.host.email);
        console.log('🔍 Full host object:', JSON.stringify(req.host, null, 2));
        next();
    } catch (error) {
        console.error('❌ Error in host auth middleware:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication error',
            message: error.message
        });
    }
};

/**
 * POST /event-management/create
 * Create event with comprehensive setup (simplified - no auth required)
 */
router.post('/create', imageService.getUploadMiddleware(), async (req, res) => {
    try {
        console.log('📝 Creating event (simplified mode)');
        console.log('📝 Event data received:', {
            name: req.body.name,
            date: req.body.date,
            time: req.body.time,
            location: req.body.location,
            hasImage: !!req.file
        });

        // Handle image upload if present
        let imageInfo = null;
        if (req.file) {
            console.log('📝 Processing image upload:', req.file.originalname);
            // Validate image
            const imageValidation = imageService.validateImage(req.file);
            if (!imageValidation.isValid) {
                console.log('❌ Image validation failed:', imageValidation.errors);
                return res.status(400).json({
                    success: false,
                    error: 'Image validation failed',
                    errors: imageValidation.errors
                });
            }

            // Upload image
            imageInfo = await imageService.uploadImage(req.file);
            console.log('✅ Image uploaded successfully:', imageInfo.filename);
        }

        // Parse event data from form fields with defaults
        const eventData = {
            name: req.body.name || 'Untitled Event',
            description: req.body.description || '',
            date: req.body.date || new Date().toISOString().split('T')[0],
            time: req.body.time || '19:00',
            endTime: req.body.endTime || null,
            location: req.body.location || 'TBD',
            maxGuests: req.body.maxGuests ? parseInt(req.body.maxGuests) : null,
            rsvpDeadline: req.body.rsvpDeadline || null,
            dietaryOptions: req.body.dietaryOptions ? JSON.parse(req.body.dietaryOptions) : ['No Restrictions'],
            specialInstructions: req.body.specialInstructions || '',
            hostName: req.body.hostName || 'Event Host',
            hostEmail: req.body.hostEmail || 'host@example.com',
            initialInviteCount: parseInt(req.body.initialInviteCount) || 0,
            image: imageInfo
        };

        // Create event with setup (simplified - no strict validation)
        const result = await eventManagementService.createEventWithSetup(eventData, eventData.hostEmail);
        
        res.json({
            success: true,
            data: result,
            message: 'Event created successfully with setup'
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create event',
            message: error.message
        });
    }
});

/**
 * GET /event-management/events
 * Get all events for host with summary data
 */
router.get('/events', requireHostAuth, async (req, res) => {
    try {
        const events = await eventManagementService.getHostEventsSummary(req.host.email);
        
        res.json({
            success: true,
            data: events,
            count: events.length,
            message: `Found ${events.length} events for host`
        });
    } catch (error) {
        console.error('Error getting host events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get host events',
            message: error.message
        });
    }
});

/**
 * GET /event-management/event/:eventId
 * Get comprehensive event details
 */
router.get('/event/:eventId', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const eventDetails = await eventManagementService.getEventDetails(eventId);

        if (!eventDetails) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
                message: `No event found with ID: ${eventId}`
            });
        }

        // Verify the event belongs to the host
        if (eventDetails.event.hostEmail !== req.host.email) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized',
                message: 'You do not have permission to access this event'
            });
        }

        res.json({
            success: true,
            data: eventDetails,
            message: 'Event details retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting event details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get event details',
            message: error.message
        });
    }
});

/**
 * PUT /event-management/event/:eventId
 * Update event with validation
 */
router.put('/event/:eventId', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const updateData = req.body;

        const updatedEvent = await eventManagementService.updateEventWithValidation(
            eventId, 
            updateData, 
            req.host.email
        );
        
        res.json({
            success: true,
            data: updatedEvent,
            message: 'Event updated successfully'
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update event',
            message: error.message
        });
    }
});

/**
 * DELETE /event-management/event/:eventId
 * Delete event (soft delete)
 */
router.delete('/event/:eventId', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const deletedEvent = await eventManagementService.deleteEvent(eventId, req.host.email);
        
        res.json({
            success: true,
            data: deletedEvent,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete event',
            message: error.message
        });
    }
});

/**
 * POST /event-management/event/:eventId/invites
 * Generate invites for event
 */
router.post('/event/:eventId/invites', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const inviteOptions = req.body;

        const result = await eventManagementService.generateEventInvites(
            eventId, 
            inviteOptions, 
            req.host.email
        );
        
        res.json({
            success: true,
            data: result,
            message: 'Invites generated successfully'
        });
    } catch (error) {
        console.error('Error generating invites:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate invites',
            message: error.message
        });
    }
});

/**
 * GET /event-management/event/:eventId/analytics
 * Get event analytics and insights
 */
router.get('/event/:eventId/analytics', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const analytics = await eventManagementService.getEventAnalytics(eventId, req.host.email);
        
        res.json({
            success: true,
            data: analytics,
            message: 'Event analytics retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting event analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get event analytics',
            message: error.message
        });
    }
});

/**
 * GET /event-management/event/:eventId/export
 * Export event data
 */
router.get('/event/:eventId/export', requireHostAuth, async (req, res) => {
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

        const exportData = await eventManagementService.exportEventData(
            eventId, 
            format, 
            req.host.email
        );
        
        // Set appropriate headers for download
        const filename = `event-${eventId}-${new Date().toISOString().split('T')[0]}.${format}`;
        const contentType = format === 'csv' ? 'text/csv' : 'application/json';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(exportData);
    } catch (error) {
        console.error('Error exporting event data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export event data',
            message: error.message
        });
    }
});

/**
 * GET /event-management/dashboard
 * Get dashboard data for host
 */
router.get('/dashboard', requireHostAuth, async (req, res) => {
    try {
        const events = await eventManagementService.getHostEventsSummary(req.host.email);
        
        // Calculate dashboard statistics
        const dashboardStats = {
            totalEvents: events.length,
            activeEvents: events.filter(e => e.status === 'active').length,
            totalInvites: events.reduce((sum, e) => sum + e.summary.totalInvites, 0),
            totalResponses: events.reduce((sum, e) => sum + e.summary.totalResponses, 0),
            totalAttending: events.reduce((sum, e) => sum + e.summary.attending, 0),
            totalGuests: events.reduce((sum, e) => sum + e.summary.totalGuests, 0)
        };

        // Get recent activity (recent events)
        const recentEvents = events
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                stats: dashboardStats,
                recentEvents: recentEvents,
                host: req.host
            },
            message: 'Dashboard data retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dashboard data',
            message: error.message
        });
    }
});

/**
 * POST /event-management/validate-event
 * Validate event data
 */
router.post('/validate-event', requireHostAuth, async (req, res) => {
    try {
        const eventData = req.body;
        const validation = eventManagementService.eventService.validateEventData(eventData);
        
        res.json({
            success: true,
            validation: validation,
            message: validation.isValid ? 'Event data is valid' : 'Event data validation failed'
        });
    } catch (error) {
        console.error('Error validating event data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate event data',
            message: error.message
        });
    }
});

module.exports = router;
