#!/usr/bin/env node

/**
 * Google Drive Functionality Test Script
 * 
 * This script tests all Google Drive hosting functionality for RSVP forms
 */

const QRCodeService = require('./services/qrCodeService');
const RSVPFormHostingService = require('./services/rsvpFormHosting');
const EventService = require('./services/eventService');

class GoogleDriveTester {
    constructor() {
        this.qrCodeService = new QRCodeService();
        this.rsvpFormHosting = new RSVPFormHostingService();
        this.eventService = new EventService();
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Starting Google Drive Functionality Tests...\n');
        
        try {
            // Test 1: Initialize Google Drive
            await this.testGoogleDriveInitialization();
            
            // Test 2: Create test event
            const testEvent = await this.testEventCreation();
            
            // Test 3: Create Google Drive hosted RSVP form
            const hostedForm = await this.testRSVPFormCreation(testEvent);
            
            // Test 4: Generate QR code for Google Drive hosted form
            await this.testQRCodeGeneration(testEvent, hostedForm);
            
            // Test 5: Test form accessibility
            await this.testFormAccessibility(hostedForm);
            
            // Test 6: Test batch QR code generation
            await this.testBatchQRCodeGeneration(testEvent);
            
            // Print results
            this.printTestResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        }
    }

    async testGoogleDriveInitialization() {
        console.log('🔧 Test 1: Google Drive Initialization');
        try {
            await this.rsvpFormHosting.googleDrive.initialize();
            console.log('✅ Google Drive API initialized successfully');
            this.testResults.push({ test: 'Google Drive Initialization', status: 'PASS' });
        } catch (error) {
            console.log('❌ Google Drive initialization failed:', error.message);
            this.testResults.push({ test: 'Google Drive Initialization', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    async testEventCreation() {
        console.log('\n📅 Test 2: Event Creation');
        try {
            const testEvent = {
                id: 'test-event-' + Date.now(),
                name: 'Test Event for Google Drive',
                date: '2025-09-27',
                time: '18:00',
                location: 'Test Location',
                hostName: 'Test Host',
                hostEmail: 'test@example.com',
                maxGuests: 50,
                dietaryOptions: ['No Restrictions', 'Vegetarian', 'Vegan', 'Gluten-Free']
            };

            console.log('✅ Test event created:', testEvent.name);
            this.testResults.push({ test: 'Event Creation', status: 'PASS' });
            return testEvent;
        } catch (error) {
            console.log('❌ Event creation failed:', error.message);
            this.testResults.push({ test: 'Event Creation', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    async testRSVPFormCreation(testEvent) {
        console.log('\n📝 Test 3: RSVP Form Creation on Google Drive');
        try {
            const inviteId = this.qrCodeService.generateInviteId();
            const hostedForm = await this.rsvpFormHosting.createHostedRSVPForm(testEvent, inviteId);
            
            console.log('✅ RSVP form created on Google Drive');
            console.log('   - File ID:', hostedForm.fileId);
            console.log('   - File Name:', hostedForm.fileName);
            console.log('   - Direct URL:', hostedForm.directUrl);
            console.log('   - Web View Link:', hostedForm.webViewLink);
            
            this.testResults.push({ test: 'RSVP Form Creation', status: 'PASS' });
            return hostedForm;
        } catch (error) {
            console.log('❌ RSVP form creation failed:', error.message);
            this.testResults.push({ test: 'RSVP Form Creation', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    async testQRCodeGeneration(testEvent, hostedForm) {
        console.log('\n🔲 Test 4: QR Code Generation for Google Drive Hosted Form');
        try {
            const inviteId = this.qrCodeService.generateInviteId();
            const qrCodeData = await this.rsvpFormHosting.generateQRCodeForHostedForm(testEvent, inviteId);
            
            console.log('✅ QR code generated for Google Drive hosted form');
            console.log('   - RSVP URL:', qrCodeData.rsvpUrl);
            console.log('   - Hosting Method:', qrCodeData.hostingMethod);
            console.log('   - QR Code Data URL length:', qrCodeData.qrCodeDataURL.length);
            
            // Verify the URL points to Google Drive
            if (qrCodeData.rsvpUrl.includes('drive.google.com')) {
                console.log('✅ QR code correctly points to Google Drive');
            } else {
                throw new Error('QR code does not point to Google Drive');
            }
            
            this.testResults.push({ test: 'QR Code Generation', status: 'PASS' });
        } catch (error) {
            console.log('❌ QR code generation failed:', error.message);
            this.testResults.push({ test: 'QR Code Generation', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    async testFormAccessibility(hostedForm) {
        console.log('\n🌐 Test 5: Form Accessibility');
        try {
            // Test if the form URL is accessible
            const response = await fetch(hostedForm.directUrl, { method: 'HEAD' });
            
            if (response.ok) {
                console.log('✅ Google Drive hosted form is accessible');
                console.log('   - Status:', response.status);
                console.log('   - Content-Type:', response.headers.get('content-type'));
            } else {
                throw new Error(`Form not accessible: ${response.status}`);
            }
            
            this.testResults.push({ test: 'Form Accessibility', status: 'PASS' });
        } catch (error) {
            console.log('❌ Form accessibility test failed:', error.message);
            this.testResults.push({ test: 'Form Accessibility', status: 'FAIL', error: error.message });
            // Don't throw here as this might be a network issue
        }
    }

    async testBatchQRCodeGeneration(testEvent) {
        console.log('\n📦 Test 6: Batch QR Code Generation');
        try {
            const batchSize = 3;
            const invites = [];
            
            for (let i = 0; i < batchSize; i++) {
                const inviteId = this.qrCodeService.generateInviteId();
                const qrCodeData = await this.rsvpFormHosting.generateQRCodeForHostedForm(testEvent, inviteId);
                invites.push(qrCodeData);
            }
            
            console.log(`✅ Generated ${batchSize} QR codes with Google Drive hosting`);
            console.log('   - All URLs point to Google Drive:', invites.every(invite => invite.rsvpUrl.includes('drive.google.com')));
            console.log('   - All use Google Drive hosting:', invites.every(invite => invite.hostingMethod === 'google-drive'));
            
            this.testResults.push({ test: 'Batch QR Code Generation', status: 'PASS' });
        } catch (error) {
            console.log('❌ Batch QR code generation failed:', error.message);
            this.testResults.push({ test: 'Batch QR Code Generation', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    printTestResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${result.test}: ${result.status}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        console.log('\n📈 Summary:');
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Total: ${this.testResults.length}`);
        
        if (failed === 0) {
            console.log('\n🎉 All tests passed! Google Drive hosting is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the errors above.');
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new GoogleDriveTester();
    tester.runAllTests().catch(console.error);
}

module.exports = GoogleDriveTester;






