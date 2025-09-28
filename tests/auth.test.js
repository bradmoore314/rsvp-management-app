const request = require('supertest');
const app = require('../server');
const { getDB } = require('../services/db');
const { v4: uuidv4 } = require('uuid');

describe('Authentication', () => {
    let testUser;

    beforeEach(async () => {
        const db = await getDB();
        const userId = uuidv4();
        await db.run('INSERT INTO users (id, email, name) VALUES (?, ?, ?)', userId, 'test@example.com', 'Test User');
        testUser = { id: userId, email: 'test@example.com', name: 'Test User' };
    });

    afterEach(async () => {
        const db = await getDB();
        await db.run('DELETE FROM users');
    });

    test('GET /auth/google should return auth URL', async () => {
        const response = await request(app)
            .get('/auth/google')
            .expect(200);

        expect(response.body).toHaveProperty('url');
        expect(response.body.url).toContain('accounts.google.com');
    });

    test('GET /auth/me should return user when authenticated', async () => {
        // Mock a valid session token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ sub: testUser.id, email: testUser.email }, process.env.JWT_SECRET);

        const response = await request(app)
            .get('/auth/me')
            .set('Cookie', `session_token=${token}`)
            .expect(200);

        expect(response.body.user).toMatchObject({
            id: testUser.id,
            email: testUser.email,
            name: testUser.name
        });
    });

    test('GET /auth/me should return 401 when not authenticated', async () => {
        const response = await request(app)
            .get('/auth/me')
            .expect(401);

        expect(response.body).toHaveProperty('error', 'Not authenticated');
    });

    test('POST /auth/logout should clear session cookie', async () => {
        const response = await request(app)
            .post('/auth/logout')
            .expect(204);

        expect(response.headers['set-cookie']).toBeDefined();
        expect(response.headers['set-cookie'][0]).toContain('session_token=;');
    });
});
