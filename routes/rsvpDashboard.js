const express = require('express');
const RSVPDashboardService = require('../services/rsvpDashboardService');
const HostAuthService = require('../services/hostAuthService');
const router = express.Router();

// Initialize services
const rsvpDashboardService = new RSVPDashboardService();
const hostAuthService = new HostAuthService();

/**
 * Initialize services on startup
 */
(async () => {
    await rsvpDashboardService.initialize();
    await hostAuthService.initialize();
})();

/**
 * Middleware to validate host session
 */
const requireHostAuth = async (req, res, next) => {
    try {
        const sessionId = req.headers['x-session-id'] || req.query.sessionId;
        
        if (!sessionId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'Please provide a valid session ID'
            });
        }

        const validation = await hostAuthService.validateSession(sessionId);
        
        if (!validation.isValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid session',
                message: validation.reason
            });
        }

        req.host = validation.host;
        req.session = validation.session;
        next();
    } catch (error) {
        console.error('Error in host auth middleware:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication error',
            message: error.message
        });
    }
};

/**
 * GET /rsvp-dashboard/event/:eventId
 * Get comprehensive RSVP dashboard data for an event
 */
router.get('/event/:eventId', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const dashboardData = await rsvpDashboardService.getRSVPDashboardData(eventId, req.host.email);
        
        res.json({
            success: true,
            data: dashboardData,
            message: 'RSVP dashboard data retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting RSVP dashboard data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get RSVP dashboard data',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-dashboard/host-analytics
 * Get RSVP analytics for all host events
 */
router.get('/host-analytics', requireHostAuth, async (req, res) => {
    try {
        const analytics = await rsvpDashboardService.getHostRSVPAnalytics(req.host.email);
        
        res.json({
            success: true,
            data: analytics,
            count: analytics.length,
            message: `Retrieved analytics for ${analytics.length} events`
        });
    } catch (error) {
        console.error('Error getting host RSVP analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get host RSVP analytics',
            message: error.message
        });
    }
});

/**
 * POST /rsvp-dashboard/event/:eventId/filter
 * Filter and search RSVP responses
 */
router.post('/event/:eventId/filter', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const filters = req.body;

        const result = await rsvpDashboardService.filterRSVPResponses(eventId, filters, req.host.email);
        
        res.json({
            success: true,
            data: result,
            message: `Filtered ${result.totalCount} responses from ${result.originalCount} total`
        });
    } catch (error) {
        console.error('Error filtering RSVP responses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to filter RSVP responses',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-dashboard/event/:eventId/export
 * Export RSVP data with advanced formatting
 */
router.get('/event/:eventId/export', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { format = 'csv', ...options } = req.query;

        if (!['csv', 'json', 'excel'].includes(format)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid format',
                message: 'Format must be csv, json, or excel'
            });
        }

        const exportData = await rsvpDashboardService.exportRSVPData(
            eventId, 
            format, 
            options, 
            req.host.email
        );
        
        // Set appropriate headers for download
        const filename = `rsvp-dashboard-${eventId}-${new Date().toISOString().split('T')[0]}.${format}`;
        const contentType = format === 'csv' ? 'text/csv' : 
                           format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                           'application/json';
        
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
 * GET /rsvp-dashboard/event/:eventId/analytics
 * Get detailed RSVP analytics for an event
 */
router.get('/event/:eventId/analytics', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const dashboardData = await rsvpDashboardService.getRSVPDashboardData(eventId, req.host.email);
        
        res.json({
            success: true,
            data: {
                analytics: dashboardData.analytics,
                trends: dashboardData.trends,
                dietaryAnalysis: dashboardData.dietaryAnalysis,
                guestAnalysis: dashboardData.guestAnalysis,
                timeline: dashboardData.timeline
            },
            message: 'RSVP analytics retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting RSVP analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get RSVP analytics',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-dashboard/event/:eventId/trends
 * Get response trends over time
 */
router.get('/event/:eventId/trends', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const dashboardData = await rsvpDashboardService.getRSVPDashboardData(eventId, req.host.email);
        
        res.json({
            success: true,
            data: {
                trends: dashboardData.trends,
                timeline: dashboardData.timeline
            },
            message: 'Response trends retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting response trends:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get response trends',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-dashboard/event/:eventId/dietary-analysis
 * Get dietary preferences analysis
 */
router.get('/event/:eventId/dietary-analysis', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const dashboardData = await rsvpDashboardService.getRSVPDashboardData(eventId, req.host.email);
        
        res.json({
            success: true,
            data: dashboardData.dietaryAnalysis,
            message: 'Dietary analysis retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting dietary analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dietary analysis',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-dashboard/event/:eventId/guest-analysis
 * Get guest count analysis
 */
router.get('/event/:eventId/guest-analysis', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const dashboardData = await rsvpDashboardService.getRSVPDashboardData(eventId, req.host.email);
        
        res.json({
            success: true,
            data: dashboardData.guestAnalysis,
            message: 'Guest analysis retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting guest analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get guest analysis',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-dashboard/event/:eventId/timeline
 * Get response timeline analysis
 */
router.get('/event/:eventId/timeline', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const dashboardData = await rsvpDashboardService.getRSVPDashboardData(eventId, req.host.email);
        
        res.json({
            success: true,
            data: dashboardData.timeline,
            message: 'Response timeline retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting response timeline:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get response timeline',
            message: error.message
        });
    }
});

/**
 * GET /rsvp-dashboard/event/:eventId/summary
 * Get RSVP summary statistics
 */
router.get('/event/:eventId/summary', requireHostAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const dashboardData = await rsvpDashboardService.getRSVPDashboardData(eventId, req.host.email);
        
        res.json({
            success: true,
            data: {
                summary: dashboardData.summary,
                event: dashboardData.event
            },
            message: 'RSVP summary retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting RSVP summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get RSVP summary',
            message: error.message
        });
    }
});

/**
 * POST /rsvp-dashboard/validate-filters
 * Validate filter parameters
 */
router.post('/validate-filters', requireHostAuth, async (req, res) => {
    try {
        const filters = req.body;
        const errors = [];

        // Validate attendance filter
        if (filters.attendance && !['all', 'yes', 'no', 'maybe'].includes(filters.attendance)) {
            errors.push('Invalid attendance filter value');
        }

        // Validate guest count range
        if (filters.guestCount) {
            if (filters.guestCount.min && (filters.guestCount.min < 1 || filters.guestCount.min > 100)) {
                errors.push('Guest count minimum must be between 1 and 100');
            }
            if (filters.guestCount.max && (filters.guestCount.max < 1 || filters.guestCount.max > 100)) {
                errors.push('Guest count maximum must be between 1 and 100');
            }
            if (filters.guestCount.min && filters.guestCount.max && filters.guestCount.min > filters.guestCount.max) {
                errors.push('Guest count minimum cannot be greater than maximum');
            }
        }

        // Validate date range
        if (filters.dateRange) {
            if (filters.dateRange.start && filters.dateRange.end) {
                const startDate = new Date(filters.dateRange.start);
                const endDate = new Date(filters.dateRange.end);
                
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    errors.push('Invalid date format');
                } else if (startDate > endDate) {
                    errors.push('Start date cannot be after end date');
                }
            }
        }

        // Validate sort options
        if (filters.sortBy && !['name', 'email', 'attendance', 'guestCount', 'submittedAt'].includes(filters.sortBy)) {
            errors.push('Invalid sort option');
        }

        res.json({
            success: true,
            validation: {
                isValid: errors.length === 0,
                errors: errors
            },
            message: errors.length === 0 ? 'Filters are valid' : 'Filter validation failed'
        });
    } catch (error) {
        console.error('Error validating filters:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate filters',
            message: error.message
        });
    }
});

module.exports = router;




