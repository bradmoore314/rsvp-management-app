#!/usr/bin/env node

/**
 * Manual Testing Script for "Yes or No Invites"
 * 
 * This script provides automated checks for basic functionality
 * and generates a test report for manual verification.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ManualTestRunner {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            environment: {},
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            }
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        }[type] || 'ℹ️';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async checkEnvironment() {
        this.log('Checking test environment...', 'info');
        
        try {
            // Check if server is running
            const serverRunning = await this.checkServerRunning();
            this.results.environment.serverRunning = serverRunning;
            
            // Check package.json
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            this.results.environment.packageVersion = packageJson.version;
            this.results.environment.dependencies = Object.keys(packageJson.dependencies || {});
            
            // Check environment variables
            this.results.environment.envVars = {
                hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
                hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
                hasAppUrl: !!process.env.APP_URL,
                hasPort: !!process.env.PORT
            };
            
            // Check file structure
            this.results.environment.fileStructure = {
                hasServer: fs.existsSync('server.js'),
                hasServices: fs.existsSync('services'),
                hasRoutes: fs.existsSync('routes'),
                hasPublic: fs.existsSync('public'),
                hasTests: fs.existsSync('tests')
            };
            
            this.log('Environment check completed', 'success');
            return true;
        } catch (error) {
            this.log(`Environment check failed: ${error.message}`, 'error');
            return false;
        }
    }

    async checkServerRunning() {
        try {
            const response = await fetch('http://localhost:3000/health');
            return response.ok;
        } catch (error) {
            try {
                const response = await fetch('http://localhost:8080/health');
                return response.ok;
            } catch (error2) {
                return false;
            }
        }
    }

    async runTest(testName, testFunction) {
        this.log(`Running test: ${testName}`, 'info');
        this.results.summary.total++;
        
        try {
            const result = await testFunction();
            if (result.success) {
                this.log(`✅ ${testName}: PASSED`, 'success');
                this.results.summary.passed++;
                this.results.tests.push({
                    name: testName,
                    status: 'passed',
                    details: result.details || 'Test passed successfully'
                });
            } else {
                this.log(`❌ ${testName}: FAILED - ${result.error}`, 'error');
                this.results.summary.failed++;
                this.results.tests.push({
                    name: testName,
                    status: 'failed',
                    error: result.error,
                    details: result.details
                });
            }
        } catch (error) {
            this.log(`❌ ${testName}: ERROR - ${error.message}`, 'error');
            this.results.summary.failed++;
            this.results.tests.push({
                name: testName,
                status: 'error',
                error: error.message,
                details: 'Test threw an exception'
            });
        }
    }

    async testServerHealth() {
        return this.runTest('Server Health Check', async () => {
            try {
                const response = await fetch('http://localhost:3000/health');
                if (response.ok) {
                    return { success: true, details: 'Server is responding' };
                } else {
                    return { success: false, error: `Server returned ${response.status}` };
                }
            } catch (error) {
                return { success: false, error: 'Server is not responding' };
            }
        });
    }

    async testEventCreation() {
        return this.runTest('Event Creation API', async () => {
            try {
                const eventData = {
                    name: 'Test Event - Manual Testing',
                    description: 'This is a test event created during manual testing',
                    date: '2025-12-31',
                    time: '7:00 PM',
                    location: 'Test Location',
                    hostName: 'Test Host',
                    hostEmail: 'test@example.com',
                    showDietaryRestrictions: true,
                    showDressCode: false,
                    showHostMessage: true,
                    hostMessage: 'This is a test message',
                    eventCategory: 'Test',
                    eventTags: ['test', 'manual'],
                    status: 'active',
                    reminderEnabled: false,
                    dietaryOptions: ['Vegetarian', 'Vegan', 'No Restrictions']
                };

                const response = await fetch('http://localhost:3000/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data && result.data.id) {
                        return { 
                            success: true, 
                            details: `Event created with ID: ${result.data.id}`,
                            eventId: result.data.id
                        };
                    } else {
                        return { success: false, error: 'Invalid response format' };
                    }
                } else {
                    return { success: false, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    async testEventRetrieval(eventId) {
        return this.runTest('Event Retrieval API', async () => {
            try {
                const response = await fetch(`http://localhost:3000/events/${eventId}`);
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        return { 
                            success: true, 
                            details: `Event retrieved: ${result.data.name}` 
                        };
                    } else {
                        return { success: false, error: 'Invalid response format' };
                    }
                } else {
                    return { success: false, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    async testRSVPForm(eventId) {
        return this.runTest('RSVP Form Access', async () => {
            try {
                const testInviteId = 'test-invite-manual';
                const response = await fetch(`http://localhost:3000/rsvp/${eventId}/${testInviteId}`);
                
                if (response.ok) {
                    const html = await response.text();
                    if (html.includes('RSVP - Event Invitation') && html.includes('Test Event - Manual Testing')) {
                        return { 
                            success: true, 
                            details: 'RSVP form loads correctly with event data' 
                        };
                    } else {
                        return { success: false, error: 'RSVP form missing expected content' };
                    }
                } else {
                    return { success: false, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    async testRSVPSubmission(eventId) {
        return this.runTest('RSVP Submission', async () => {
            try {
                const rsvpData = {
                    eventId: eventId,
                    inviteId: 'test-invite-manual',
                    guestName: 'Manual Test User',
                    guestEmail: 'manual-test@example.com',
                    guestPhone: '555-1234',
                    emergencyContact: 'Emergency Contact - 555-5678',
                    attendance: 'yes',
                    guestCount: 2,
                    dietaryOptions: ['Vegetarian'],
                    dietaryRestrictions: 'No nuts please',
                    message: 'This is a manual test RSVP',
                    timestamp: new Date().toISOString()
                };

                const response = await fetch('http://localhost:3000/rsvp/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(rsvpData)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        return { 
                            success: true, 
                            details: `RSVP submitted successfully for ${result.data.guestName}` 
                        };
                    } else {
                        return { success: false, error: 'Invalid response format' };
                    }
                } else {
                    return { success: false, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    async testInviteGeneration(eventId) {
        return this.runTest('Invite Generation', async () => {
            try {
                const inviteData = {
                    eventId: eventId,
                    inviteCount: 2,
                    guestName: 'Test Guest',
                    guestEmail: 'guest@example.com',
                    customMessage: 'You are invited to our test event!'
                };

                const response = await fetch('http://localhost:3000/invites/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(inviteData)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data && result.data.invites) {
                        return { 
                            success: true, 
                            details: `Generated ${result.data.inviteCount} invites` 
                        };
                    } else {
                        return { success: false, error: 'Invalid response format' };
                    }
                } else {
                    return { success: false, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    async testFileStructure() {
        return this.runTest('File Structure Check', async () => {
            const requiredFiles = [
                'server.js',
                'package.json',
                'services/eventService.js',
                'services/rsvpService.js',
                'services/qrCodeService.js',
                'services/inviteService.js',
                'routes/events.js',
                'routes/rsvp.js',
                'routes/invites.js',
                'public/host-dashboard.html',
                'public/js/host-dashboard.js',
                'public/css/host-dashboard.css'
            ];

            const missingFiles = [];
            for (const file of requiredFiles) {
                if (!fs.existsSync(file)) {
                    missingFiles.push(file);
                }
            }

            if (missingFiles.length === 0) {
                return { success: true, details: 'All required files present' };
            } else {
                return { 
                    success: false, 
                    error: `Missing files: ${missingFiles.join(', ')}` 
                };
            }
        });
    }

    async testDependencies() {
        return this.runTest('Dependencies Check', async () => {
            try {
                const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                const requiredDeps = [
                    'express',
                    'cors',
                    'dotenv',
                    'googleapis',
                    'qrcode',
                    'uuid',
                    'nodemailer'
                ];

                const missingDeps = [];
                for (const dep of requiredDeps) {
                    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
                        missingDeps.push(dep);
                    }
                }

                if (missingDeps.length === 0) {
                    return { success: true, details: 'All required dependencies present' };
                } else {
                    return { 
                        success: false, 
                        error: `Missing dependencies: ${missingDeps.join(', ')}` 
                    };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    generateReport() {
        const reportPath = path.join(__dirname, 'manual-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        const htmlReport = this.generateHTMLReport();
        const htmlReportPath = path.join(__dirname, 'manual-test-report.html');
        fs.writeFileSync(htmlReportPath, htmlReport);
        
        this.log(`Test report generated: ${reportPath}`, 'success');
        this.log(`HTML report generated: ${htmlReportPath}`, 'success');
    }

    generateHTMLReport() {
        const passRate = ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1);
        const statusColor = passRate >= 80 ? '#4CAF50' : passRate >= 60 ? '#FF9800' : '#F44336';
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Manual Test Report - Yes or No Invites</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; }
        .passed { color: #4CAF50; }
        .failed { color: #F44336; }
        .skipped { color: #FF9800; }
        .test-results { margin-top: 30px; }
        .test-item { margin-bottom: 15px; padding: 15px; border-radius: 5px; border-left: 4px solid; }
        .test-passed { background: #e8f5e8; border-left-color: #4CAF50; }
        .test-failed { background: #ffeaea; border-left-color: #F44336; }
        .test-error { background: #fff3e0; border-left-color: #FF9800; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-details { color: #666; font-size: 0.9em; }
        .environment { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .environment h3 { margin-top: 0; }
        .env-item { margin-bottom: 10px; }
        .env-label { font-weight: bold; }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .status-true { background: #4CAF50; }
        .status-false { background: #F44336; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Manual Test Report</h1>
            <h2>Yes or No Invites</h2>
            <p>Generated: ${new Date(this.results.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="number">${this.results.summary.total}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="number passed">${this.results.summary.passed}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="number failed">${this.results.summary.failed}</div>
            </div>
            <div class="summary-card">
                <h3>Pass Rate</h3>
                <div class="number" style="color: ${statusColor}">${passRate}%</div>
            </div>
        </div>

        <div class="environment">
            <h3>🔧 Test Environment</h3>
            <div class="env-item">
                <span class="env-label">Server Running:</span>
                <span class="status-indicator ${this.results.environment.serverRunning ? 'status-true' : 'status-false'}"></span>
                ${this.results.environment.serverRunning ? 'Yes' : 'No'}
            </div>
            <div class="env-item">
                <span class="env-label">Package Version:</span>
                ${this.results.environment.packageVersion || 'Unknown'}
            </div>
            <div class="env-item">
                <span class="env-label">Google Client ID:</span>
                <span class="status-indicator ${this.results.environment.envVars?.hasGoogleClientId ? 'status-true' : 'status-false'}"></span>
                ${this.results.environment.envVars?.hasGoogleClientId ? 'Configured' : 'Missing'}
            </div>
            <div class="env-item">
                <span class="env-label">Google Client Secret:</span>
                <span class="status-indicator ${this.results.environment.envVars?.hasGoogleClientSecret ? 'status-true' : 'status-false'}"></span>
                ${this.results.environment.envVars?.hasGoogleClientSecret ? 'Configured' : 'Missing'}
            </div>
        </div>

        <div class="test-results">
            <h3>📋 Test Results</h3>
            ${this.results.tests.map(test => `
                <div class="test-item test-${test.status}">
                    <div class="test-name">${test.name}</div>
                    <div class="test-details">
                        ${test.details || ''}
                        ${test.error ? `<br><strong>Error:</strong> ${test.error}` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
    }

    async run() {
        this.log('🚀 Starting Manual Test Suite for "Yes or No Invites"', 'info');
        this.log('=' .repeat(60), 'info');
        
        // Check environment
        const envOk = await this.checkEnvironment();
        if (!envOk) {
            this.log('❌ Environment check failed. Please fix issues before running tests.', 'error');
            return;
        }

        // Run basic tests
        await this.testFileStructure();
        await this.testDependencies();
        await this.testServerHealth();

        // Run API tests if server is running
        if (this.results.environment.serverRunning) {
            await this.testEventCreation();
            
            // Find the test event ID
            const eventCreationTest = this.results.tests.find(t => t.name === 'Event Creation API');
            if (eventCreationTest && eventCreationTest.details) {
                const eventIdMatch = eventCreationTest.details.match(/ID: ([a-f0-9-]+)/);
                if (eventIdMatch) {
                    const eventId = eventIdMatch[1];
                    await this.testEventRetrieval(eventId);
                    await this.testRSVPForm(eventId);
                    await this.testRSVPSubmission(eventId);
                    await this.testInviteGeneration(eventId);
                }
            }
        } else {
            this.log('⚠️ Server is not running. Skipping API tests.', 'warning');
        }

        // Generate report
        this.generateReport();

        // Print summary
        this.log('=' .repeat(60), 'info');
        this.log('📊 Test Summary:', 'info');
        this.log(`   Total Tests: ${this.results.summary.total}`, 'info');
        this.log(`   Passed: ${this.results.summary.passed}`, 'success');
        this.log(`   Failed: ${this.results.summary.failed}`, 'error');
        this.log(`   Pass Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`, 'info');
        
        if (this.results.summary.failed === 0) {
            this.log('🎉 All tests passed!', 'success');
        } else {
            this.log(`⚠️ ${this.results.summary.failed} test(s) failed. Check the report for details.`, 'warning');
        }
    }
}

// Run the tests
if (require.main === module) {
    const runner = new ManualTestRunner();
    runner.run().catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = ManualTestRunner;
