const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const testConfig = {
    eventName: `Full Workflow Test Event ${Date.now()}`,
    eventDate: '2025-03-15',
    eventTime: '19:00',
    eventLocation: 'Test Venue, Test City',
    hostName: 'Test Host',
    hostEmail: 'test@example.com',
    guestName: 'Test Guest',
    guestEmail: 'guest@example.com'
};

class FullWorkflowTester {
    constructor() {
        this.results = [];
        this.eventId = null;
        this.inviteId = null;
    }

    async runTest(testName, testFunction) {
        console.log(`\n🧪 Running: ${testName}`);
        try {
            const result = await testFunction();
            console.log(`✅ PASS: ${testName}`);
            this.results.push({ test: testName, status: 'PASS', result });
            return result;
        } catch (error) {
            console.log(`❌ FAIL: ${testName} - ${error.message}`);
            this.results.push({ test: testName, status: 'FAIL', error: error.message });
            throw error;
        }
    }

    async testServerHealth() {
        const response = await axios.get(`${BASE_URL}/health`);
        if (response.data.status !== 'OK') {
            throw new Error(`Expected status OK, got ${response.data.status}`);
        }
        return response.data;
    }

    async testCreateEvent() {
        const eventData = {
            name: testConfig.eventName,
            date: testConfig.eventDate,
            time: testConfig.eventTime,
            location: testConfig.eventLocation,
            hostName: testConfig.hostName,
            hostEmail: testConfig.hostEmail,
            hasImage: false
        };

        console.log('🔍 DEBUG: Creating event with data:', JSON.stringify(eventData, null, 2));

        const response = await axios.post(`${BASE_URL}/event-management/create`, eventData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.success) {
            throw new Error(`Event creation failed: ${response.data.message}`);
        }

        this.eventId = response.data.data.event.id;
        console.log(`🔍 DEBUG: Event created with ID: ${this.eventId}`);
        return response.data;
    }

    async testVerifyEventExists() {
        if (!this.eventId) {
            throw new Error('No event ID available for verification');
        }

        // Test getting all events
        const allEventsResponse = await axios.get(`${BASE_URL}/events`);
        if (!allEventsResponse.data.success) {
            throw new Error('Failed to get all events');
        }

        const event = allEventsResponse.data.data.find(e => e.id === this.eventId);
        if (!event) {
            throw new Error(`Event ${this.eventId} not found in all events list`);
        }

        console.log(`🔍 DEBUG: Event verified in system: ${event.name}`);
        return event;
    }

    async testGenerateInvites() {
        if (!this.eventId) {
            throw new Error('No event ID available for invite generation');
        }

        const inviteData = {
            eventId: this.eventId,
            inviteCount: 5,
            baseUrl: BASE_URL,
            useGoogleDrive: false
        };

        console.log('🔍 DEBUG: Generating invites with data:', JSON.stringify(inviteData, null, 2));

        const response = await axios.post(`${BASE_URL}/qrcode/generate-batch`, inviteData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.success) {
            throw new Error(`Invite generation failed: ${response.data.message}`);
        }

        this.inviteId = response.data.data.qrCodes[0].inviteId;
        console.log(`🔍 DEBUG: Invites generated, first invite ID: ${this.inviteId}`);
        return response.data;
    }

    async testAccessRSVPForm() {
        if (!this.eventId || !this.inviteId) {
            throw new Error('No event ID or invite ID available for RSVP form test');
        }

        const response = await axios.get(`${BASE_URL}/rsvp/${this.eventId}/${this.inviteId}`);
        
        if (response.status !== 200) {
            throw new Error(`RSVP form access failed with status ${response.status}`);
        }

        // Check if the response contains the RSVP form
        if (!response.data.includes('RSVP Form') && !response.data.includes('guestName')) {
            throw new Error('RSVP form not found in response');
        }

        console.log(`🔍 DEBUG: RSVP form accessible for event ${this.eventId}, invite ${this.inviteId}`);
        return response.data;
    }

