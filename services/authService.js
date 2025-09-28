const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { getDB } = require('./db');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-secret';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

const oauthClient = new OAuth2Client({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI
});

async function createOrUpdateUser(profile) {
    const db = await getDB();
    const existing = await db.get('SELECT * FROM users WHERE email = ?', profile.email);

    if (existing) {
        await db.run('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', profile.name || existing.name, existing.id);
        return existing;
    }

    const id = uuidv4();
    await db.run('INSERT INTO users (id, email, name) VALUES (?, ?, ?)', id, profile.email, profile.name || null);
    return { id, email: profile.email, name: profile.name || null };
}

function createSessionToken(user) {
    return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: SESSION_EXPIRY_SECONDS });
}

async function verifySession(token) {
    if (!token) return null;
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const db = await getDB();
        return db.get('SELECT * FROM users WHERE id = ?', payload.sub);
    } catch (error) {
        return null;
    }
}

function getAuthUrl() {
    return oauthClient.generateAuthUrl({
        scope: ['openid', 'profile', 'email'],
        access_type: 'offline',
        prompt: 'consent'
    });
}

async function handleCallback(code) {
    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    const ticket = await oauthClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email_verified) {
        throw new Error('Email not verified');
    }

    const user = await createOrUpdateUser({ email: payload.email, name: payload.name });
    const sessionToken = createSessionToken(user);

    return { user, sessionToken };
}

module.exports = {
    getAuthUrl,
    handleCallback,
    verifySession
};
