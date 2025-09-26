const { google } = require('googleapis');

class GoogleSheetsService {
    constructor(googleDriveService = null) {
        this.sheets = null;
        this.initialized = false;
        this.spreadsheetId = null;
        this.googleDriveService = googleDriveService;
    }

    /**
     * Initialize Google Sheets API
     */
    async initialize(googleDriveService = null) {
        try {
            // Use provided service or the one from constructor
            const driveService = googleDriveService || this.googleDriveService;
            
            if (!driveService || !driveService.isReady()) {
                throw new Error('Google Drive service not ready');
            }

            // Use the same OAuth2 client as Google Drive
            this.sheets = google.sheets({ version: 'v4', auth: driveService.oauth2Client });
            this.initialized = true;
            
            console.log('✅ Google Sheets API initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Google Sheets API:', error.message);
            throw error;
        }
    }

    /**
     * Check if the service is ready
     */
    isReady() {
        return this.initialized && this.sheets !== null;
    }

    /**
     * Create a new spreadsheet for RSVP tracking
     */
    async createRSVPSpreadsheet(eventData) {
        try {
            if (!this.isReady()) {
                await this.initialize();
            }

            const spreadsheetTitle = `RSVP Responses - ${eventData.name} (${eventData.date})`;
            
            const request = {
                resource: {
                    properties: {
                        title: spreadsheetTitle
                    },
                    sheets: [{
                        properties: {
                            title: 'Event Info',
                            gridProperties: {
                                rowCount: 10,
                                columnCount: 4
                            }
                        }
                    }]
                }
            };

            const response = await this.sheets.spreadsheets.create(request);
            this.spreadsheetId = response.data.spreadsheetId;

            // Add event information
            await this.addEventInfo(eventData);

            // Create the main RSVP responses sheet
            await this.createRSVPResponsesSheet();

            console.log(`✅ Created RSVP spreadsheet: ${spreadsheetTitle} (ID: ${this.spreadsheetId})`);
            
            return {
                spreadsheetId: this.spreadsheetId,
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
                title: spreadsheetTitle
            };
        } catch (error) {
            console.error('❌ Failed to create RSVP spreadsheet:', error.message);
            throw error;
        }
    }

    /**
     * Add event information to the spreadsheet
     */
    async addEventInfo(eventData) {
        try {
            const values = [
                ['Event Information', '', '', ''],
                ['Event Name', eventData.name, '', ''],
                ['Event Date', eventData.date, '', ''],
                ['Event Time', eventData.time, '', ''],
                ['Event Location', eventData.location, '', ''],
                ['Event ID', eventData.id, '', ''],
                ['Created', new Date().toISOString(), '', ''],
                ['', '', '', ''],
                ['RSVP Responses', '', '', '']
            ];

            const request = {
                spreadsheetId: this.spreadsheetId,
                range: 'Event Info!A1:D9',
                valueInputOption: 'RAW',
                resource: {
                    values: values
                }
            };

            await this.sheets.spreadsheets.values.update(request);
        } catch (error) {
            console.error('❌ Failed to add event info:', error.message);
            throw error;
        }
    }

    /**
     * Create the main RSVP responses sheet
     */
    async createRSVPResponsesSheet() {
        try {
            const request = {
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'RSVP Responses',
                                gridProperties: {
                                    rowCount: 1000,
                                    columnCount: 8
                                }
                            }
                        }
                    }]
                }
            };

            const addSheetResponse = await this.sheets.spreadsheets.batchUpdate(request);
            const newSheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;

            // Add headers
            const headers = [
                'Timestamp', 'Guest Name', 'Guest Email', 'Attendance', 
                'Guest Count', 'Dietary Restrictions', 'Message', 'Invite ID'
            ];

            const headerRequest = {
                spreadsheetId: this.spreadsheetId,
                range: 'RSVP Responses!A1:H1',
                valueInputOption: 'RAW',
                resource: {
                    values: [headers]
                }
            };

            await this.sheets.spreadsheets.values.update(headerRequest);

            // Format headers
            const formatRequest = {
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [{
                        repeatCell: {
                            range: {
                                sheetId: newSheetId, // Use the actual sheet ID
                                startRowIndex: 0,
                                endRowIndex: 1,
                                startColumnIndex: 0,
                                endColumnIndex: 8
                            },
                            cell: {
                                userEnteredFormat: {
                                    textFormat: {
                                        bold: true
                                    },
                                    backgroundColor: {
                                        red: 0.9,
                                        green: 0.9,
                                        blue: 0.9
                                    }
                                }
                            },
                            fields: 'userEnteredFormat(textFormat,backgroundColor)'
                        }
                    }]
                }
            };

            await this.sheets.spreadsheets.batchUpdate(formatRequest);
        } catch (error) {
            console.error('❌ Failed to create RSVP responses sheet:', error.message);
            throw error;
        }
    }

    /**
     * Add RSVP response to the spreadsheet
     */
    async addRSVPResponse(spreadsheetId, rsvpData) {
        try {
            if (!this.isReady()) {
                await this.initialize();
            }

            const values = [[
                rsvpData.timestamp,
                rsvpData.guestName,
                rsvpData.guestEmail,
                rsvpData.attendance,
                rsvpData.guestCount,
                rsvpData.dietaryRestrictions ? rsvpData.dietaryRestrictions.join(', ') : '',
                rsvpData.message,
                rsvpData.inviteId
            ]];

            const request = {
                spreadsheetId: spreadsheetId,
                range: 'RSVP Responses!A:H',
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: values
                }
            };

            const response = await this.sheets.spreadsheets.values.append(request);
            
            console.log(`✅ Added RSVP response to spreadsheet ${spreadsheetId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to add RSVP response:', error.message);
            throw error;
        }
    }

    /**
     * Get RSVP responses from the spreadsheet
     */
    async getRSVPResponses(spreadsheetId) {
        try {
            if (!this.isReady()) {
                await this.initialize();
            }

            const request = {
                spreadsheetId: spreadsheetId,
                range: 'RSVP Responses!A:H'
            };

            const response = await this.sheets.spreadsheets.values.get(request);
            return response.data.values || [];
        } catch (error) {
            console.error('❌ Failed to get RSVP responses:', error.message);
            throw error;
        }
    }
}

module.exports = GoogleSheetsService;