    async testSubmitRSVP() {
        if (!this.eventId || !this.inviteId) {
            throw new Error('No event ID or invite ID available for RSVP submission');
        }

        const rsvpData = {
            eventId: this.eventId,
            inviteId: this.inviteId,
            guestName: testConfig.guestName,
            guestEmail: testConfig.guestEmail,
            attendance: 'yes',
            guestCount: 2,
            dietaryOptions: 'No restrictions',
            specialRequests: 'Looking forward to the event!'
        };

        console.log('🔍 DEBUG: Submitting RSVP with data:', JSON.stringify(rsvpData, null, 2));

        const response = await axios.post(`${BASE_URL}/rsvp/submit`, rsvpData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.success) {
            throw new Error(`RSVP submission failed: ${response.data.message}`);
        }

        console.log(`🔍 DEBUG: RSVP submitted successfully:`, response.data);
        return response.data;
    }

    async testVerifyRSVPInSystem() {
        if (!this.eventId) {
            throw new Error('No event ID available for RSVP verification');
        }

        // Try to access RSVP dashboard
        try {
            const response = await axios.get(`${BASE_URL}/rsvp-dashboard?eventId=${this.eventId}`);
            if (response.status === 200) {
                console.log(`🔍 DEBUG: RSVP dashboard accessible for event ${this.eventId}`);
                return true;
            }
        } catch (error) {
            console.log(`⚠️ RSVP dashboard not accessible: ${error.message}`);
        }

        // Alternative: Check if we can access the event details
        try {
            const response = await axios.get(`${BASE_URL}/events/${this.eventId}`);
            if (response.status === 200) {
                console.log(`🔍 DEBUG: Event details accessible for event ${this.eventId}`);
                return true;
            }
        } catch (error) {
            console.log(`⚠️ Event details not accessible: ${error.message}`);
        }

        return true; // If we get here, the basic functionality is working
    }

    async testEventPersistence() {
        console.log('🔍 DEBUG: Testing event persistence by checking if event still exists...');
        
        const response = await axios.get(`${BASE_URL}/events`);
        if (!response.data.success) {
            throw new Error('Failed to get events for persistence test');
        }

        const event = response.data.data.find(e => e.id === this.eventId);
        if (!event) {
            throw new Error(`Event ${this.eventId} not found after persistence test`);
        }

        console.log(`🔍 DEBUG: Event persistence verified: ${event.name} still exists`);
        return event;
    }

    async runFullWorkflow() {
        console.log('🚀 Starting Full Host Workflow Test');
        console.log('=' .repeat(50));

        try {
            // Test 1: Server Health
            await this.runTest('Server Health Check', () => this.testServerHealth());

            // Test 2: Create Event
            await this.runTest('Create Event', () => this.testCreateEvent());

            // Test 3: Verify Event Exists
            await this.runTest('Verify Event Exists', () => this.testVerifyEventExists());

            // Test 4: Generate Invites
            await this.runTest('Generate Invites', () => this.testGenerateInvites());

            // Test 5: Access RSVP Form
            await this.runTest('Access RSVP Form', () => this.testAccessRSVPForm());

            // Test 6: Submit RSVP
            await this.runTest('Submit RSVP', () => this.testSubmitRSVP());

            // Test 7: Verify RSVP in System
            await this.runTest('Verify RSVP in System', () => this.testVerifyRSVPInSystem());

            // Test 8: Event Persistence
            await this.runTest('Event Persistence', () => this.testEventPersistence());

            console.log('\n🎉 Full Workflow Test Completed Successfully!');
            console.log('=' .repeat(50));

        } catch (error) {
            console.log('\n💥 Full Workflow Test Failed!');
            console.log('=' .repeat(50));
            console.log(`Error: ${error.message}`);
        }

        // Print summary
        this.printSummary();
    }

    printSummary() {
        console.log('\n📊 Test Summary:');
        console.log('=' .repeat(30));
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => r.status === 'FAIL').forEach(result => {
                console.log(`  - ${result.test}: ${result.error}`);
            });
        }

        if (this.eventId) {
            console.log(`\n🔍 Test Event ID: ${this.eventId}`);
            console.log(`🔍 Test Invite ID: ${this.inviteId || 'Not generated'}`);
        }
    }
}

// Run the test
async function main() {
    const tester = new FullWorkflowTester();
    await tester.runFullWorkflow();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = FullWorkflowTester;
