#!/usr/bin/env node

/**
 * Comprehensive RSVP Test Script
 * Tests the complete RSVP flow: create event, generate invites, submit RSVP, view responses
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_EVENT = {
    name: 'RSVP Test Event - Complete Flow',
    date: '2025-03-15',
    time: '19:00',
    location: 'Test Venue, Test City',
    description: 'Testing the complete RSVP flow',
    hasImage: false
};

const TEST_RSVP = {
    guestName: 'Test Guest',
    guestEmail: 'testguest@example.com',
    attendance: 'yes',
    guestCount: 2,
    guestPhone: '+1-555-0123',
    dietaryRestrictions: 'Vegetarian',
    message: 'Looking forward to the event!'
};

class RSVPTestSuite {
    constructor() {
        this.results = [];
        this.eventId = null;
        this.inviteId = null;
        this.rsvpId = null;
    }

    async runTest(testName, testFunction) {
        try {
            console.log(`\n🧪 Running: ${testName}`);
            const result = await testFunction();
            this.results.push({ test: testName, status: 'PASS', result });
            console.log(`✅ ${testName}: PASS`);
            return result;
        } catch (error) {
            this.results.push({ test: testName, status: 'FAIL', error: error.message });
            console.log(`❌ ${testName}: FAIL - ${error.message}`);
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
        const response = await axios.post(`${BASE_URL}/event-management/create`, TEST_EVENT);
        if (!response.data.success) {
            throw new Error(`Event creation failed: ${response.data.message}`);
        }
        this.eventId = response.data.data.event.id;
        console.log(`📝 Created event: ${this.eventId}`);
        return response.data;
    }

    async testGenerateInvites() {
        const response = await axios.post(`${BASE_URL}/qrcode/generate-batch`, {
            eventId: this.eventId,
            count: 3
        });
        if (!response.data.success) {
            throw new Error(`Invite generation failed: ${response.data.message}`);
        }
        this.inviteId = response.data.data.qrCodes[0].inviteId;
        console.log(`🎫 Generated invites, using invite: ${this.inviteId}`);
        return response.data;
    }

    async testRSVPFormAccess() {
        const response = await axios.get(`${BASE_URL}/rsvp/${this.inviteId}`);
        if (response.status !== 200) {
            throw new Error(`RSVP form not accessible: ${response.status}`);
        }
        return response.data;
    }

    async testSubmitRSVP() {
        const rsvpData = {
            ...TEST_RSVP,
            eventId: this.eventId,
            inviteId: this.inviteId
        };

        const response = await axios.post(`${BASE_URL}/rsvp/submit`, rsvpData);
        if (!response.data.success) {
            throw new Error(`RSVP submission failed: ${response.data.message}`);
        }
        this.rsvpId = response.data.data.id;
        console.log(`📝 Submitted RSVP: ${this.rsvpId}`);
        return response.data;
    }

    async testRSVPStats() {
        const response = await axios.get(`${BASE_URL}/rsvp-management/stats/${this.eventId}`);
        if (!response.data.success) {
            throw new Error(`RSVP stats failed: ${response.data.message}`);
        }
        console.log(`📊 RSVP Stats:`, response.data.data);
        return response.data;
    }

    async testRSVPResponses() {
        const response = await axios.get(`${BASE_URL}/rsvp-management/responses/${this.eventId}`);
        if (!response.data.success) {
            throw new Error(`RSVP responses failed: ${response.data.message}`);
        }
        console.log(`📋 RSVP Responses: ${response.data.count} found`);
        return response.data;
    }

    async testViewRSVPsModal() {
        // Test the modal functionality by calling the same endpoints the modal would call
        const [statsResponse, responsesResponse] = await Promise.all([
            axios.get(`${BASE_URL}/rsvp-management/stats/${this.eventId}`),
            axios.get(`${BASE_URL}/rsvp-management/responses/${this.eventId}`)
        ]);

        if (!statsResponse.data.success || !responsesResponse.data.success) {
            throw new Error('Modal data endpoints failed');
        }

        console.log(`🎭 Modal data: Stats=${statsResponse.data.success}, Responses=${responsesResponse.data.success}`);
        return { stats: statsResponse.data, responses: responsesResponse.data };
    }

    async testMultipleRSVPs() {
        const additionalRSVPs = [
            {
                guestName: 'John Doe',
                guestEmail: 'john@example.com',
                attendance: 'yes',
                guestCount: 1,
                message: 'Can\'t wait!'
            },
            {
                guestName: 'Jane Smith',
                guestEmail: 'jane@example.com',
                attendance: 'no',
                guestCount: 1,
                message: 'Sorry, can\'t make it'
            },
            {
                guestName: 'Bob Johnson',
                guestEmail: 'bob@example.com',
                attendance: 'maybe',
                guestCount: 3,
                message: 'Will confirm closer to the date'
            }
        ];

        const results = [];
        for (const rsvp of additionalRSVPs) {
            const rsvpData = {
                ...rsvp,
                eventId: this.eventId,
                inviteId: this.inviteId
            };

            const response = await axios.post(`${BASE_URL}/rsvp/submit`, rsvpData);
            if (response.data.success) {
                results.push(response.data);
                console.log(`📝 Added RSVP for ${rsvp.guestName}`);
            } else {
                throw new Error(`Failed to add RSVP for ${rsvp.guestName}: ${response.data.message}`);
            }
        }

        return results;
    }

    async testFinalStats() {
        const response = await axios.get(`${BASE_URL}/rsvp-management/stats/${this.eventId}`);
        if (!response.data.success) {
            throw new Error(`Final stats failed: ${response.data.message}`);
        }
        
        const stats = response.data.data;
        console.log(`\n📊 Final Event Statistics:`);
        console.log(`   Total Responses: ${stats.totalResponses || 0}`);
        console.log(`   Attending: ${stats.attending || 0}`);
        console.log(`   Not Attending: ${stats.notAttending || 0}`);
        console.log(`   Maybe: ${stats.maybe || 0}`);
        console.log(`   Total Guests: ${stats.totalGuests || 0}`);
        console.log(`   Response Rate: ${stats.responseRate || 0}%`);
        
        return response.data;
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive RSVP Test Suite');
        console.log('=' .repeat(60));

        try {
            // Basic connectivity
            await this.runTest('Server Health Check', () => this.testServerHealth());
            
            // Event creation
            await this.runTest('Create Test Event', () => this.testCreateEvent());
            
            // Invite generation
            await this.runTest('Generate Invites', () => this.testGenerateInvites());
            
            // RSVP form access
            await this.runTest('RSVP Form Access', () => this.testRSVPFormAccess());
            
            // Submit initial RSVP
            await this.runTest('Submit Initial RSVP', () => this.testSubmitRSVP());
            
            // Check stats after first RSVP
            await this.runTest('RSVP Stats (Initial)', () => this.testRSVPStats());
            
            // Check responses after first RSVP
            await this.runTest('RSVP Responses (Initial)', () => this.testRSVPResponses());
            
            // Test modal functionality
            await this.runTest('View RSVPs Modal Data', () => this.testViewRSVPsModal());
            
            // Add multiple RSVPs
            await this.runTest('Submit Multiple RSVPs', () => this.testMultipleRSVPs());
            
            // Final comprehensive stats
            await this.runTest('Final RSVP Statistics', () => this.testFinalStats());
            
            console.log('\n' + '=' .repeat(60));
            console.log('🎉 ALL TESTS PASSED! RSVP system is working correctly.');
            console.log(`📝 Test Event ID: ${this.eventId}`);
            console.log(`🎫 Test Invite ID: ${this.inviteId}`);
            console.log(`📊 Total RSVPs submitted: ${this.results.filter(r => r.test.includes('RSVP')).length}`);
            
        } catch (error) {
            console.log('\n' + '=' .repeat(60));
            console.log('❌ TEST SUITE FAILED');
            console.log(`Error: ${error.message}`);
            this.printResults();
            process.exit(1);
        }
    }

    printResults() {
        console.log('\n📋 Test Results Summary:');
        console.log('-' .repeat(40));
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${result.test}`);
            if (result.status === 'FAIL') {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        console.log('-' .repeat(40));
        console.log(`Total: ${this.results.length} | Passed: ${passed} | Failed: ${failed}`);
    }
}

// Run the test suite
if (require.main === module) {
    const testSuite = new RSVPTestSuite();
    testSuite.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = RSVPTestSuite;
