const GoogleDriveService = require('./googleDrive');
const { v4: uuidv4 } = require('uuid');

class EventService {
    constructor() {
        this.googleDrive = new GoogleDriveService();
        this.events = new Map(); // In-memory cache for events
    }

    /**
     * Initialize the event service
     */
    async initialize() {
        await this.googleDrive.initialize();
        
        // Try to load saved tokens
        const savedTokens = await this.googleDrive.loadTokens();
        if (savedTokens) {
            await this.googleDrive.setCredentialsFromTokens(savedTokens);
        }
    }

    /**
     * Create a new event
     */
    async createEvent(eventData) {
        try {
            const eventId = uuidv4();
                const event = {
                    id: eventId,
                    name: eventData.name,
                    description: eventData.description || '',
                    date: eventData.date,
                    time: eventData.time,
                    endTime: eventData.endTime || null,
                    location: eventData.location,
                    hostName: eventData.hostName,
                    hostEmail: eventData.hostEmail,
                    maxGuests: eventData.maxGuests || null,
                    rsvpDeadline: eventData.rsvpDeadline || null,
                    dietaryOptions: eventData.dietaryOptions || [],
                    specialInstructions: eventData.specialInstructions || '',
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    status: 'active'
                };

            // Handle image data if present
            if (eventData.image) {
                event.image = {
                    id: eventData.image.id,
                    filename: eventData.image.filename,
                    originalName: eventData.image.originalName,
                    size: eventData.image.size,
                    mimetype: eventData.image.mimetype,
                    uploadedAt: eventData.image.uploadedAt,
                    driveFileId: eventData.image.driveFileId,
                    driveUrl: eventData.image.driveUrl
                };
            }

            // Store in memory cache
            this.events.set(eventId, event);

            // Store in Google Drive if authenticated
            if (this.googleDrive.isReady()) {
                try {
                    await this.storeEventInDrive(event);
                } catch (error) {
                    console.log('ℹ️ Could not store in Google Drive, storing in memory only:', error.message);
                }
            }

            console.log(`✅ Created event: ${event.name} (ID: ${eventId})`);
            return event;
        } catch (error) {
            console.error('❌ Failed to create event:', error.message);
            throw error;
        }
    }

    /**
     * Get event by ID
     */
    async getEvent(eventId) {
        try {
            // Check memory cache first
            if (this.events.has(eventId)) {
                return this.events.get(eventId);
            }

            // Try to load from Google Drive if authenticated
            if (this.googleDrive.isReady()) {
                try {
                    const event = await this.loadEventFromDrive(eventId);
                    if (event) {
                        this.events.set(eventId, event);
                        return event;
                    }
                } catch (error) {
                    console.log('ℹ️ Could not load from Google Drive:', error.message);
                }
            }

            return null;
        } catch (error) {
            console.error(`❌ Failed to get event ${eventId}:`, error.message);
            return null;
        }
    }

