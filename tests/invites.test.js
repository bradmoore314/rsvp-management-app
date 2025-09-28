const request = require('supertest');
const app = require('../server');
const { getDB } = require('../services/db');
const { v4: uuidv4 } = require('uuid');

describe('Invites API', () => {
    let testUser;
    let testEvent;
    let authToken;

    beforeEach(async () => {
        const db = await getDB();
        const userId = uuidv4();
        await db.run('INSERT INTO users (id, email, name) VALUES (?, ?, ?)', userId, 'test@example.com', 'Test User');
        testUser = { id: userId, email: 'test@example.com', name: 'Test User' };

        const eventId = uuidv4();
        await db.run(
            'INSERT INTO events (id, user_id, name, description) VALUES (?, ?, ?, ?)',
            eventId, userId, 'Test Event', 'Test Description'
        );
        testEvent = { id: eventId, userId, name: 'Test Event' };

        // Create auth token
        const jwt = require('jsonwebtoken');
        authToken = jwt.sign({ sub: testUser.id, email: testUser.email }, process.env.JWT_SECRET);
    });

    afterEach(async () => {
        const db = await getDB();
        await db.run('DELETE FROM rsvps; DELETE FROM invites; DELETE FROM events; DELETE FROM users;');
    });

    test('POST /invites/generate should create an invite', async () => {
        const response = await request(app)
            .post('/invites/generate')
            .set('Cookie', `session_token=${authToken}`)
            .send({ eventId: testEvent.id })
            .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('eventId', testEvent.id);
        expect(response.body).toHaveProperty('rsvpUrl');
        expect(response.body).toHaveProperty('qrCodeDataURL');
    });

    test('GET /invites/:inviteId should return invite data', async () => {
        // Create a test invite
        const db = await getDB();
        const inviteId = uuidv4();
        await db.run(
            'INSERT INTO invites (id, event_id, rsvp_url) VALUES (?, ?, ?)',
            inviteId, testEvent.id, 'https://example.com/rsvp'
        );

        const response = await request(app)
            .get(`/invites/${inviteId}`)
            .expect(200);

        expect(response.body).toMatchObject({
            id: inviteId,
            event_id: testEvent.id,
            rsvp_url: 'https://example.com/rsvp'
        });
    });

    test('POST /invites/generate should require authentication', async () => {
        const response = await request(app)
            .post('/invites/generate')
            .send({ eventId: testEvent.id })
            .expect(401);

        expect(response.body).toHaveProperty('error', 'Authentication required');
    });

    test('GET /invites/:inviteId should return 404 for non-existent invite', async () => {
        const nonExistentId = uuidv4();

        const response = await request(app)
            .get(`/invites/${nonExistentId}`)
            .expect(404);

        expect(response.body).toHaveProperty('error', 'Invite not found');
    });
});
