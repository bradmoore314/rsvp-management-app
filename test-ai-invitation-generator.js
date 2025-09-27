#!/usr/bin/env node

// AI Invitation Generator Test Suite
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class AIInvitationGeneratorTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.testResults = {
            timestamp: new Date().toISOString(),
            totalTests: 0,
            passed: 0,
            failed: 0,
            errors: [],
            results: []
        };
    }

    async runTest(testName, testFunction) {
        this.testResults.totalTests++;
        console.log(`\n🧪 Testing: ${testName}`);
        
        try {
            const result = await testFunction();
            if (result.success) {
                this.testResults.passed++;
                console.log(`✅ PASSED: ${testName}`);
                this.testResults.results.push({
                    name: testName,
                    status: 'PASSED',
                    details: result.details || 'Test completed successfully'
                });
            } else {
                this.testResults.failed++;
                console.log(`❌ FAILED: ${testName} - ${result.error}`);
                this.testResults.results.push({
                    name: testName,
                    status: 'FAILED',
                    error: result.error,
                    details: result.details
                });
            }
        } catch (error) {
            this.testResults.failed++;
            console.log(`💥 ERROR: ${testName} - ${error.message}`);
            this.testResults.errors.push({
                test: testName,
                error: error.message,
                stack: error.stack
            });
            this.testResults.results.push({
                name: testName,
                status: 'ERROR',
                error: error.message
            });
        }
    }

    // Test themes endpoint
    async testThemesEndpoint() {
        try {
            const response = await axios.get(`${this.baseUrl}/invitation-generator/themes`);
            
            if (response.status === 200 && response.data.success) {
                const themes = response.data.themes;
                const expectedThemes = ['birthday', 'wedding', 'corporate', 'holiday', 'casual'];
                const foundThemes = themes.map(theme => theme.id);
                
                const missingThemes = expectedThemes.filter(theme => !foundThemes.includes(theme));
                
                if (missingThemes.length === 0) {
                    return {
                        success: true,
                        details: `All ${themes.length} themes available: ${foundThemes.join(', ')}`
                    };
                } else {
                    return {
                        success: false,
                        error: `Missing themes: ${missingThemes.join(', ')}`
                    };
                }
            } else {
                return { success: false, error: 'Themes endpoint returned invalid response' };
            }
        } catch (error) {
            return { success: false, error: `Themes endpoint failed: ${error.message}` };
        }
    }

    // Test animations endpoint
    async testAnimationsEndpoint() {
        try {
            const response = await axios.get(`${this.baseUrl}/invitation-generator/animations`);
            
            if (response.status === 200 && response.data.success) {
                const animations = response.data.animations;
                const expectedAnimations = ['cardOpen', 'reveal', 'slideIn', 'particle'];
                const foundAnimations = animations.map(anim => anim.id);
                
                const missingAnimations = expectedAnimations.filter(anim => !foundAnimations.includes(anim));
                
                if (missingAnimations.length === 0) {
                    return {
                        success: true,
                        details: `All ${animations.length} animations available: ${foundAnimations.join(', ')}`
                    };
                } else {
                    return {
                        success: false,
                        error: `Missing animations: ${missingAnimations.join(', ')}`
                    };
                }
            } else {
                return { success: false, error: 'Animations endpoint returned invalid response' };
            }
        } catch (error) {
            return { success: false, error: `Animations endpoint failed: ${error.message}` };
        }
    }

    // Test Gemini AI connection
    async testGeminiConnection() {
        try {
            const response = await axios.get(`${this.baseUrl}/invitation-generator/test-gemini`, {
                timeout: 15000
            });
            
            if (response.data.success) {
                return {
                    success: true,
                    details: 'Gemini AI connection successful'
                };
            } else {
                return {
                    success: false,
                    error: `Gemini AI connection failed: ${response.data.error}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: `Gemini AI test error: ${error.message}`
            };
        }
    }

    // Test content suggestions
    async testContentSuggestions() {
        try {
            const testData = {
                eventType: 'birthday',
                eventName: 'Test Birthday Party'
            };

            const response = await axios.post(
                `${this.baseUrl}/invitation-generator/suggestions`,
                testData,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 15000
                }
            );

            if (response.status === 200 && response.data.success) {
                const suggestions = response.data.suggestions;
                if (Array.isArray(suggestions) && suggestions.length > 0) {
                    return {
                        success: true,
                        details: `Generated ${suggestions.length} content suggestions`
                    };
                } else {
                    return {
                        success: false,
                        error: 'No suggestions returned'
                    };
                }
            } else {
                return { success: false, error: 'Content suggestions endpoint failed' };
            }
        } catch (error) {
            return { success: false, error: `Content suggestions test failed: ${error.message}` };
        }
    }

    // Test invitation generation for different event types
    async testInvitationGeneration() {
        const eventTypes = ['birthday', 'wedding', 'corporate', 'holiday', 'casual'];
        const results = [];

        for (const eventType of eventTypes) {
            try {
                const eventData = {
                    eventType: eventType,
                    eventName: `Test ${eventType.charAt(0).toUpperCase() + eventType.slice(1)} Event`,
                    eventDate: '2024-12-25',
                    eventTime: '19:00',
                    eventLocation: '123 Test Street, Test City',
                    hostName: 'Test Host',
                    customPrompt: `Make it feel like a ${eventType} celebration`,
                    theme: eventType,
                    animationType: 'cardOpen'
                };

                const response = await axios.post(
                    `${this.baseUrl}/invitation-generator/generate`,
                    eventData,
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 30000
                    }
                );

                if (response.status === 200 && response.data.success) {
                    const invitation = response.data.invitation;
                    results.push(`${eventType}: Generated (ID: ${invitation.id})`);
                } else {
                    results.push(`${eventType}: Failed`);
                }
            } catch (error) {
                results.push(`${eventType}: Error - ${error.message}`);
            }
        }

        const successCount = results.filter(r => r.includes('Generated')).length;
        
        if (successCount === eventTypes.length) {
            return {
                success: true,
                details: `All ${eventTypes.length} event types generated successfully`
            };
        } else {
            return {
                success: false,
                error: `Only ${successCount}/${eventTypes.length} event types generated successfully`
            };
        }
    }

    // Test print functionality
    async testPrintFunctionality() {
        try {
            // First generate an invitation
            const eventData = {
                eventType: 'birthday',
                eventName: 'Test Print Event',
                eventDate: '2024-12-25',
                eventTime: '19:00',
                eventLocation: '123 Test Street, Test City',
                hostName: 'Test Host',
                customPrompt: 'Make it print-ready',
                theme: 'birthday',
                animationType: 'cardOpen'
            };

            const generateResponse = await axios.post(
                `${this.baseUrl}/invitation-generator/generate`,
                eventData,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            if (generateResponse.status === 200 && generateResponse.data.success) {
                const invitation = generateResponse.data.invitation;

                // Test print endpoint
                const printData = {
                    invitationData: invitation,
                    printOptions: { format: 'A4', doubleSided: true }
                };

                const printResponse = await axios.post(
                    `${this.baseUrl}/invitation-generator/print`,
                    printData,
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 15000
                    }
                );

                if (printResponse.status === 200 && printResponse.data.success) {
                    return {
                        success: true,
                        details: 'Print functionality working - HTML generated successfully'
                    };
                } else {
                    return {
                        success: false,
                        error: 'Print endpoint failed'
                    };
                }
            } else {
                return {
                    success: false,
                    error: 'Could not generate invitation for print test'
                };
            }
        } catch (error) {
            return { success: false, error: `Print functionality test failed: ${error.message}` };
        }
    }

    // Test RSVP page generation
    async testRSVPPageGeneration() {
        try {
            // First generate an invitation
            const eventData = {
                eventType: 'wedding',
                eventName: 'Test RSVP Event',
                eventDate: '2024-12-25',
                eventTime: '19:00',
                eventLocation: '123 Test Street, Test City',
                hostName: 'Test Host',
                customPrompt: 'Make it elegant',
                theme: 'wedding',
                animationType: 'reveal'
            };

            const generateResponse = await axios.post(
                `${this.baseUrl}/invitation-generator/generate`,
                eventData,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            if (generateResponse.status === 200 && generateResponse.data.success) {
                const invitation = generateResponse.data.invitation;

                // Test RSVP page generation
                const rsvpData = {
                    invitationData: invitation,
                    rsvpUrl: 'https://example.com/rsvp/test'
                };

                const rsvpResponse = await axios.post(
                    `${this.baseUrl}/invitation-generator/rsvp-page`,
                    rsvpData,
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 15000
                    }
                );

                if (rsvpResponse.status === 200 && rsvpResponse.data.success) {
                    return {
                        success: true,
                        details: 'RSVP page generation working - HTML generated successfully'
                    };
                } else {
                    return {
                        success: false,
                        error: 'RSVP page generation endpoint failed'
                    };
                }
            } else {
                return {
                    success: false,
                    error: 'Could not generate invitation for RSVP page test'
                };
            }
        } catch (error) {
            return { success: false, error: `RSVP page generation test failed: ${error.message}` };
        }
    }

    // Test theme variations
    async testThemeVariations() {
        try {
            const themes = ['birthday', 'wedding', 'corporate', 'holiday', 'casual'];
            const results = [];

            for (const theme of themes) {
                try {
                    const response = await axios.get(`${this.baseUrl}/invitation-generator/themes/${theme}/variations`);
                    
                    if (response.status === 200 && response.data.success) {
                        const variations = response.data.variations;
                        results.push(`${theme}: ${variations.length} variations`);
                    } else {
                        results.push(`${theme}: Failed`);
                    }
                } catch (error) {
                    results.push(`${theme}: Error`);
                }
            }

            return {
                success: true,
                details: `Theme variations tested: ${results.join(', ')}`
            };
        } catch (error) {
            return { success: false, error: `Theme variations test failed: ${error.message}` };
        }
    }

    // Test frontend page accessibility
    async testFrontendAccessibility() {
        try {
            const response = await axios.get(`${this.baseUrl}/invitation-generator`);
            
            if (response.status === 200) {
                const html = response.data;
                
                // Check for key elements in the HTML
                const hasTitle = html.includes('AI Invitation Generator');
                const hasForm = html.includes('eventForm');
                const hasCSS = html.includes('invitation-generator.css');
                const hasJS = html.includes('invitation-generator.js');
                
                const checks = [
                    { name: 'Title', passed: hasTitle },
                    { name: 'Form', passed: hasForm },
                    { name: 'CSS', passed: hasCSS },
                    { name: 'JavaScript', passed: hasJS }
                ];
                
                const passedChecks = checks.filter(check => check.passed).length;
                
                if (passedChecks === checks.length) {
                    return {
                        success: true,
                        details: 'Frontend page fully accessible with all required elements'
                    };
                } else {
                    return {
                        success: false,
                        error: `Missing elements: ${checks.filter(check => !check.passed).map(check => check.name).join(', ')}`
                    };
                }
            } else {
                return { success: false, error: 'Frontend page not accessible' };
            }
        } catch (error) {
            return { success: false, error: `Frontend accessibility test failed: ${error.message}` };
        }
    }

    // Run all AI invitation generator tests
    async runAllTests() {
        console.log('🎨 Starting AI Invitation Generator Testing...\n');
        console.log('=' * 60);

        await this.runTest('Frontend Page Accessibility', () => this.testFrontendAccessibility());
        await this.runTest('Themes Endpoint', () => this.testThemesEndpoint());
        await this.runTest('Animations Endpoint', () => this.testAnimationsEndpoint());
        await this.runTest('Gemini AI Connection', () => this.testGeminiConnection());
        await this.runTest('Content Suggestions', () => this.testContentSuggestions());
        await this.runTest('Theme Variations', () => this.testThemeVariations());
        await this.runTest('Invitation Generation', () => this.testInvitationGeneration());
        await this.runTest('Print Functionality', () => this.testPrintFunctionality());
        await this.runTest('RSVP Page Generation', () => this.testRSVPPageGeneration());

        this.generateReport();
    }

    // Generate test report
    generateReport() {
        console.log('\n' + '=' * 60);
        console.log('📊 AI INVITATION GENERATOR TEST REPORT');
        console.log('=' * 60);
        console.log(`📈 Total Tests: ${this.testResults.totalTests}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`💥 Errors: ${this.testResults.errors.length}`);
        console.log(`📊 Success Rate: ${((this.testResults.passed / this.testResults.totalTests) * 100).toFixed(1)}%`);

        if (this.testResults.errors.length > 0) {
            console.log('\n🚨 ERRORS:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.test}: ${error.error}`);
            });
        }

        console.log('\n📋 DETAILED RESULTS:');
        this.testResults.results.forEach((result, index) => {
            const status = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '💥';
            console.log(`${index + 1}. ${status} ${result.name}`);
            if (result.details) console.log(`   Details: ${result.details}`);
            if (result.error) console.log(`   Error: ${result.error}`);
        });

        // Save report to file
        const reportPath = path.join(__dirname, 'test-results-ai-invitation-generator.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportPath}`);

        console.log('\n🎉 AI Invitation Generator Testing Complete!');
    }
}

// Run the AI invitation generator test suite
async function main() {
    const tester = new AIInvitationGeneratorTester();
    await tester.runAllTests();
}

// Handle command line execution
if (require.main === module) {
    main().catch(console.error);
}

module.exports = AIInvitationGeneratorTester;
