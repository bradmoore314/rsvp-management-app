const EventService = require('../../services/eventService');
const { v4: uuidv4 } = require('uuid');

// Mock Google Drive service
const mockGoogleDrive = {
    isReady: jest.fn(() => false),
    findFolder: jest.fn(),
    listFiles: jest.fn(),
    downloadFile: jest.fn(),
    createFolder: jest.fn(),
    createTextFile: jest.fn(),
    updateFile: jest.fn(),
    deleteFile: jest.fn()
};

describe('EventService', () => {
    let eventService;

    beforeEach(() => {
        eventService = new EventService();
        eventService.googleDrive = mockGoogleDrive;
        jest.clearAllMocks();
    });

    describe('createEvent', () => {
        test('should create a new event with all required fields', async () => {
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
                reminderDays: 7
            };

            const event = await eventService.createEvent(eventData);

            expect(event).toBeDefined();
            expect(event.id).toBeDefined();
            expect(event.name).toBe('Test Birthday Party');
            expect(event.description).toBe('A fun birthday celebration');
            expect(event.date).toBe('2025-12-25');
            expect(event.time).toBe('7:00 PM');
            expect(event.location).toBe('123 Party Street');
            expect(event.hostName).toBe('John Doe');
            expect(event.hostEmail).toBe('john@example.com');
            expect(event.displayOptions.showDietaryRestrictions).toBe(true);
            expect(event.displayOptions.showDressCode).toBe(false);
            expect(event.displayOptions.showHostMessage).toBe(true);
            expect(event.dressCode).toBe('');
            expect(event.hostMessage).toBe('Looking forward to seeing everyone!');
            expect(event.eventCategory).toBe('Birthday');
            expect(event.eventTags).toEqual(['party', 'birthday']);
            expect(event.status).toBe('active');
            expect(event.reminderSettings.enabled).toBe(true);
            expect(event.reminderSettings.daysBefore).toBe(7);
            expect(event.created).toBeDefined();
            expect(event.updated).toBeDefined();
        });

        test('should handle missing optional fields with defaults', async () => {
            const eventData = {
                name: 'Minimal Event',
                date: '2025-12-25',
                time: '7:00 PM',
                location: 'Test Location',
                hostName: 'Test Host',
                hostEmail: 'test@example.com'
            };

            const event = await eventService.createEvent(eventData);

            expect(event.description).toBe('');
            expect(event.displayOptions.showDietaryRestrictions).toBe(false);
            expect(event.displayOptions.showDressCode).toBe(false);
            expect(event.displayOptions.showHostMessage).toBe(false);
            expect(event.dressCode).toBe('');
            expect(event.hostMessage).toBe('');
            expect(event.eventCategory).toBe('General');
            expect(event.eventTags).toEqual([]);
            expect(event.status).toBe('active');
            expect(event.reminderSettings.enabled).toBe(false);
            expect(event.reminderSettings.daysBefore).toBe(7);
        });

        test('should validate required fields', () => {
            const eventData = {
                name: '',
                date: '2025-12-25',
                time: '7:00 PM',
                location: 'Test Location',
                hostName: 'Test Host',
                hostEmail: 'test@example.com'
            };

            const validation = eventService.validateEventData(eventData);
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
        });
    });

    describe('getEvent', () => {
        test('should return event if it exists', async () => {
            const eventData = {
                name: 'Test Event',
                date: '2025-12-25',
                time: '7:00 PM',
                location: 'Test Location',
                hostName: 'Test Host',
                hostEmail: 'test@example.com'
            };

            const createdEvent = await eventService.createEvent(eventData);
            const retrievedEvent = await eventService.getEvent(createdEvent.id);

            expect(retrievedEvent).toBeDefined();
            expect(retrievedEvent.id).toBe(createdEvent.id);
            expect(retrievedEvent.name).toBe('Test Event');
        });

        test('should return null if event does not exist', async () => {
            const nonExistentId = uuidv4();
            const event = await eventService.getEvent(nonExistentId);

            expect(event).toBeNull();
        });
    });

    describe('updateEvent', () => {
        test('should update existing event', async () => {
            const eventData = {
                name: 'Original Event',
                date: '2025-12-25',
                time: '7:00 PM',
                location: 'Original Location',
                hostName: 'Test Host',
                hostEmail: 'test@example.com'
            };

            const createdEvent = await eventService.createEvent(eventData);
            
            const updateData = {
                name: 'Updated Event',
                location: 'Updated Location',
                description: 'Updated description'
            };

            const updatedEvent = await eventService.updateEvent(createdEvent.id, updateData);

            expect(updatedEvent.name).toBe('Updated Event');
            expect(updatedEvent.location).toBe('Updated Location');
            expect(updatedEvent.description).toBe('Updated description');
            expect(updatedEvent.updated).toBeDefined();
        });

        test('should throw error if event does not exist', async () => {
            const nonExistentId = uuidv4();
            const updateData = { name: 'Updated Name' };

            await expect(eventService.updateEvent(nonExistentId, updateData)).rejects.toThrow('Event not found');
        });
    });

    describe('deleteEvent', () => {
        test('should delete existing event', async () => {
            const eventData = {
                name: 'Event to Delete',
                date: '2025-12-25',
                time: '7:00 PM',
                location: 'Test Location',
                hostName: 'Test Host',
                hostEmail: 'test@example.com'
            };

            const createdEvent = await eventService.createEvent(eventData);
            const result = await eventService.deleteEvent(createdEvent.id);

            expect(result).toBe(true);
            
            const deletedEvent = await eventService.getEvent(createdEvent.id);
            expect(deletedEvent).toBeNull();
        });

        test('should throw error if event does not exist', async () => {
            const nonExistentId = uuidv4();
            
            await expect(eventService.deleteEvent(nonExistentId)).rejects.toThrow('Event not found');
        });
    });

    describe('getEventsByHost', () => {
        test('should return events by host', async () => {
            const event1Data = {
                name: 'Event 1',
                date: '2025-12-25',
                time: '7:00 PM',
                location: 'Location 1',
                hostName: 'Host 1',
                hostEmail: 'host1@example.com'
            };

            const event2Data = {
                name: 'Event 2',
                date: '2025-12-26',
                time: '8:00 PM',
                location: 'Location 2',
                hostName: 'Host 2',
                hostEmail: 'host2@example.com'
            };

            await eventService.createEvent(event1Data);
            await eventService.createEvent(event2Data);

            const host1Events = await eventService.getEventsByHost('host1@example.com');
            const host2Events = await eventService.getEventsByHost('host2@example.com');

            expect(host1Events).toHaveLength(1);
            expect(host1Events[0].name).toBe('Event 1');
            expect(host2Events).toHaveLength(1);
            expect(host2Events[0].name).toBe('Event 2');
        });
    });

    describe('validateEventData', () => {
        test('should validate required fields', () => {
            const validData = {
                name: 'Test Event',
                date: '2025-12-25',
                time: '7:00 PM',
                location: 'Test Location',
                hostName: 'Test Host',
                hostEmail: 'test@example.com'
            };

            const validation = eventService.validateEventData(validData);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        test('should return errors for missing required fields', () => {
            const invalidData = {
                name: '',
                date: '',
                time: '7:00 PM',
                location: 'Test Location',
                hostName: 'Test Host',
                hostEmail: 'test@example.com'
            };

            const validation = eventService.validateEventData(invalidData);
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
        });
    });
});
