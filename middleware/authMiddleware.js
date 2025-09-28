const cookieParser = require('cookie-parser');
const { verifySession } = require('../services/authService');

const SESSION_COOKIE = 'session_token';

function withCookies(app) {
    app.use(cookieParser());
}

async function requireAuth(req, res, next) {
    const token = req.cookies[SESSION_COOKIE];
    const user = await verifySession(token);
    if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    req.user = user;
    next();
}

module.exports = {
    withCookies,
    requireAuth,
    SESSION_COOKIE
};