    /**
     * Update an event
     */
    async updateEvent(eventId, updateData) {
        try {
            const event = await this.getEvent(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            // Update event data
            const updatedEvent = {
                ...event,
                ...updateData,
                updated: new Date().toISOString()
            };

            // Update memory cache
            this.events.set(eventId, updatedEvent);

            // Update in Google Drive if authenticated
            if (this.googleDrive.isReady()) {
                try {
                    await this.storeEventInDrive(updatedEvent);
                } catch (error) {
                    console.log('ℹ️ Could not update in Google Drive:', error.message);
                }
            }

            console.log(`✅ Updated event: ${updatedEvent.name} (ID: ${eventId})`);
            return updatedEvent;
        } catch (error) {
            console.error(`❌ Failed to update event ${eventId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get all events for a host
     */
    async getEventsByHost(hostEmail) {
        try {
            const events = Array.from(this.events.values())
                .filter(event => event.hostEmail === hostEmail)
                .sort((a, b) => new Date(b.created) - new Date(a.created));

            return events;
        } catch (error) {
            console.error(`❌ Failed to get events for host ${hostEmail}:`, error.message);
            return [];
        }
    }

    /**
     * Store event in Google Drive
     */
    async storeEventInDrive(event) {
        try {
            if (!this.googleDrive.isReady()) {
                console.log('ℹ️ Google Drive not authenticated, storing in memory only');
                return;
            }

            // Create events folder if it doesn't exist
            const eventsFolderName = 'RSVP-Events';
            let eventsFolder;
            
            try {
                eventsFolder = await this.googleDrive.createFolder(eventsFolderName);
            } catch (error) {
                // Folder might already exist, try to find it
                const files = await this.googleDrive.listFiles(null, eventsFolderName);
                const existingFolder = files.find(file => file.name === eventsFolderName);
                if (existingFolder) {
                    eventsFolder = existingFolder;
                } else {
                    throw error;
                }
            }

            // Create event file
            const fileName = `event-${event.id}.json`;
            const content = JSON.stringify(event, null, 2);

            await this.googleDrive.createTextFile(fileName, content, eventsFolder.id);
            console.log(`✅ Stored event ${event.id} in Google Drive`);
        } catch (error) {
            console.error(`❌ Failed to store event in Google Drive:`, error.message);
            throw error;
        }
    }

    /**
     * Load event from Google Drive
     */
    async loadEventFromDrive(eventId) {
        try {
            if (!this.googleDrive.isReady()) {
                return null;
            }

            const eventsFolderName = 'RSVP-Events';
            const files = await this.googleDrive.listFiles(null, eventsFolderName);
            const eventsFolder = files.find(file => file.name === eventsFolderName);
            
            if (!eventsFolder) {
                return null;
            }

            const eventFiles = await this.googleDrive.listFiles(eventsFolder.id, `event-${eventId}`);
            if (eventFiles.length === 0) {
                return null;
            }

            // Read the event file content
            const eventFile = eventFiles[0];
            const fileContent = await this.googleDrive.getFileContent(eventFile.id);
            
            if (fileContent) {
                const eventData = JSON.parse(fileContent);
                return eventData;
            }
            
            return null;
        } catch (error) {
            console.error(`❌ Failed to load event from Google Drive:`, error.message);
            return null;
        }
    }

    /**
     * Validate event data
     */
    validateEventData(eventData) {
        const errors = [];

        if (!eventData.name || eventData.name.trim().length === 0) {
            errors.push('Event name is required');
        }

        if (!eventData.date) {
            errors.push('Event date is required');
        }

        if (!eventData.time) {
            errors.push('Event time is required');
        }

        if (!eventData.location || eventData.location.trim().length === 0) {
            errors.push('Event location is required');
        }

        if (!eventData.hostName || eventData.hostName.trim().length === 0) {
            errors.push('Host name is required');
        }

        if (!eventData.hostEmail || eventData.hostEmail.trim().length === 0) {
            errors.push('Host email is required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (eventData.hostEmail && !emailRegex.test(eventData.hostEmail)) {
            errors.push('Host email must be a valid email address');
        }

        // Validate date format
        if (eventData.date && isNaN(Date.parse(eventData.date))) {
            errors.push('Event date must be a valid date');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get event statistics
     */
    async getEventStats(eventId) {
        try {
            const event = await this.getEvent(eventId);
            if (!event) {
                return null;
            }

            // In a real implementation, you'd count RSVP responses from Google Drive
            const stats = {
                eventId: eventId,
                totalInvites: 0, // Would be calculated from generated invites
                totalResponses: 0, // Would be calculated from RSVP submissions
                attending: 0,
                notAttending: 0,
                maybe: 0,
                totalGuests: 0
            };

            return stats;
        } catch (error) {
            console.error(`❌ Failed to get event stats for ${eventId}:`, error.message);
            return null;
        }
    }
}

module.exports = EventService;
