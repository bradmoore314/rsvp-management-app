const express = require('express');
const router = express.Router();
const { getAuthUrl, handleCallback, verifySession } = require('../services/authService');
const { SESSION_COOKIE } = require('../middleware/authMiddleware');

router.get('/google', (_req, res) => {
    const url = getAuthUrl();
    res.json({ url });
});

router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({ error: 'Missing code' });
    }

    try {
        const { user, sessionToken } = await handleCallback(code);
        res.cookie(SESSION_COOKIE, sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7
        });
        res.redirect('/host.html');
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.status(204).send();
});

router.get('/me', async (req, res) => {
    const token = req.cookies[SESSION_COOKIE];
    const user = await verifySession(token);
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

module.exports = router;
