const RSVPService = require('../../services/rsvpService');
const { v4: uuidv4 } = require('uuid');

// Mock dependencies
const mockGoogleDrive = {
    isReady: jest.fn(() => false),
    initialize: jest.fn(),
    loadTokens: jest.fn(),
    setCredentialsFromTokens: jest.fn()
};

const mockGoogleSheets = {
    isReady: jest.fn(() => false),
    initialize: jest.fn(),
    addRSVPResponse: jest.fn()
};

const mockEmailService = {
    initialize: jest.fn(),
    sendRSVPNotification: jest.fn()
};

describe('RSVPService', () => {
    let rsvpService;

    beforeEach(() => {
        rsvpService = new RSVPService();
        rsvpService.googleDrive = mockGoogleDrive;
        rsvpService.googleSheets = mockGoogleSheets;
        rsvpService.emailService = mockEmailService;
        jest.clearAllMocks();
    });

    describe('submitRSVP', () => {
        test('should submit a valid RSVP', async () => {
            const rsvpData = {
                eventId: 'test-event-123',
                inviteId: 'test-invite-456',
                guestName: 'John Doe',
                guestEmail: 'john@example.com',
                guestPhone: '555-1234',
                emergencyContact: 'Jane Doe - 555-5678',
                attendance: 'yes',
                guestCount: 2,
                dietaryOptions: ['Vegetarian'],
                dietaryRestrictions: 'No nuts please',
                message: 'Looking forward to the event!',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0...'
            };

            const result = await rsvpService.submitRSVP(rsvpData);

            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.eventId).toBe(rsvpData.eventId);
            expect(result.inviteId).toBe(rsvpData.inviteId);
            expect(result.guestName).toBe(rsvpData.guestName);
            expect(result.guestEmail).toBe(rsvpData.guestEmail);
            expect(result.guestPhone).toBe(rsvpData.guestPhone);
            expect(result.emergencyContact).toBe(rsvpData.emergencyContact);
            expect(result.attendance).toBe(rsvpData.attendance);
            expect(result.guestCount).toBe(rsvpData.guestCount);
            expect(result.dietaryOptions).toEqual(rsvpData.dietaryOptions);
            expect(result.dietaryRestrictions).toBe(rsvpData.dietaryRestrictions);
            expect(result.message).toBe(rsvpData.message);
            expect(result.submittedAt).toBeDefined();
            expect(result.ipAddress).toBe(rsvpData.ipAddress);
            expect(result.userAgent).toBe(rsvpData.userAgent);
        });

        test('should handle missing optional fields', async () => {
            const rsvpData = {
                eventId: 'test-event-123',
                inviteId: 'test-invite-456',
                guestName: 'Jane Smith',
                guestEmail: 'jane@example.com',
                attendance: 'no',
                guestCount: 1
            };

            const result = await rsvpService.submitRSVP(rsvpData);

            expect(result.guestPhone).toBe('');
            expect(result.emergencyContact).toBe('');
            expect(result.dietaryOptions).toEqual([]);
            expect(result.dietaryRestrictions).toBe('');
            expect(result.message).toBe('');
            expect(result.ipAddress).toBeNull();
            expect(result.userAgent).toBeNull();
        });

        test('should validate required fields', async () => {
            const invalidRsvpData = {
                eventId: '',
                inviteId: 'test-invite-456',
                guestName: '',
                guestEmail: 'invalid-email',
                attendance: 'invalid',
                guestCount: 0
            };

            await expect(rsvpService.submitRSVP(invalidRsvpData)).rejects.toThrow();
        });

        test('should store RSVP in memory cache', async () => {
            const rsvpData = {
                eventId: 'test-event-123',
                inviteId: 'test-invite-456',
                guestName: 'Test User',
                guestEmail: 'test@example.com',
                attendance: 'yes',
                guestCount: 1
            };

            const result = await rsvpService.submitRSVP(rsvpData);

            const storedRsvp = rsvpService.rsvpResponses.get(result.id);
            expect(storedRsvp).toBeDefined();
            expect(storedRsvp.id).toBe(result.id);
        });
    });

    describe('validateRSVPData', () => {
        test('should validate correct RSVP data', () => {
            const validData = {
                eventId: 'test-event-123',
                inviteId: 'test-invite-456',
                guestName: 'John Doe',
                guestEmail: 'john@example.com',
                attendance: 'yes',
                guestCount: 2
            };

            const validation = rsvpService.validateRSVPData(validData);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        test('should return errors for invalid data', () => {
            const invalidData = {
                eventId: '',
                inviteId: '',
                guestName: '',
                guestEmail: 'invalid-email',
                attendance: 'invalid',
                guestCount: -1
            };

            const validation = rsvpService.validateRSVPData(invalidData);
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
        });

        test('should validate email format', () => {
            const dataWithInvalidEmail = {
                eventId: 'test-event-123',
                inviteId: 'test-invite-456',
                guestName: 'John Doe',
                guestEmail: 'not-an-email',
                attendance: 'yes',
                guestCount: 1
            };

            const validation = rsvpService.validateRSVPData(dataWithInvalidEmail);
            expect(validation.isValid).toBe(false);
            expect(validation.errors.some(error => error.includes('email'))).toBe(true);
        });

        test('should validate attendance values', () => {
            const dataWithInvalidAttendance = {
                eventId: 'test-event-123',
                inviteId: 'test-invite-456',
                guestName: 'John Doe',
                guestEmail: 'john@example.com',
                attendance: 'maybe-not',
                guestCount: 1
            };

            const validation = rsvpService.validateRSVPData(dataWithInvalidAttendance);
            expect(validation.isValid).toBe(false);
            expect(validation.errors.some(error => error.includes('attendance'))).toBe(true);
        });

        test('should validate guest count', () => {
            const dataWithInvalidGuestCount = {
                eventId: 'test-event-123',
                inviteId: 'test-invite-456',
                guestName: 'John Doe',
                guestEmail: 'john@example.com',
                attendance: 'yes',
                guestCount: 0
            };

            const validation = rsvpService.validateRSVPData(dataWithInvalidGuestCount);
            expect(validation.isValid).toBe(false);
            expect(validation.errors.some(error => error.includes('guest count'))).toBe(true);
        });
    });

    describe('getRSVPResponses', () => {
        test('should return RSVP responses for an event', async () => {
            const eventId = 'test-event-123';
            
            // Create some test RSVPs
            const rsvp1 = await rsvpService.submitRSVP({
                eventId: eventId,
                inviteId: 'invite-1',
                guestName: 'John Doe',
                guestEmail: 'john@example.com',
                attendance: 'yes',
                guestCount: 1
            });

            const rsvp2 = await rsvpService.submitRSVP({
                eventId: eventId,
                inviteId: 'invite-2',
                guestName: 'Jane Smith',
                guestEmail: 'jane@example.com',
                attendance: 'no',
                guestCount: 1
            });

            // Create RSVP for different event
            await rsvpService.submitRSVP({
                eventId: 'other-event-456',
                inviteId: 'invite-3',
                guestName: 'Bob Wilson',
                guestEmail: 'bob@example.com',
                attendance: 'yes',
                guestCount: 1
            });

            const responses = await rsvpService.getRSVPResponses(eventId);

            expect(responses).toHaveLength(2);
            expect(responses.some(r => r.id === rsvp1.id)).toBe(true);
            expect(responses.some(r => r.id === rsvp2.id)).toBe(true);
        });

        test('should return empty array for event with no RSVPs', async () => {
            const eventId = 'no-rsvps-event';
            const responses = await rsvpService.getRSVPResponses(eventId);

            expect(responses).toEqual([]);
        });
    });

    describe('getRSVPStats', () => {
        test('should calculate correct RSVP statistics', async () => {
            const eventId = 'test-event-123';
            
            // Create test RSVPs
            await rsvpService.submitRSVP({
                eventId: eventId,
                inviteId: 'invite-1',
                guestName: 'John Doe',
                guestEmail: 'john@example.com',
                attendance: 'yes',
                guestCount: 2
            });

            await rsvpService.submitRSVP({
                eventId: eventId,
                inviteId: 'invite-2',
                guestName: 'Jane Smith',
                guestEmail: 'jane@example.com',
                attendance: 'yes',
                guestCount: 1
            });

            await rsvpService.submitRSVP({
                eventId: eventId,
                inviteId: 'invite-3',
                guestName: 'Bob Wilson',
                guestEmail: 'bob@example.com',
                attendance: 'no',
                guestCount: 1
            });

            await rsvpService.submitRSVP({
                eventId: eventId,
                inviteId: 'invite-4',
                guestName: 'Alice Brown',
                guestEmail: 'alice@example.com',
                attendance: 'maybe',
                guestCount: 1
            });

            const stats = await rsvpService.getRSVPStats(eventId);

            expect(stats).toEqual({
                eventId: eventId,
                totalResponses: 4,
                attending: 2,
                notAttending: 1,
                maybe: 1,
                totalGuests: 5, // 2 + 1 + 1 + 1
                attendingCount: 2,
                notAttendingCount: 1,
                maybeCount: 1
            });
        });

        test('should return zero stats for event with no RSVPs', async () => {
            const eventId = 'no-rsvps-event';
            const stats = await rsvpService.getRSVPStats(eventId);

            expect(stats).toEqual({
                eventId: eventId,
                totalResponses: 0,
                attending: 0,
                notAttending: 0,
                maybe: 0,
                totalGuests: 0,
                attendingCount: 0,
                notAttendingCount: 0,
                maybeCount: 0
            });
        });
    });

    describe('exportRSVPData', () => {
        test('should export RSVP data as CSV', async () => {
            const eventId = 'test-event-123';
            
            await rsvpService.submitRSVP({
                eventId: eventId,
                inviteId: 'invite-1',
                guestName: 'John Doe',
                guestEmail: 'john@example.com',
                attendance: 'yes',
                guestCount: 2,
                dietaryRestrictions: 'Vegetarian',
                message: 'Looking forward to it!'
            });

            const csvData = await rsvpService.exportRSVPData(eventId);

            expect(csvData).toContain('Timestamp,Guest Name,Guest Email,Phone Number,Emergency Contact,Attendance,Guest Count,Dietary Restrictions,Message,Invite ID');
            expect(csvData).toContain('John Doe');
            expect(csvData).toContain('john@example.com');
            expect(csvData).toContain('yes');
            expect(csvData).toContain('2');
            expect(csvData).toContain('Vegetarian');
            expect(csvData).toContain('Looking forward to it!');
        });

        test('should return empty CSV for event with no RSVPs', async () => {
            const eventId = 'no-rsvps-event';
            const csvData = await rsvpService.exportRSVPData(eventId);

            expect(csvData).toBe('Timestamp,Guest Name,Guest Email,Phone Number,Emergency Contact,Attendance,Guest Count,Dietary Restrictions,Message,Invite ID\n');
        });
    });
});
