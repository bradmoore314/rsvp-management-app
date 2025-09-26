const express = require('express');
const GoogleDriveService = require('../services/googleDrive');
const router = express.Router();

// Initialize Google Drive service
const googleDrive = new GoogleDriveService();

/**
 * Initialize Google Drive service on startup
 */
(async () => {
    await googleDrive.initialize();
    
    // Try to load saved tokens
    const savedTokens = await googleDrive.loadTokens();
    if (savedTokens) {
        await googleDrive.setCredentialsFromTokens(savedTokens);
    }
})();

/**
 * GET /auth/google
 * Redirect to Google OAuth consent screen
 */
router.get('/google', async (req, res) => {
    try {
        if (!googleDrive.initialized) {
            return res.status(500).json({
                error: 'Google Drive service not initialized',
                message: 'Please check your Google API credentials'
            });
        }

        const authUrl = googleDrive.getAuthUrl();
        res.json({
            authUrl: authUrl,
            message: 'Redirect user to this URL for Google authentication'
        });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({
            error: 'Failed to generate authentication URL',
            message: error.message
        });
    }
});

/**
 * GET /auth/google/callback
 * Handle OAuth callback and exchange code for tokens
 */
router.get('/google/callback', async (req, res) => {
    try {
        const { code, error } = req.query;

        if (error) {
            return res.status(400).json({
                error: 'OAuth error',
                message: error
            });
        }

        if (!code) {
            return res.status(400).json({
                error: 'Authorization code not provided'
            });
        }

        try {
            const tokens = await googleDrive.getTokens(code);
            
            // Redirect to host dashboard with success message
            res.redirect('/host-dashboard?auth=success');
        } catch (tokenError) {
            console.error('Token exchange failed:', tokenError);
            // If token exchange fails, still redirect but with error info
            res.redirect('/host-dashboard?auth=error&message=' + encodeURIComponent('Authentication completed but token exchange failed. You can still use the app in simplified mode.'));
        }
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: error.message
        });
    }
});

/**
 * GET /auth/status
 * Check authentication status
 */
router.get('/status', async (req, res) => {
    try {
        const isReady = googleDrive.isReady();
        
        res.json({
            authenticated: isReady,
            initialized: googleDrive.initialized,
            message: isReady ? 'Google Drive is ready' : 'Not authenticated'
        });
    } catch (error) {
        console.error('Error checking auth status:', error);
        res.status(500).json({
            error: 'Failed to check authentication status',
            message: error.message
        });
    }
});

/**
 * POST /auth/revoke
 * Revoke OAuth tokens
 */
router.post('/revoke', async (req, res) => {
    try {
        if (googleDrive.oauth2Client && googleDrive.oauth2Client.credentials) {
            await googleDrive.oauth2Client.revokeCredentials();
            console.log('✅ OAuth tokens revoked');
        }
        
        res.json({
            success: true,
            message: 'Authentication revoked successfully'
        });
    } catch (error) {
        console.error('Error revoking tokens:', error);
        res.status(500).json({
            error: 'Failed to revoke authentication',
            message: error.message
        });
    }
});

module.exports = router;




