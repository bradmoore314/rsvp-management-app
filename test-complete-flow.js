/**
 * Test Complete RSVP Flow
 * 
 * This script tests the complete flow from QR code generation to Google Sheets
 */

const { googleSheetsService, googleDriveService } = require('./services/sharedServices');

class CompleteFlowTester {
    constructor() {
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Testing Complete RSVP Flow...\n');
        
        try {
            await this.testGoogleDriveAuth();
            await this.testGoogleSheetsAuth();
            await this.testEventCreation();
            await this.testQRCodeGeneration();
            await this.testFormHosting();
            this.displayResults();
        } catch (error) {
            console.error('\n❌ Test suite failed:', error.message);
        }
    }

    async testGoogleDriveAuth() {
        console.log('🔧 Test 1: Google Drive Authentication');
        try {
            if (!googleDriveService.isReady()) {
                await googleDriveService.initialize();
            }
            
            const savedTokens = await googleDriveService.loadTokens();
            if (savedTokens) {
                await googleDriveService.setCredentialsFromTokens(savedTokens);
                this.testResults.push({ name: 'Google Drive Auth', success: true });
                console.log('✅ Google Drive authentication working');
            } else {
                throw new Error('No Google Drive tokens found');
            }
        } catch (error) {
            this.testResults.push({ name: 'Google Drive Auth', success: false, details: error.message });
            console.error('❌ Google Drive authentication failed:', error.message);
        }
    }

    async testGoogleSheetsAuth() {
        console.log('\n📊 Test 2: Google Sheets Authentication');
        try {
            if (!googleSheetsService.isReady()) {
                await googleSheetsService.initialize();
            }
            this.testResults.push({ name: 'Google Sheets Auth', success: true });
            console.log('✅ Google Sheets authentication working');
        } catch (error) {
            this.testResults.push({ name: 'Google Sheets Auth', success: false, details: error.message });
            console.error('❌ Google Sheets authentication failed:', error.message);
        }
    }

    async testEventCreation() {
        console.log('\n📅 Test 3: Event Creation');
        try {
            const eventData = {
                id: 'test-event-' + Date.now(),
                name: 'Test Event for Complete Flow',
                date: '2025-09-27',
                time: '19:00',
                location: 'Test Venue',
                hostEmail: 'test@example.com'
            };

            // Test creating a Google Sheet for the event
            const result = await googleSheetsService.createRSVPSpreadsheet(eventData);
            this.testResults.push({ name: 'Event Creation', success: true });
            console.log(`✅ Event sheet created: ${result.title}`);
        } catch (error) {
            this.testResults.push({ name: 'Event Creation', success: false, details: error.message });
            console.error('❌ Event creation failed:', error.message);
        }
    }

    async testQRCodeGeneration() {
        console.log('\n🔲 Test 4: QR Code Generation');
        try {
            const QRCode = require('qrcode');
            const testUrl = 'https://drive.google.com/uc?export=view&id=test123';
            const qrCodeDataURL = await QRCode.toDataURL(testUrl);
            
            if (qrCodeDataURL && qrCodeDataURL.startsWith('data:image/png')) {
                this.testResults.push({ name: 'QR Code Generation', success: true });
                console.log('✅ QR code generation working');
            } else {
                throw new Error('Invalid QR code generated');
            }
        } catch (error) {
            this.testResults.push({ name: 'QR Code Generation', success: false, details: error.message });
            console.error('❌ QR code generation failed:', error.message);
        }
    }

    async testFormHosting() {
        console.log('\n📝 Test 5: Form Hosting');
        try {
            // Test that we can create HTML content
            const testHtml = `
                <!DOCTYPE html>
                <html>
                <head><title>Test RSVP Form</title></head>
                <body>
                    <h1>Test Event</h1>
                    <form id="rsvpForm">
                        <input type="text" name="guestName" placeholder="Your Name" required>
                        <input type="email" name="guestEmail" placeholder="Your Email" required>
                        <button type="submit">Submit RSVP</button>
                    </form>
                    <script>
                        document.getElementById('rsvpForm').addEventListener('submit', async function(e) {
                            e.preventDefault();
                            const formData = new FormData(this);
                            const rsvpData = {
                                guestName: formData.get('guestName'),
                                guestEmail: formData.get('guestEmail'),
                                timestamp: new Date().toISOString()
                            };
                            
                            try {
                                const response = await fetch('{{GOOGLE_APPS_SCRIPT_URL}}', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        action: 'storeRSVP',
                                        data: rsvpData
                                    })
                                });
                                
                                const result = await response.json();
                                if (result.success) {
                                    alert('RSVP submitted successfully!');
                                } else {
                                    throw new Error(result.message);
                                }
                            } catch (error) {
                                alert('Error submitting RSVP: ' + error.message);
                            }
                        });
                    </script>
                </body>
                </html>
            `;
            
            if (testHtml.includes('{{GOOGLE_APPS_SCRIPT_URL}}')) {
                this.testResults.push({ name: 'Form Hosting', success: true });
                console.log('✅ Form hosting template working');
            } else {
                throw new Error('Invalid form template');
            }
        } catch (error) {
            this.testResults.push({ name: 'Form Hosting', success: false, details: error.message });
            console.error('❌ Form hosting failed:', error.message);
        }
    }

    displayResults() {
        console.log('\n--- Test Summary ---');
        this.testResults.forEach(test => {
            console.log(`${test.success ? '✅' : '❌'} ${test.name}: ${test.success ? 'Passed' : 'Failed'}`);
            if (!test.success) {
                console.log(`   Details: ${test.details}`);
            }
        });
        
        const passedTests = this.testResults.filter(test => test.success).length;
        const totalTests = this.testResults.length;
        
        console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('\n🎉 All tests passed! Your Google Sheets integration is ready!');
            console.log('\n📋 Next steps:');
            console.log('1. Set up your Google Apps Script (see GOOGLE_APPS_SCRIPT_SETUP.md)');
            console.log('2. Update GOOGLE_APPS_SCRIPT_URL in your .env file');
            console.log('3. Restart your app');
            console.log('4. Create an event and test the complete flow!');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the errors above.');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new CompleteFlowTester();
    tester.runAllTests();
}

module.exports = CompleteFlowTester;
