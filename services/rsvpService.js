const GoogleDriveService = require('./googleDrive');
const GoogleSheetsService = require('./googleSheetsService');
const { v4: uuidv4 } = require('uuid');

class RSVPService {
    constructor() {
        this.googleDrive = new GoogleDriveService();
        this.googleSheets = new GoogleSheetsService();
        this.rsvpResponses = new Map(); // In-memory cache for RSVP responses
        this.eventSpreadsheets = new Map(); // Cache for event spreadsheet IDs
    }

    /**
     * Initialize the RSVP service
     */
    async initialize() {
        await this.googleDrive.initialize();
        
        // Try to load saved tokens
        const savedTokens = await this.googleDrive.loadTokens();
        if (savedTokens) {
            await this.googleDrive.setCredentialsFromTokens(savedTokens);
        }

        // Initialize Google Sheets service
        if (this.googleDrive.isReady()) {
            await this.googleSheets.initialize(this.googleDrive);
        }
    }

    /**
     * Submit an RSVP response
     */
    async submitRSVP(rsvpData) {
        try {
            // Validate RSVP data
            const validation = this.validateRSVPData(rsvpData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Generate unique RSVP ID
            const rsvpId = uuidv4();
            
            // Create RSVP response object
            const rsvpResponse = {
                id: rsvpId,
                eventId: rsvpData.eventId,
                inviteId: rsvpData.inviteId,
                guestName: rsvpData.guestName,
                guestEmail: rsvpData.guestEmail,
                guestPhone: rsvpData.guestPhone || '',
                emergencyContact: rsvpData.emergencyContact || '',
                attendance: rsvpData.attendance,
                guestCount: rsvpData.guestCount || 1,
                dietaryOptions: rsvpData.dietaryOptions || [],
                dietaryRestrictions: rsvpData.dietaryRestrictions || '',
                message: rsvpData.message || '',
                submittedAt: new Date().toISOString(),
                ipAddress: rsvpData.ipAddress || null,
                userAgent: rsvpData.userAgent || null
            };

            // Store in memory cache
            this.rsvpResponses.set(rsvpId, rsvpResponse);

            // Store in Google Sheets if authenticated
            if (this.googleSheets.isReady()) {
                try {
                    await this.storeRSVPInSheets(rsvpResponse);
                } catch (error) {
                    console.log('ℹ️ Could not store RSVP in Google Sheets, storing in memory only:', error.message);
                }
            }

            console.log(`✅ RSVP submitted: ${rsvpResponse.guestName} for event ${rsvpResponse.eventId}`);
            return rsvpResponse;
        } catch (error) {
            console.error('❌ Failed to submit RSVP:', error.message);
            throw error;
        }
    }

    /**
     * Get RSVP responses for an event
     */
    async getRSVPResponses(eventId) {
        try {
            // Try to get responses from Google Sheets first
            if (this.googleSheets.isReady()) {
                const spreadsheetId = this.eventSpreadsheets.get(eventId);
                if (spreadsheetId) {
                    try {
                        const sheetData = await this.googleSheets.getRSVPResponses(spreadsheetId);
                        // Convert sheet data to RSVP response format
                        const responses = sheetData.slice(1).map(row => ({
                            id: `sheet-${row[7]}-${row[0]}`, // Use invite ID and timestamp as ID
                            eventId: eventId,
                            inviteId: row[7],
                            guestName: row[1],
                            guestEmail: row[2],
                            attendance: row[3],
                            guestCount: parseInt(row[4]) || 1,
                            dietaryOptions: row[5] ? row[5].split(', ') : [],
                            dietaryRestrictions: row[5] || '',
                            message: row[6] || '',
                            submittedAt: row[0]
                        }));
                        
                        console.log(`✅ Retrieved ${responses.length} RSVP responses from Google Sheets for event ${eventId}`);
                        return responses;
                    } catch (error) {
                        console.log(`ℹ️ Could not retrieve from Google Sheets, using memory cache: ${error.message}`);
                    }
                }
            }

            // Fallback to memory cache
            const responses = Array.from(this.rsvpResponses.values())
                .filter(response => response.eventId === eventId)
                .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

            return responses;
        } catch (error) {
            console.error(`❌ Failed to get RSVP responses for event ${eventId}:`, error.message);
            return [];
        }
    }

    /**
     * Get RSVP response by ID
     */
    async getRSVPResponse(rsvpId) {
        try {
            return this.rsvpResponses.get(rsvpId) || null;
        } catch (error) {
            console.error(`❌ Failed to get RSVP response ${rsvpId}:`, error.message);
            return null;
        }
    }

    /**
     * Get RSVP statistics for an event
     */
    async getRSVPStats(eventId) {
        try {
            const responses = await this.getRSVPResponses(eventId);
            
            const stats = {
                eventId: eventId,
                totalResponses: responses.length,
                attending: responses.filter(r => r.attendance === 'yes').length,
                notAttending: responses.filter(r => r.attendance === 'no').length,
                maybe: responses.filter(r => r.attendance === 'maybe').length,
                totalGuests: responses.reduce((sum, r) => sum + r.guestCount, 0),
                dietaryOptions: this.getDietaryStats(responses),
                responses: responses
            };

            return stats;
        } catch (error) {
            console.error(`❌ Failed to get RSVP stats for event ${eventId}:`, error.message);
            return null;
        }
    }

    /**
     * Store RSVP response in Google Sheets
     */
    async storeRSVPInSheets(rsvpResponse) {
        try {
            if (!this.googleSheets.isReady()) {
                console.log('ℹ️ Google Sheets not authenticated, storing in memory only');
                return;
            }

            // Get or create spreadsheet for this event
            let spreadsheetId = this.eventSpreadsheets.get(rsvpResponse.eventId);
            
            if (!spreadsheetId) {
                // Create a new spreadsheet for this event
                const eventData = {
                    id: rsvpResponse.eventId,
                    name: rsvpResponse.eventName || 'Unknown Event',
                    date: rsvpResponse.eventDate || new Date().toISOString().split('T')[0],
                    time: rsvpResponse.eventTime || '',
                    location: rsvpResponse.eventLocation || ''
                };

                const spreadsheet = await this.googleSheets.createRSVPSpreadsheet(eventData);
                spreadsheetId = spreadsheet.spreadsheetId;
                this.eventSpreadsheets.set(rsvpResponse.eventId, spreadsheetId);
                
                console.log(`✅ Created new Google Sheet for event ${rsvpResponse.eventId}: ${spreadsheet.spreadsheetUrl}`);
            }

            // Add the RSVP response to the spreadsheet
            await this.googleSheets.addRSVPResponse(spreadsheetId, {
                timestamp: rsvpResponse.submittedAt,
                guestName: rsvpResponse.guestName,
                guestEmail: rsvpResponse.guestEmail,
                guestPhone: rsvpResponse.guestPhone,
                emergencyContact: rsvpResponse.emergencyContact,
                attendance: rsvpResponse.attendance,
                guestCount: rsvpResponse.guestCount,
                dietaryRestrictions: rsvpResponse.dietaryOptions || [],
                message: rsvpResponse.message,
                inviteId: rsvpResponse.inviteId
            });

            console.log(`✅ Stored RSVP response ${rsvpResponse.id} in Google Sheets`);
        } catch (error) {
            console.error(`❌ Failed to store RSVP response in Google Sheets:`, error.message);
            throw error;
        }
    }

    /**
     * Store RSVP response in Google Drive (legacy method - kept for compatibility)
     */
    async storeRSVPInDrive(rsvpResponse) {
        try {
            if (!this.googleDrive.isReady()) {
                console.log('ℹ️ Google Drive not authenticated, storing in memory only');
                return;
            }

            // Create event folder if it doesn't exist
            const eventFolderName = `RSVP-Event-${rsvpResponse.eventId}`;
            let eventFolder;
            
            try {
                eventFolder = await this.googleDrive.createFolder(eventFolderName);
            } catch (error) {
                // Folder might already exist, try to find it
                const files = await this.googleDrive.listFiles(null, eventFolderName);
                const existingFolder = files.find(file => file.name === eventFolderName);
                if (existingFolder) {
                    eventFolder = existingFolder;
                } else {
                    throw error;
                }
            }

            // Create RSVP response file
            const timestamp = rsvpResponse.submittedAt.replace(/[:.]/g, '-');
            const fileName = `rsvp-${rsvpResponse.id}-${timestamp}.json`;
            const content = JSON.stringify(rsvpResponse, null, 2);

            await this.googleDrive.createTextFile(fileName, content, eventFolder.id);
            console.log(`✅ Stored RSVP response ${rsvpResponse.id} in Google Drive`);
        } catch (error) {
            console.error(`❌ Failed to store RSVP response in Google Drive:`, error.message);
            throw error;
        }
    }

    /**
     * Load RSVP responses from Google Drive
     */
    async loadRSVPResponsesFromDrive(eventId) {
        try {
            if (!this.googleDrive.isReady()) {
                return [];
            }

            const eventFolderName = `RSVP-Event-${eventId}`;
            const files = await this.googleDrive.listFiles(null, eventFolderName);
            const eventFolder = files.find(file => file.name === eventFolderName);
            
            if (!eventFolder) {
                return [];
            }

            const rsvpFiles = await this.googleDrive.listFiles(eventFolder.id, 'rsvp-');
            
            // For now, we'll return the file list since we can't easily read file contents
            // In a real implementation, you'd read each file and parse the JSON
            console.log(`ℹ️ Found ${rsvpFiles.length} RSVP response files for event ${eventId} in Google Drive`);
            return rsvpFiles;
        } catch (error) {
            console.error(`❌ Failed to load RSVP responses from Google Drive:`, error.message);
            return [];
        }
    }

    /**
     * Validate RSVP data
     */
    validateRSVPData(rsvpData) {
        const errors = [];

        if (!rsvpData.eventId || rsvpData.eventId.trim().length === 0) {
            errors.push('Event ID is required');
        }

        if (!rsvpData.inviteId || rsvpData.inviteId.trim().length === 0) {
            errors.push('Invite ID is required');
        }

        if (!rsvpData.guestName || rsvpData.guestName.trim().length === 0) {
            errors.push('Guest name is required');
        }

        if (!rsvpData.guestEmail || rsvpData.guestEmail.trim().length === 0) {
            errors.push('Guest email is required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (rsvpData.guestEmail && !emailRegex.test(rsvpData.guestEmail)) {
            errors.push('Guest email must be a valid email address');
        }

        if (!rsvpData.attendance || !['yes', 'no', 'maybe'].includes(rsvpData.attendance)) {
            errors.push('Attendance status is required and must be yes, no, or maybe');
        }

        if (rsvpData.guestCount && (isNaN(rsvpData.guestCount) || rsvpData.guestCount < 1 || rsvpData.guestCount > 20)) {
            errors.push('Guest count must be a number between 1 and 20');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get dietary statistics
     */
    getDietaryStats(responses) {
        const dietaryStats = {};
        
        responses.forEach(response => {
            if (response.dietaryOptions && response.dietaryOptions.length > 0) {
                response.dietaryOptions.forEach(option => {
                    dietaryStats[option] = (dietaryStats[option] || 0) + 1;
                });
            }
        });

        return dietaryStats;
    }

    /**
     * Export RSVP data for an event
     */
    async exportRSVPData(eventId, format = 'json') {
        try {
            const responses = await this.getRSVPResponses(eventId);
            
            if (format === 'csv') {
                return this.convertToCSV(responses);
            } else {
                return JSON.stringify(responses, null, 2);
            }
        } catch (error) {
            console.error(`❌ Failed to export RSVP data for event ${eventId}:`, error.message);
            throw error;
        }
    }

    /**
     * Convert RSVP responses to CSV format
     */
    convertToCSV(responses) {
        if (responses.length === 0) {
            return 'No RSVP responses found';
        }

        const headers = [
            'ID', 'Event ID', 'Invite ID', 'Guest Name', 'Guest Email', 
            'Attendance', 'Guest Count', 'Dietary Options', 'Dietary Restrictions', 
            'Message', 'Submitted At'
        ];

        const csvRows = [headers.join(',')];

        responses.forEach(response => {
            const row = [
                response.id,
                response.eventId,
                response.inviteId,
                `"${response.guestName}"`,
                response.guestEmail,
                response.attendance,
                response.guestCount,
                `"${(response.dietaryOptions || []).join('; ')}"`,
                `"${response.dietaryRestrictions}"`,
                `"${response.message}"`,
                response.submittedAt
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.googleDrive.initialized && this.googleSheets.isReady();
    }
}

module.exports = RSVPService;




