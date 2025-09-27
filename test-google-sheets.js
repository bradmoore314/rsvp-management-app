/**
 * Test Google Sheets Integration
 * 
 * This script tests the Google Sheets integration for RSVP form submissions
 */

const { googleSheetsService } = require('./services/sharedServices');

class GoogleSheetsTester {
    constructor() {
        this.googleSheets = googleSheetsService;
        this.testEventId = null;
        this.testSpreadsheetId = null;
    }

    async runAllTests() {
        console.log('🧪 Starting Google Sheets Integration Tests...\n');
        
        try {
            await this.testGoogleSheetsInitialization();
            await this.testCreateSpreadsheet();
            await this.testAddRSVPResponse();
            await this.testGetRSVPResponses();
            console.log('\n✅ All Google Sheets tests passed!');
        } catch (error) {
            console.error('\n❌ Test suite failed:', error.message);
        }
    }

    async testGoogleSheetsInitialization() {
        console.log('🔧 Test 1: Google Sheets Initialization');
        try {
            if (!this.googleSheets.isReady()) {
                await this.googleSheets.initialize();
            }
            console.log('✅ Google Sheets API initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Google Sheets API:', error.message);
            throw error;
        }
    }

    async testCreateSpreadsheet() {
        console.log('\n📊 Test 2: Create RSVP Spreadsheet');
        try {
            const eventData = {
                id: 'test-event-' + Date.now(),
                name: 'Test Event for Google Sheets',
                date: '2025-09-27',
                time: '19:00',
                location: 'Test Venue',
                hostEmail: 'test@example.com'
            };

            const result = await this.googleSheets.createRSVPSpreadsheet(eventData);
            this.testEventId = eventData.id;
            this.testSpreadsheetId = result.spreadsheetId;
            
            console.log(`✅ Created spreadsheet: ${result.title}`);
            console.log(`   - Spreadsheet ID: ${result.spreadsheetId}`);
            console.log(`   - Spreadsheet URL: ${result.spreadsheetUrl}`);
        } catch (error) {
            console.error('❌ Failed to create spreadsheet:', error.message);
            throw error;
        }
    }

    async testAddRSVPResponse() {
        console.log('\n📝 Test 3: Add RSVP Response');
        if (!this.testSpreadsheetId) {
            console.log('Skipping RSVP response test: No spreadsheet ID available.');
            return;
        }
        
        try {
            const rsvpData = {
                timestamp: new Date().toISOString(),
                guestName: 'Test Guest',
                guestEmail: 'testguest@example.com',
                attendance: 'attending',
                guestCount: '2',
                dietaryRestrictions: ['Vegetarian', 'No Nuts'],
                message: 'Looking forward to the event!',
                inviteId: 'test-invite-' + Date.now()
            };

            const result = await this.googleSheets.addRSVPResponse(this.testSpreadsheetId, rsvpData);
            console.log('✅ Added RSVP response successfully');
            console.log(`   - Guest: ${rsvpData.guestName}`);
            console.log(`   - Attendance: ${rsvpData.attendance}`);
            console.log(`   - Guest Count: ${rsvpData.guestCount}`);
        } catch (error) {
            console.error('❌ Failed to add RSVP response:', error.message);
            throw error;
        }
    }

    async testGetRSVPResponses() {
        console.log('\n📋 Test 4: Get RSVP Responses');
        if (!this.testSpreadsheetId) {
            console.log('Skipping get responses test: No spreadsheet ID available.');
            return;
        }
        
        try {
            const responses = await this.googleSheets.getRSVPResponses(this.testSpreadsheetId);
            console.log(`✅ Retrieved ${responses.length} rows from spreadsheet`);
            console.log(`   - Headers: ${responses[0] ? responses[0].join(', ') : 'No data'}`);
            if (responses.length > 1) {
                console.log(`   - First response: ${responses[1].join(', ')}`);
            }
        } catch (error) {
            console.error('❌ Failed to get RSVP responses:', error.message);
            throw error;
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new GoogleSheetsTester();
    tester.runAllTests();
}

module.exports = GoogleSheetsTester;






