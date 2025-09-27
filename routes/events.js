const express = require('express');
const { eventService } = require('../services/sharedServices');
const router = express.Router();

/**
 * POST /events
 * Create a new event
 */
router.post('/', async (req, res) => {
    try {
        const eventData = req.body;

        // Validate event data
        const validation = eventService.validateEventData(eventData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                errors: validation.errors
            });
        }

        const event = await eventService.createEvent(eventData);
        
        res.json({
            success: true,
            data: event,
            message: 'Event created successfully'
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

// NOTE: Define fixed routes BEFORE parameterized routes like "/:eventId"
// to avoid path conflicts (e.g., "/events/reload" being treated as an ID)

/**
 * PUT /events/:eventId
 * Update an event
 */
router.put('/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const updateData = req.body;

        // Validate update data if it contains required fields
        if (updateData.name || updateData.date || updateData.time || updateData.location || updateData.hostName || updateData.hostEmail) {
            const validation = eventService.validateEventData(updateData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    errors: validation.errors
                });
            }
        }

        const updatedEvent = await eventService.updateEvent(eventId, updateData);
        
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
 * GET /events
 * Get all events (for debugging)
 */
router.get('/', async (req, res) => {
    try {
        console.log('🔍 DEBUG: /events endpoint called');
        
        // Ensure the service is initialized
        if (!eventService.isInitialized) {
            console.log('🔍 DEBUG: Event service not initialized, initializing now...');
            await eventService.initialize();
        }
        
        const events = await eventService.getAllEvents();
        
        console.log(`🔍 DEBUG: /events endpoint returning ${events.length} events`);
        
        res.json({
            success: true,
            data: events,
            count: events.length,
            message: `Found ${events.length} total events`
        });
    } catch (error) {
        console.error('Error getting all events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get all events',
            message: error.message
        });
    }
});

/**
 * GET /events/reload
 * Force re-initialize service and reload events from Google Drive
 */
router.get('/reload', async (req, res) => {
    try {
        console.log('🔄 DEBUG: /events/reload called - forcing re-initialize');
        await eventService.initialize();
        const events = await eventService.getAllEvents();
        console.log(`🔄 DEBUG: Reload complete, ${events.length} events in memory`);
        res.json({
            success: true,
            data: events,
            count: events.length,
            message: `Reloaded ${events.length} events from Google Drive`
        });
    } catch (error) {
        console.error('Error reloading events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reload events',
            message: error.message
        });
    }
});

/**
 * GET /events/host/:hostEmail
 * Get all events for a host
 */
router.get('/host/:hostEmail', async (req, res) => {
    try {
        const { hostEmail } = req.params;
        console.log(`🔍 DEBUG: /events/host/${hostEmail} endpoint called`);
        
        // Ensure the service is initialized
        if (!eventService.isInitialized) {
            console.log('🔍 DEBUG: Event service not initialized, initializing now...');
            await eventService.initialize();
        }
        
        const events = await eventService.getEventsByHost(hostEmail);
        
        console.log(`🔍 DEBUG: /events/host/${hostEmail} endpoint returning ${events.length} events`);
        
        res.json({
            success: true,
            data: events,
            count: events.length,
            message: `Found ${events.length} events for host`
        });
    } catch (error) {
        console.error('Error getting events for host:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get events for host',
            message: error.message
        });
    }
});

/**
 * GET /events/:eventId
 * Get event by ID
 */
router.get('/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await eventService.getEvent(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
                message: `No event found with ID: ${eventId}`
            });
        }

        res.json({
            success: true,
            data: event,
            message: 'Event retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get event',
            message: error.message
        });
    }
});

/**
 * GET /events/:eventId/stats
 * Get event statistics
 */
router.get('/:eventId/stats', async (req, res) => {
    try {
        const { eventId } = req.params;
        const stats = await eventService.getEventStats(eventId);

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
            message: 'Event statistics retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting event stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get event statistics',
            message: error.message
        });
    }
});

/**
 * POST /events/:eventId/validate
 * Validate event data
 */
router.post('/validate', async (req, res) => {
    try {
        const eventData = req.body;
        const validation = eventService.validateEventData(eventData);
        
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
