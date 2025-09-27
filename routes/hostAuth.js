const express = require('express');
const HostAuthService = require('../services/hostAuthService');
const router = express.Router();

// Initialize Host Auth service
const hostAuthService = new HostAuthService();

// Export the service instance so other routes can use it
module.exports.hostAuthService = hostAuthService;

/**
 * Initialize Host Auth service on startup
 */
(async () => {
    await hostAuthService.initialize();
})();

/**
 * GET /host-auth/login
 * Convenience endpoint to start Google OAuth by redirecting to auth URL
 */
router.get('/login', async (req, res) => {
    try {
        const authUrl = hostAuthService.getGoogleAuthUrl();
        if (!authUrl) {
            return res.status(500).send('Google OAuth not configured');
        }
        return res.redirect(authUrl);
    } catch (error) {
        console.error('Error starting host login:', error);
        return res.status(500).send('Failed to start login');
    }
});

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

        // Add host info to request
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
 * GET /host-auth/google-url
 * Get Google OAuth URL for host authentication
 */
router.get('/google-url', async (req, res) => {
    try {
        const authUrl = hostAuthService.getGoogleAuthUrl();
        
        res.json({
            success: true,
            data: {
                authUrl: authUrl
            },
            message: 'Google OAuth URL generated successfully'
        });
    } catch (error) {
        console.error('Error generating Google auth URL:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate Google auth URL',
            message: error.message
        });
    }
});

/**
 * POST /host-auth/google-callback
 * Handle Google OAuth callback and authenticate host
 */
router.post('/google-callback', async (req, res) => {
    try {
        const { code, userInfo } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code required',
                message: 'Please provide the authorization code from Google'
            });
        }

        if (!userInfo || !userInfo.email) {
            return res.status(400).json({
                success: false,
                error: 'User information required',
                message: 'Please provide user information from Google'
            });
        }

        // Exchange code for tokens
        const tokens = await hostAuthService.exchangeGoogleCode(code);
        
        // Authenticate host
        const authResult = await hostAuthService.authenticateHost(tokens, userInfo);
        
        res.json({
            success: true,
            data: {
                sessionId: authResult.session.id,
                host: {
                    id: authResult.host.id,
                    email: authResult.host.email,
                    name: authResult.host.name,
                    picture: authResult.host.picture
                },
                expires: authResult.session.expires
            },
            message: 'Host authenticated successfully'
        });
    } catch (error) {
        console.error('Error in Google OAuth callback:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
            message: error.message
        });
    }
});

/**
 * GET /host-auth/validate
 * Validate host session
 */
router.get('/validate', requireHostAuth, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                host: {
                    id: req.host.id,
                    email: req.host.email,
                    name: req.host.name,
                    picture: req.host.picture,
                    lastLogin: req.host.lastLogin
                },
                session: {
                    id: req.session.id,
                    expires: req.session.expires
                }
            },
            message: 'Session is valid'
        });
    } catch (error) {
        console.error('Error validating session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate session',
            message: error.message
        });
    }
});

/**
 * POST /host-auth/logout
 * Logout host
 */
router.post('/logout', requireHostAuth, async (req, res) => {
    try {
        const sessionId = req.session.id;
        await hostAuthService.logoutHost(sessionId);
        
        res.json({
            success: true,
            message: 'Host logged out successfully'
        });
    } catch (error) {
        console.error('Error logging out host:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to logout',
            message: error.message
        });
    }
});

/**
 * GET /host-auth/profile
 * Get host profile
 */
router.get('/profile', requireHostAuth, async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.host,
            message: 'Host profile retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting host profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get host profile',
            message: error.message
        });
    }
});

/**
 * PUT /host-auth/profile
 * Update host profile
 */
router.put('/profile', requireHostAuth, async (req, res) => {
    try {
        const updateData = req.body;
        
        // Validate update data
        const validation = hostAuthService.validateHostData(updateData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                errors: validation.errors
            });
        }

        const updatedHost = await hostAuthService.updateHostProfile(req.host.email, updateData);
        
        res.json({
            success: true,
            data: updatedHost,
            message: 'Host profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating host profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update host profile',
            message: error.message
        });
    }
});

/**
 * GET /host-auth/sessions
 * Get active sessions (admin only)
 */
router.get('/sessions', requireHostAuth, async (req, res) => {
    try {
        const sessions = await hostAuthService.getActiveSessions();
        
        res.json({
            success: true,
            data: sessions,
            count: sessions.length,
            message: 'Active sessions retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting active sessions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get active sessions',
            message: error.message
        });
    }
});

/**
 * GET /host-auth/hosts
 * Get all hosts (admin only)
 */
router.get('/hosts', requireHostAuth, async (req, res) => {
    try {
        const hosts = await hostAuthService.getAllHosts();
        
        res.json({
            success: true,
            data: hosts,
            count: hosts.length,
            message: 'All hosts retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting all hosts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get all hosts',
            message: error.message
        });
    }
});

/**
 * POST /host-auth/validate-profile
 * Validate host profile data
 */
router.post('/validate-profile', async (req, res) => {
    try {
        const hostData = req.body;
        const validation = hostAuthService.validateHostData(hostData);
        
        res.json({
            success: true,
            validation: validation,
            message: validation.isValid ? 'Host data is valid' : 'Host data validation failed'
        });
    } catch (error) {
        console.error('Error validating host data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate host data',
            message: error.message
        });
    }
});

module.exports = router;
module.exports.hostAuthService = hostAuthService;
