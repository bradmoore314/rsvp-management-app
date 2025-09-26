#!/usr/bin/env node

/**
 * API Endpoints Test Script
 * 
 * This script tests all API endpoints for Google Drive hosting functionality
 */

// Using built-in fetch (Node.js 18+)

class APIEndpointTester {
    constructor(baseUrl = 'http://localhost:4000') {
        this.baseUrl = baseUrl;
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Starting API Endpoints Tests...\n');
        
        try {
            // Test 1: Health check
            await this.testHealthCheck();
            
            // Test 2: Create test event
            const testEvent = await this.testEventCreation();
            
            // Test 3: Generate single QR code with Google Drive hosting
            await this.testSingleQRCodeGeneration(testEvent);
            
            // Test 4: Generate batch QR codes with Google Drive hosting
            await this.testBatchQRCodeGeneration(testEvent);
            
            // Test 5: Test QR code generation without Google Drive (fallback)
            await this.testTraditionalQRCodeGeneration(testEvent);
            
            // Print results
            this.printTestResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        }
    }

    async testHealthCheck() {
        console.log('🔧 Test 1: Health Check');
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            
            if (response.ok && data.status === 'OK') {
                console.log('✅ Health check passed');
                console.log('   - Status:', data.status);
                console.log('   - Services available:', Object.keys(data.services).length);
                this.testResults.push({ test: 'Health Check', status: 'PASS' });
            } else {
                throw new Error(`Health check failed: ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Health check failed:', error.message);
            this.testResults.push({ test: 'Health Check', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    async testEventCreation() {
        console.log('\n📅 Test 2: Event Creation');
        try {
            const eventData = {
                name: 'API Test Event',
                date: '2025-09-27',
                time: '19:00',
                location: 'Test Location',
                hasImage: false
            };

            const response = await fetch(`${this.baseUrl}/event-management/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': 'test-session-' + Date.now()
                },
                body: JSON.stringify(eventData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Event created successfully');
                console.log('   - Event ID:', result.data.id);
                console.log('   - Event Name:', result.data.name);
                this.testResults.push({ test: 'Event Creation', status: 'PASS' });
                return result.data;
            } else {
                throw new Error(`Event creation failed: ${result.message || response.statusText}`);
            }
        } catch (error) {
            console.log('❌ Event creation failed:', error.message);
            this.testResults.push({ test: 'Event Creation', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    async testSingleQRCodeGeneration(testEvent) {
        console.log('\n🔲 Test 3: Single QR Code Generation with Google Drive Hosting');
        try {
            const qrData = {
                eventId: testEvent.id,
                useGoogleDrive: true
            };

            const response = await fetch(`${this.baseUrl}/qrcode/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(qrData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Single QR code generated with Google Drive hosting');
                console.log('   - RSVP URL:', result.data.rsvpUrl);
                console.log('   - Hosting Method:', result.data.hostingMethod);
                console.log('   - Points to Google Drive:', result.data.rsvpUrl.includes('drive.google.com'));
                
                if (result.data.hostingMethod === 'google-drive' && result.data.rsvpUrl.includes('drive.google.com')) {
                    console.log('✅ QR code correctly uses Google Drive hosting');
                } else {
                    throw new Error('QR code does not use Google Drive hosting');
                }
                
                this.testResults.push({ test: 'Single QR Code Generation (Google Drive)', status: 'PASS' });
            } else {
                throw new Error(`QR code generation failed: ${result.message || response.statusText}`);
            }
        } catch (error) {
            console.log('❌ Single QR code generation failed:', error.message);
            this.testResults.push({ test: 'Single QR Code Generation (Google Drive)', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    async testBatchQRCodeGeneration(testEvent) {
        console.log('\n📦 Test 4: Batch QR Code Generation with Google Drive Hosting');
        try {
            const batchData = {
                eventId: testEvent.id,
                inviteCount: 3,
                useGoogleDrive: true
            };

            const response = await fetch(`${this.baseUrl}/qrcode/generate-batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(batchData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Batch QR codes generated with Google Drive hosting');
                console.log('   - Number of invites:', result.data.count);
                console.log('   - Hosting Method:', result.data.hostingMethod);
                console.log('   - All use Google Drive:', result.data.invites.every(invite => invite.hostingMethod === 'google-drive'));
                console.log('   - All point to Google Drive:', result.data.invites.every(invite => invite.rsvpUrl.includes('drive.google.com')));
                
                if (result.data.hostingMethod === 'google-drive' && 
                    result.data.invites.every(invite => invite.hostingMethod === 'google-drive')) {
                    console.log('✅ Batch QR codes correctly use Google Drive hosting');
                } else {
                    throw new Error('Batch QR codes do not use Google Drive hosting');
                }
                
                this.testResults.push({ test: 'Batch QR Code Generation (Google Drive)', status: 'PASS' });
            } else {
                throw new Error(`Batch QR code generation failed: ${result.message || response.statusText}`);
            }
        } catch (error) {
            console.log('❌ Batch QR code generation failed:', error.message);
            this.testResults.push({ test: 'Batch QR Code Generation (Google Drive)', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    async testTraditionalQRCodeGeneration(testEvent) {
        console.log('\n🔲 Test 5: Traditional QR Code Generation (Fallback)');
        try {
            const qrData = {
                eventId: testEvent.id,
                useGoogleDrive: false,
                baseUrl: this.baseUrl
            };

            const response = await fetch(`${this.baseUrl}/qrcode/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(qrData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Traditional QR code generated (fallback)');
                console.log('   - RSVP URL:', result.data.rsvpUrl);
                console.log('   - Hosting Method:', result.data.hostingMethod);
                console.log('   - Points to local app:', result.data.rsvpUrl.includes(this.baseUrl));
                
                if (result.data.hostingMethod === 'app-url' && result.data.rsvpUrl.includes(this.baseUrl)) {
                    console.log('✅ Traditional QR code correctly uses app URL');
                } else {
                    throw new Error('Traditional QR code does not use app URL');
                }
                
                this.testResults.push({ test: 'Traditional QR Code Generation', status: 'PASS' });
            } else {
                throw new Error(`Traditional QR code generation failed: ${result.message || response.statusText}`);
            }
        } catch (error) {
            console.log('❌ Traditional QR code generation failed:', error.message);
            this.testResults.push({ test: 'Traditional QR Code Generation', status: 'FAIL', error: error.message });
            // Don't throw here as this is a fallback test
        }
    }

    printTestResults() {
        console.log('\n📊 API Test Results Summary:');
        console.log('=============================');
        
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
            console.log('\n🎉 All API tests passed! Google Drive hosting endpoints are working correctly.');
        } else {
            console.log('\n⚠️  Some API tests failed. Please check the errors above.');
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new APIEndpointTester();
    tester.runAllTests().catch(console.error);
}

module.exports = APIEndpointTester;
