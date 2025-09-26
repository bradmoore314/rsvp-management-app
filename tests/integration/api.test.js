const request = require('supertest');
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const eventRoutes = require('../../routes/events');
const rsvpRoutes = require('../../routes/rsvp');
const inviteRoutes = require('../../routes/invites');

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Mount routes
app.use('/events', eventRoutes);
app.use('/rsvp', rsvpRoutes);
app.use('/invites', inviteRoutes);

describe('API Integration Tests', () => {
    let testEventId;
    let testInviteId;

    describe('Event Management API', () => {
        test('POST /events - should create a new event', async () => {
            const eventData = {
                name: 'Test Birthday Party',
                description: 'A fun birthday celebration',
                date: '2025-12-25',
                time: '7:00 PM',
                location: '123 Party Street',
                hostName: 'John Doe',
                hostEmail: 'john@example.com',
                showDietaryRestrictions: true,
                showDressCode: false,
                showHostMessage: true,
                dressCode: '',
                hostMessage: 'Looking forward to seeing everyone!',
                eventCategory: 'Birthday',
                eventTags: ['party', 'birthday'],
                status: 'active',
                reminderEnabled: true,
                reminderDays: 7,
                dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-Free', 'No Restrictions']
            };

            const response = await request(app)
                .post('/events')
                .send(eventData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.name).toBe('Test Birthday Party');
            expect(response.body.data.id).toBeDefined();
            
            testEventId = response.body.data.id;
        });

        test('GET /events/:eventId - should retrieve an event', async () => {
            const response = await request(app)
                .get(`/events/${testEventId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBe(testEventId);
            expect(response.body.data.name).toBe('Test Birthday Party');
        });

        test('GET /events - should retrieve all events', async () => {
            const response = await request(app)
                .get('/events')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        test('GET /events/host/:email - should retrieve events by host', async () => {
            const response = await request(app)
                .get('/events/host/john@example.com')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('RSVP API', () => {
        test('GET /rsvp/:eventId/:inviteId - should serve RSVP form', async () => {
            testInviteId = 'test-invite-123';
            
            const response = await request(app)
                .get(`/rsvp/${testEventId}/${testInviteId}`)
                .expect(200);

            expect(response.text).toContain('RSVP - Event Invitation');
            expect(response.text).toContain('Test Birthday Party');
            expect(response.text).toContain('123 Party Street');
            expect(response.text).toContain('Looking forward to seeing everyone!');
        });

        test('POST /rsvp/submit - should submit RSVP', async () => {
            const rsvpData = {
                eventId: testEventId,
                inviteId: testInviteId,
                guestName: 'Jane Smith',
                guestEmail: 'jane@example.com',
                guestPhone: '555-1234',
                emergencyContact: 'John Smith - 555-5678',
                attendance: 'yes',
                guestCount: 2,
                dietaryOptions: ['Vegetarian'],
                dietaryRestrictions: 'No nuts please',
                message: 'Looking forward to the party!',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/rsvp/submit')
                .send(rsvpData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.guestName).toBe('Jane Smith');
            expect(response.body.data.attendance).toBe('yes');
        });

        test('POST /rsvp/submit - should validate required fields', async () => {
            const invalidRsvpData = {
                eventId: '',
                inviteId: '',
                guestName: '',
                guestEmail: 'invalid-email',
                attendance: 'invalid',
                guestCount: 0
            };

            const response = await request(app)
                .post('/rsvp/submit')
                .send(invalidRsvpData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('Invite Management API', () => {
        test('POST /invites/generate - should generate invites for an event', async () => {
            const inviteData = {
                eventId: testEventId,
                inviteCount: 3,
                guestName: 'Test Guest',
                guestEmail: 'test@example.com',
                customMessage: 'You are invited!'
            };

            const response = await request(app)
                .post('/invites/generate')
                .send(inviteData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.eventId).toBe(testEventId);
            expect(response.body.data.inviteCount).toBe(3);
            expect(response.body.data.invites).toBeDefined();
            expect(response.body.data.invites.length).toBe(3);
        });

        test('GET /invites/event/:eventId - should retrieve invites for an event', async () => {
            const response = await request(app)
                .get(`/invites/event/${testEventId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /invites/:inviteId - should retrieve a specific invite', async () => {
            // First get invites to find a valid invite ID
            const invitesResponse = await request(app)
                .get(`/invites/event/${testEventId}`)
                .expect(200);

            if (invitesResponse.body.data.length > 0) {
                const inviteId = invitesResponse.body.data[0].id;
                
                const response = await request(app)
                    .get(`/invites/${inviteId}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toBeDefined();
                expect(response.body.data.id).toBe(inviteId);
            }
        });
    });

    describe('Error Handling', () => {
        test('GET /events/invalid-id - should return 404 for non-existent event', async () => {
            const response = await request(app)
                .get('/events/invalid-event-id')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        test('GET /invites/invalid-id - should return 404 for non-existent invite', async () => {
            const response = await request(app)
                .get('/invites/invalid-invite-id')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        test('POST /events - should return 400 for invalid event data', async () => {
            const invalidEventData = {
                name: '',
                date: '',
                time: '7:00 PM',
                location: 'Test Location',
                hostName: 'Test Host',
                hostEmail: 'test@example.com'
            };

            const response = await request(app)
                .post('/events')
                .send(invalidEventData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('CORS and Headers', () => {
        test('should include CORS headers', async () => {
            const response = await request(app)
                .get('/events')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBeDefined();
        });

        test('should handle OPTIONS requests', async () => {
            await request(app)
                .options('/events')
                .expect(204);
        });
    });
});
