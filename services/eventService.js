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

        // Load saved events from Google Drive
        await this.loadEventsFromDrive();
    }

    /**
     * Load all saved events from Google Drive
     */
    async loadEventsFromDrive() {
        try {
            if (!this.googleDrive.isReady()) {
                console.log('ℹ️ Google Drive not authenticated, skipping event loading');
                return;
            }

            console.log('📂 Loading saved events from Google Drive...');
            
            // Look for the events folder
            const eventsFolderName = 'RSVP-Events';
            const eventsFolder = await this.googleDrive.findFolder(eventsFolderName);
            
            if (!eventsFolder) {
                console.log('ℹ️ No events folder found, starting fresh');
                return;
            }

            // Get all files in the events folder
            const files = await this.googleDrive.listFiles(eventsFolder.id);
            
            if (!files || files.length === 0) {
                console.log('ℹ️ No event files found in events folder');
                return;
            }

            let loadedCount = 0;
            for (const file of files) {
                try {
                    // Skip non-JSON files
                    if (!file.name.endsWith('.json')) {
                        continue;
                    }

                    // Download and parse the event file
                    const eventData = await this.googleDrive.downloadFile(file.id);
                    const event = JSON.parse(eventData);
                    
                    // Validate the event data
                    if (event.id && event.name && event.date) {
                        this.events.set(event.id, event);
                        loadedCount++;
                        console.log(`✅ Loaded event: ${event.name} (${event.id})`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to load event file ${file.name}:`, error.message);
                }
            }

            console.log(`📂 Successfully loaded ${loadedCount} events from Google Drive`);
            console.log(`🔍 DEBUG: Event IDs loaded: ${Array.from(this.events.keys()).join(', ')}`);
            console.log(`🔍 DEBUG: Event names loaded: ${Array.from(this.events.values()).map(e => e.name).join(', ')}`);
            console.log(`🔍 DEBUG: Event hosts loaded: ${Array.from(this.events.values()).map(e => e.hostEmail || 'unknown').join(', ')}`);
        } catch (error) {
            console.error('❌ Failed to load events from Google Drive:', error.message);
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
                    
                    // Enhanced configuration options
                    displayOptions: {
                        showDietaryRestrictions: eventData.showDietaryRestrictions === true,
                        showDressCode: eventData.showDressCode === true,
                        showHostMessage: eventData.showHostMessage === true
                    },
                    dressCode: eventData.dressCode || '',
                    hostMessage: eventData.hostMessage || '',
                    eventCategory: eventData.eventCategory || 'General',
                    eventTags: eventData.eventTags || [],
                    
                    // Event management
                    status: eventData.status || 'active', // active, paused, cancelled
                    reminderSettings: {
                        enabled: eventData.reminderEnabled || false,
                        daysBefore: eventData.reminderDays || 7
                    },
                    
                    created: new Date().toISOString(),
                    updated: new Date().toISOString()
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
     * Get all events (for debugging)
     */
    async getAllEvents() {
        try {
            const events = Array.from(this.events.values())
                .sort((a, b) => new Date(b.created) - new Date(a.created));

            console.log(`📊 Returning ${events.length} total events from memory`);
            console.log(`🔍 DEBUG: All events in memory: ${events.map(e => `${e.name}(${e.id})`).join(', ')}`);
            return events;
        } catch (error) {
            console.error(`❌ Failed to get all events:`, error.message);
            return [];
        }
    }

    /**
     * Duplicate an existing event
     */
    async duplicateEvent(eventId, newEventData = {}) {
        try {
            const originalEvent = await this.getEvent(eventId);
            if (!originalEvent) {
                throw new Error(`Event not found: ${eventId}`);
            }

            // Create new event based on original
            const duplicatedEventData = {
                ...originalEvent,
                ...newEventData,
                name: newEventData.name || `${originalEvent.name} (Copy)`,
                date: newEventData.date || originalEvent.date,
                time: newEventData.time || originalEvent.time,
                location: newEventData.location || originalEvent.location,
                // Reset status and timestamps
                status: 'active',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };

            // Remove the original ID so a new one gets generated
            delete duplicatedEventData.id;

            return await this.createEvent(duplicatedEventData);
        } catch (error) {
            console.error('❌ Failed to duplicate event:', error.message);
            throw error;
        }
    }

    /**
     * Change event status
     */
    async changeEventStatus(eventId, status) {
        try {
            const validStatuses = ['active', 'paused', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
            }

            return await this.updateEvent(eventId, { status });
        } catch (error) {
            console.error('❌ Failed to change event status:', error.message);
            throw error;
        }
    }

    /**
     * Get events by category
     */
    async getEventsByCategory(category) {
        try {
            return Array.from(this.events.values())
                .filter(event => event.eventCategory === category)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
        } catch (error) {
            console.error(`❌ Failed to get events by category ${category}:`, error.message);
            return [];
        }
    }

    /**
     * Get events by status
     */
    async getEventsByStatus(status) {
        try {
            return Array.from(this.events.values())
                .filter(event => event.status === status)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
        } catch (error) {
            console.error(`❌ Failed to get events by status ${status}:`, error.message);
            return [];
        }
    }

    /**
     * Delete an event
     */
    async deleteEvent(eventId) {
        try {
            const event = this.events.get(eventId);
            if (!event) {
                throw new Error(`Event not found: ${eventId}`);
            }

            // Remove from memory
            this.events.delete(eventId);

            // Delete from Google Drive
            await this.deleteEventFromDrive(eventId);

            console.log(`✅ Deleted event: ${event.name} (ID: ${eventId})`);
            return true;
        } catch (error) {
            console.error('❌ Failed to delete event:', error.message);
            throw error;
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
                eventsFolder = await this.googleDrive.findFolder(eventsFolderName);
                if (!eventsFolder) {
                    eventsFolder = await this.googleDrive.createFolder(eventsFolderName);
                    console.log(`📁 Created events folder: ${eventsFolderName}`);
                }
            } catch (error) {
                console.error(`❌ Failed to create/find events folder:`, error.message);
                throw error;
            }

            // Check if event file already exists
            const fileName = `event-${event.id}.json`;
            const existingFiles = await this.googleDrive.listFiles(eventsFolder.id, fileName);
            
            const content = JSON.stringify(event, null, 2);
            
            if (existingFiles.length > 0) {
                // Update existing file
                const existingFile = existingFiles[0];
                await this.googleDrive.updateFile(existingFile.id, content);
                console.log(`✅ Updated event ${event.id} in Google Drive`);
            } else {
                // Create new file
                await this.googleDrive.createTextFile(fileName, content, eventsFolder.id);
                console.log(`✅ Stored new event ${event.id} in Google Drive`);
            }
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
            const eventsFolder = await this.googleDrive.findFolder(eventsFolderName);
            
            if (!eventsFolder) {
                return null;
            }

            const fileName = `event-${eventId}.json`;
            const eventFiles = await this.googleDrive.listFiles(eventsFolder.id, fileName);
            
            if (eventFiles.length === 0) {
                return null;
            }

            // Read the event file content
            const eventFile = eventFiles[0];
            const fileContent = await this.googleDrive.downloadFile(eventFile.id);
            
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
     * Delete event from Google Drive
     */
    async deleteEventFromDrive(eventId) {
        try {
            if (!this.googleDrive.isReady()) {
                console.log('ℹ️ Google Drive not authenticated, cannot delete from Drive');
                return;
            }

            const eventsFolderName = 'RSVP-Events';
            const eventsFolder = await this.googleDrive.findFolder(eventsFolderName);
            
            if (!eventsFolder) {
                console.log('ℹ️ Events folder not found, nothing to delete');
                return;
            }

            const fileName = `event-${eventId}.json`;
            const eventFiles = await this.googleDrive.listFiles(eventsFolder.id, fileName);
            
            if (eventFiles.length > 0) {
                const eventFile = eventFiles[0];
                await this.googleDrive.deleteFile(eventFile.id);
                console.log(`✅ Deleted event ${eventId} from Google Drive`);
            } else {
                console.log(`ℹ️ Event file ${fileName} not found in Google Drive`);
            }
        } catch (error) {
            console.error(`❌ Failed to delete event from Google Drive:`, error.message);
            throw error;
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
