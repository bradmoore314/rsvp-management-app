const request = require('supertest');
const app = require('../server');
const { getDB } = require('../services/db');
const { v4: uuidv4 } = require('uuid');

describe('Events API', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
        const db = await getDB();
        const userId = uuidv4();
        await db.run('INSERT INTO users (id, email, name) VALUES (?, ?, ?)', userId, 'test@example.com', 'Test User');
        testUser = { id: userId, email: 'test@example.com', name: 'Test User' };

        // Create auth token
        const jwt = require('jsonwebtoken');
        authToken = jwt.sign({ sub: testUser.id, email: testUser.email }, process.env.JWT_SECRET);
    });

    afterEach(async () => {
        const db = await getDB();
        await db.run('DELETE FROM rsvps; DELETE FROM invites; DELETE FROM events; DELETE FROM users;');
    });

    test('POST /events should create a new event', async () => {
        const eventData = {
            name: 'Test Event',
            description: 'A test event',
            date: '2025-12-25',
            time: '18:00',
            location: 'Test Location',
            hostName: 'Test Host',
            hostEmail: 'host@example.com'
        };

        const response = await request(app)
            .post('/events')
            .set('Cookie', `session_token=${authToken}`)
            .send(eventData)
            .expect(201);

        expect(response.body).toMatchObject({
            name: eventData.name,
            description: eventData.description,
            date: eventData.date,
            time: eventData.time,
            location: eventData.location,
            host_name: eventData.hostName,
            host_email: eventData.hostEmail
        });
    });

    test('GET /events should return user events', async () => {
        // Create a test event
        const db = await getDB();
        const eventId = uuidv4();
        await db.run(
            'INSERT INTO events (id, user_id, name, description) VALUES (?, ?, ?, ?)',
            eventId, testUser.id, 'Test Event', 'Test Description'
        );

        const response = await request(app)
            .get('/events')
            .set('Cookie', `session_token=${authToken}`)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({
            id: eventId,
            name: 'Test Event',
            description: 'Test Description'
        });
    });

    test('GET /events/:eventId should return public event data', async () => {
        // Create a test event
        const db = await getDB();
        const eventId = uuidv4();
        await db.run(
            'INSERT INTO events (id, user_id, name, description) VALUES (?, ?, ?, ?)',
            eventId, testUser.id, 'Test Event', 'Test Description'
        );

        const response = await request(app)
            .get(`/events/${eventId}`)
            .expect(200);

        expect(response.body).toMatchObject({
            id: eventId,
            name: 'Test Event',
            description: 'Test Description'
        });
    });

    test('DELETE /events/:eventId should delete user event', async () => {
        // Create a test event
        const db = await getDB();
        const eventId = uuidv4();
        await db.run(
            'INSERT INTO events (id, user_id, name, description) VALUES (?, ?, ?, ?)',
            eventId, testUser.id, 'Test Event', 'Test Description'
        );

        const response = await request(app)
            .delete(`/events/${eventId}`)
            .set('Cookie', `session_token=${authToken}`)
            .expect(204);

        // Verify event is deleted
        const event = await db.get('SELECT * FROM events WHERE id = ?', eventId);
        expect(event).toBeUndefined();
    });

    test('POST /events should require authentication', async () => {
        const eventData = { name: 'Test Event' };

        const response = await request(app)
            .post('/events')
            .send(eventData)
            .expect(401);

        expect(response.body).toHaveProperty('error', 'Authentication required');
    });
});
