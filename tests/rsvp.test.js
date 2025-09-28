const request = require('supertest');
const app = require('../server');
const { getDB } = require('../services/db');
const { v4: uuidv4 } = require('uuid');

describe('RSVP API', () => {
    let testUser;
    let testEvent;
    let testInvite;
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

        const inviteId = uuidv4();
        await db.run(
            'INSERT INTO invites (id, event_id, rsvp_url) VALUES (?, ?, ?)',
            inviteId, eventId, 'https://example.com/rsvp'
        );
        testInvite = { id: inviteId, eventId, rsvpUrl: 'https://example.com/rsvp' };

        // Create auth token
        const jwt = require('jsonwebtoken');
        authToken = jwt.sign({ sub: testUser.id, email: testUser.email }, process.env.JWT_SECRET);
    });

    afterEach(async () => {
        const db = await getDB();
        await db.run('DELETE FROM rsvps; DELETE FROM invites; DELETE FROM events; DELETE FROM users;');
    });

    test('POST /rsvp/submit should submit RSVP', async () => {
        const rsvpData = {
            eventId: testEvent.id,
            inviteId: testInvite.id,
            guestName: 'John Doe',
            guestEmail: 'john@example.com',
            attendance: 'yes',
            guestCount: 2,
            message: 'Looking forward to it!'
        };

        const response = await request(app)
            .post('/rsvp/submit')
            .send(rsvpData)
            .expect(201);

        expect(response.body).toMatchObject({
            guest_name: rsvpData.guestName,
            guest_email: rsvpData.guestEmail,
            attendance: rsvpData.attendance,
            guest_count: rsvpData.guestCount,
            message: rsvpData.message
        });
    });

    test('GET /rsvp/event/:eventId/stats should return RSVP statistics', async () => {
        // Create some test RSVPs
        const db = await getDB();
        await db.run(
            'INSERT INTO rsvps (id, event_id, invite_id, guest_name, guest_email, attendance, guest_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
            uuidv4(), testEvent.id, testInvite.id, 'Guest 1', 'guest1@example.com', 'yes', 2
        );
        await db.run(
            'INSERT INTO rsvps (id, event_id, invite_id, guest_name, guest_email, attendance, guest_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
            uuidv4(), testEvent.id, testInvite.id, 'Guest 2', 'guest2@example.com', 'no', 1
        );

        const response = await request(app)
            .get(`/rsvp/event/${testEvent.id}/stats`)
            .set('Cookie', `session_token=${authToken}`)
            .expect(200);

        expect(response.body).toMatchObject({
            eventId: testEvent.id,
            totalResponses: 2,
            attendingCount: 1,
            notAttendingCount: 1,
            maybeCount: 0,
            totalGuests: 3
        });
    });

    test('GET /rsvp/event/:eventId/export should return CSV data', async () => {
        // Create a test RSVP
        const db = await getDB();
        await db.run(
            'INSERT INTO rsvps (id, event_id, invite_id, guest_name, guest_email, attendance, guest_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
            uuidv4(), testEvent.id, testInvite.id, 'Guest 1', 'guest1@example.com', 'yes', 2
        );

        const response = await request(app)
            .get(`/rsvp/event/${testEvent.id}/export`)
            .set('Cookie', `session_token=${authToken}`)
            .expect(200);

        expect(response.headers['content-type']).toContain('text/csv');
        expect(response.text).toContain('Guest 1');
        expect(response.text).toContain('guest1@example.com');
        expect(response.text).toContain('yes');
    });

    test('POST /rsvp/submit should validate required fields', async () => {
        const invalidRsvpData = {
            eventId: testEvent.id,
            inviteId: testInvite.id,
            // Missing required fields
        };

        const response = await request(app)
            .post('/rsvp/submit')
            .send(invalidRsvpData)
            .expect(400);

        expect(response.body).toHaveProperty('error');
    });

    test('GET /rsvp/event/:eventId/stats should require authentication', async () => {
        const response = await request(app)
            .get(`/rsvp/event/${testEvent.id}/stats`)
            .expect(401);

        expect(response.body).toHaveProperty('error', 'Authentication required');
    });
});
