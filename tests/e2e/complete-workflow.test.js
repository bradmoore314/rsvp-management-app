const request = require('supertest');
const express = require('express');
const cors = require('cors');

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

describe('End-to-End Workflow Tests', () => {
    let testEventId;
    let testInviteIds = [];

    describe('Complete Event Management Workflow', () => {
        test('1. Create Event with All Features', async () => {
            const eventData = {
                name: 'E2E Test Birthday Party',
                description: 'A comprehensive test of the event creation system',
                date: '2025-12-25',
                time: '7:00 PM',
                location: '123 Test Street, Test City',
                hostName: 'E2E Test Host',
                hostEmail: 'e2e-test@example.com',
                showDietaryRestrictions: true,
                showDressCode: true,
                showHostMessage: true,
                dressCode: 'Semi-formal attire requested',
                hostMessage: 'We are excited to celebrate with you! Please RSVP by December 20th.',
                eventCategory: 'Birthday',
                eventTags: ['birthday', 'party', 'celebration'],
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
            expect(response.body.data.name).toBe('E2E Test Birthday Party');
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.displayOptions.showDietaryRestrictions).toBe(true);
            expect(response.body.data.displayOptions.showDressCode).toBe(true);
            expect(response.body.data.displayOptions.showHostMessage).toBe(true);
            expect(response.body.data.dressCode).toBe('Semi-formal attire requested');
            expect(response.body.data.hostMessage).toBe('We are excited to celebrate with you! Please RSVP by December 20th.');
            expect(response.body.data.eventCategory).toBe('Birthday');
            expect(response.body.data.eventTags).toEqual(['birthday', 'party', 'celebration']);
            expect(response.body.data.status).toBe('active');
            expect(response.body.data.reminderSettings.enabled).toBe(true);
            expect(response.body.data.reminderSettings.daysBefore).toBe(7);

            testEventId = response.body.data.id;
        });

        test('2. Generate Multiple Invites', async () => {
            const inviteData = {
                eventId: testEventId,
                inviteCount: 5,
                guestName: 'Test Guest',
                guestEmail: 'guest@example.com',
                customMessage: 'You are cordially invited to our birthday celebration!'
            };

            const response = await request(app)
                .post('/invites/generate')
                .send(inviteData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.eventId).toBe(testEventId);
            expect(response.body.data.inviteCount).toBe(5);
            expect(response.body.data.invites).toBeDefined();
            expect(response.body.data.invites.length).toBe(5);

            // Store invite IDs for later tests
            testInviteIds = response.body.data.invites.map(invite => invite.id);
        });

        test('3. Verify Invites are Accessible', async () => {
            for (const inviteId of testInviteIds) {
                const response = await request(app)
                    .get(`/invites/${inviteId}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toBeDefined();
                expect(response.body.data.id).toBe(inviteId);
                expect(response.body.data.eventId).toBe(testEventId);
                expect(response.body.data.rsvpUrl).toBeDefined();
                expect(response.body.data.qrCodeDataURL).toBeDefined();
            }
        });

        test('4. Test RSVP Form Access', async () => {
            const testInviteId = testInviteIds[0];
            
            const response = await request(app)
                .get(`/rsvp/${testEventId}/${testInviteId}`)
                .expect(200);

            expect(response.text).toContain('RSVP - Event Invitation');
            expect(response.text).toContain('E2E Test Birthday Party');
            expect(response.text).toContain('123 Test Street, Test City');
            expect(response.text).toContain('Semi-formal attire requested');
            expect(response.text).toContain('We are excited to celebrate with you!');
            expect(response.text).toContain('Dietary Restrictions or Allergies');
        });

        test('5. Submit Multiple RSVPs', async () => {
            const rsvpData = [
                {
                    eventId: testEventId,
                    inviteId: testInviteIds[0],
                    guestName: 'Alice Johnson',
                    guestEmail: 'alice@example.com',
                    guestPhone: '555-0001',
                    emergencyContact: 'Bob Johnson - 555-0002',
                    attendance: 'yes',
                    guestCount: 2,
                    dietaryOptions: ['Vegetarian'],
                    dietaryRestrictions: 'No nuts or dairy',
                    message: 'Looking forward to celebrating!',
                    timestamp: new Date().toISOString()
                },
                {
                    eventId: testEventId,
                    inviteId: testInviteIds[1],
                    guestName: 'Charlie Brown',
                    guestEmail: 'charlie@example.com',
                    guestPhone: '555-0003',
                    emergencyContact: 'Sally Brown - 555-0004',
                    attendance: 'yes',
                    guestCount: 1,
                    dietaryOptions: ['No Restrictions'],
                    dietaryRestrictions: '',
                    message: 'Can\'t wait for the party!',
                    timestamp: new Date().toISOString()
                },
                {
                    eventId: testEventId,
                    inviteId: testInviteIds[2],
                    guestName: 'David Wilson',
                    guestEmail: 'david@example.com',
                    guestPhone: '555-0005',
                    emergencyContact: 'Emma Wilson - 555-0006',
                    attendance: 'no',
                    guestCount: 1,
                    dietaryOptions: [],
                    dietaryRestrictions: '',
                    message: 'Sorry, can\'t make it this time.',
                    timestamp: new Date().toISOString()
                },
                {
                    eventId: testEventId,
                    inviteId: testInviteIds[3],
                    guestName: 'Eva Martinez',
                    guestEmail: 'eva@example.com',
                    guestPhone: '555-0007',
                    emergencyContact: 'Frank Martinez - 555-0008',
                    attendance: 'maybe',
                    guestCount: 1,
                    dietaryOptions: ['Gluten-Free'],
                    dietaryRestrictions: 'Celiac disease',
                    message: 'I\'ll try to make it!',
                    timestamp: new Date().toISOString()
                }
            ];

            for (const rsvp of rsvpData) {
                const response = await request(app)
                    .post('/rsvp/submit')
                    .send(rsvp)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toBeDefined();
                expect(response.body.data.guestName).toBe(rsvp.guestName);
                expect(response.body.data.attendance).toBe(rsvp.attendance);
                expect(response.body.data.guestCount).toBe(rsvp.guestCount);
            }
        });

        test('6. Verify RSVP Data Persistence', async () => {
            // Wait a moment for data to be processed
            await new Promise(resolve => setTimeout(resolve, 100));

            const response = await request(app)
                .get(`/rsvp-management/responses/${testEventId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.length).toBe(4);

            // Verify each RSVP is present
            const guestNames = response.body.data.map(rsvp => rsvp.guestName);
            expect(guestNames).toContain('Alice Johnson');
            expect(guestNames).toContain('Charlie Brown');
            expect(guestNames).toContain('David Wilson');
            expect(guestNames).toContain('Eva Martinez');
        });

        test('7. Verify RSVP Statistics', async () => {
            const response = await request(app)
                .get(`/rsvp-management/stats/${testEventId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.eventId).toBe(testEventId);
            expect(response.body.data.totalResponses).toBe(4);
            expect(response.body.data.attending).toBe(2); // Alice (2 guests) + Charlie (1 guest)
            expect(response.body.data.notAttending).toBe(1); // David
            expect(response.body.data.maybe).toBe(1); // Eva
            expect(response.body.data.totalGuests).toBe(4); // 2 + 1 + 1 + 1
        });

        test('8. Test Event Update', async () => {
            const updateData = {
                name: 'Updated E2E Test Birthday Party',
                description: 'Updated description for the test event',
                location: '456 Updated Street, Updated City',
                hostMessage: 'Updated message: We are very excited to celebrate with you!',
                status: 'paused'
            };

            const response = await request(app)
                .put(`/events/${testEventId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.name).toBe('Updated E2E Test Birthday Party');
            expect(response.body.data.description).toBe('Updated description for the test event');
            expect(response.body.data.location).toBe('456 Updated Street, Updated City');
            expect(response.body.data.hostMessage).toBe('Updated message: We are very excited to celebrate with you!');
            expect(response.body.data.status).toBe('paused');
        });

        test('9. Test Event Status Change', async () => {
            const response = await request(app)
                .patch(`/events/${testEventId}/status`)
                .send({ status: 'active' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.status).toBe('active');
        });

        test('10. Test Event Duplication', async () => {
            const response = await request(app)
                .post(`/events/${testEventId}/duplicate`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).not.toBe(testEventId);
            expect(response.body.data.name).toContain('Copy of');
            expect(response.body.data.status).toBe('active');
        });

        test('11. Test Event Retrieval by Host', async () => {
            const response = await request(app)
                .get('/events/host/e2e-test@example.com')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            
            const eventIds = response.body.data.map(event => event.id);
            expect(eventIds).toContain(testEventId);
        });

        test('12. Test Event Retrieval by Category', async () => {
            const response = await request(app)
                .get('/events/category/Birthday')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            
            const eventIds = response.body.data.map(event => event.id);
            expect(eventIds).toContain(testEventId);
        });

        test('13. Test Event Retrieval by Status', async () => {
            const response = await request(app)
                .get('/events/status/active')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            
            const eventIds = response.body.data.map(event => event.id);
            expect(eventIds).toContain(testEventId);
        });

        test('14. Test RSVP Export', async () => {
            const response = await request(app)
                .get(`/rsvp-management/export/${testEventId}`)
                .expect(200);

            expect(response.headers['content-type']).toContain('text/csv');
            expect(response.text).toContain('Timestamp,Guest Name,Guest Email,Phone Number,Emergency Contact,Attendance,Guest Count,Dietary Restrictions,Message,Invite ID');
            expect(response.text).toContain('Alice Johnson');
            expect(response.text).toContain('Charlie Brown');
            expect(response.text).toContain('David Wilson');
            expect(response.text).toContain('Eva Martinez');
        });

        test('15. Test Event Deletion', async () => {
            const response = await request(app)
                .delete(`/events/${testEventId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted successfully');
        });

        test('16. Verify Event Deletion', async () => {
            const response = await request(app)
                .get(`/events/${testEventId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not found');
        });
    });

    describe('Error Handling Workflow', () => {
        test('1. Test Invalid Event Creation', async () => {
            const invalidEventData = {
                name: '',
                date: 'invalid-date',
                time: '',
                location: '',
                hostName: '',
                hostEmail: 'invalid-email'
            };

            const response = await request(app)
                .post('/events')
                .send(invalidEventData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        test('2. Test Invalid RSVP Submission', async () => {
            const invalidRsvpData = {
                eventId: 'non-existent-event',
                inviteId: 'non-existent-invite',
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

        test('3. Test Non-existent Event Access', async () => {
            const response = await request(app)
                .get('/events/non-existent-event-id')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not found');
        });

        test('4. Test Non-existent Invite Access', async () => {
            const response = await request(app)
                .get('/invites/non-existent-invite-id')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not found');
        });

        test('5. Test Invalid RSVP Form Access', async () => {
            const response = await request(app)
                .get('/rsvp/non-existent-event/non-existent-invite')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not found');
        });
    });

    describe('Data Validation Workflow', () => {
        test('1. Test Email Validation', async () => {
            const eventData = {
                name: 'Email Validation Test',
                date: '2025-12-25',
                time: '7:00 PM',
                location: 'Test Location',
                hostName: 'Test Host',
                hostEmail: 'invalid-email-format'
            };

            const response = await request(app)
                .post('/events')
                .send(eventData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('email');
        });

        test('2. Test Date Validation', async () => {
            const eventData = {
                name: 'Date Validation Test',
                date: 'invalid-date',
                time: '7:00 PM',
                location: 'Test Location',
                hostName: 'Test Host',
                hostEmail: 'test@example.com'
            };

            const response = await request(app)
                .post('/events')
                .send(eventData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        test('3. Test Guest Count Validation', async () => {
            const rsvpData = {
                eventId: 'test-event',
                inviteId: 'test-invite',
                guestName: 'Test Guest',
                guestEmail: 'test@example.com',
                attendance: 'yes',
                guestCount: -1
            };

            const response = await request(app)
                .post('/rsvp/submit')
                .send(rsvpData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });
});
