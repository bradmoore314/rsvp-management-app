#!/usr/bin/env node

// Master Test Runner - Runs all test suites
const ComprehensiveTester = require('./test-complete-app');
const AIInvitationGeneratorTester = require('./test-ai-invitation-generator');
const PrintQRCodesTester = require('./test-print-qr-codes');
const fs = require('fs');
const path = require('path');

class MasterTestRunner {
    constructor() {
        this.startTime = Date.now();
        this.allResults = {
            timestamp: new Date().toISOString(),
            totalSuites: 0,
            completedSuites: 0,
            totalTests: 0,
            totalPassed: 0,
            totalFailed: 0,
            totalErrors: 0,
            suiteResults: []
        };
    }

    async runTestSuite(suiteName, TesterClass) {
        console.log(`\n🚀 Starting ${suiteName} Test Suite...`);
        console.log('=' * 80);
        
        this.allResults.totalSuites++;
        
        try {
            const tester = new TesterClass();
            await tester.runAllTests();
            
            this.allResults.completedSuites++;
            this.allResults.totalTests += tester.testResults.totalTests;
            this.allResults.totalPassed += tester.testResults.passed;
            this.allResults.totalFailed += tester.testResults.failed;
            this.allResults.totalErrors += tester.testResults.errors.length;
            
            this.allResults.suiteResults.push({
                suiteName: suiteName,
                totalTests: tester.testResults.totalTests,
                passed: tester.testResults.passed,
                failed: tester.testResults.failed,
                errors: tester.testResults.errors.length,
                successRate: ((tester.testResults.passed / tester.testResults.totalTests) * 100).toFixed(1),
                results: tester.testResults.results
            });
            
            console.log(`\n✅ ${suiteName} Test Suite Completed`);
            console.log(`   Tests: ${tester.testResults.passed}/${tester.testResults.totalTests} passed`);
            console.log(`   Success Rate: ${((tester.testResults.passed / tester.testResults.totalTests) * 100).toFixed(1)}%`);
            
        } catch (error) {
            console.log(`\n💥 ${suiteName} Test Suite Failed: ${error.message}`);
            this.allResults.suiteResults.push({
                suiteName: suiteName,
                error: error.message,
                status: 'FAILED'
            });
        }
    }

    async runAllTestSuites() {
        console.log('🎯 MASTER TEST RUNNER - COMPREHENSIVE APP TESTING');
        console.log('=' * 80);
        console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
        console.log('📋 Running all test suites...\n');

        // Run all test suites
        await this.runTestSuite('Comprehensive App Tests', ComprehensiveTester);
        await this.runTestSuite('AI Invitation Generator Tests', AIInvitationGeneratorTester);
        await this.runTestSuite('Print QR Codes Tests', PrintQRCodesTester);

        // Generate master report
        this.generateMasterReport();
    }

    generateMasterReport() {
        const endTime = Date.now();
        const duration = (endTime - this.startTime) / 1000;

        console.log('\n' + '=' * 80);
        console.log('🏆 MASTER TEST REPORT');
        console.log('=' * 80);
        console.log(`⏱️  Total Duration: ${duration.toFixed(2)} seconds`);
        console.log(`📊 Test Suites: ${this.allResults.completedSuites}/${this.allResults.totalSuites} completed`);
        console.log(`📈 Total Tests: ${this.allResults.totalTests}`);
        console.log(`✅ Total Passed: ${this.allResults.totalPassed}`);
        console.log(`❌ Total Failed: ${this.allResults.totalFailed}`);
        console.log(`💥 Total Errors: ${this.allResults.totalErrors}`);
        console.log(`📊 Overall Success Rate: ${((this.allResults.totalPassed / this.allResults.totalTests) * 100).toFixed(1)}%`);

        console.log('\n📋 SUITE BREAKDOWN:');
        this.allResults.suiteResults.forEach((suite, index) => {
            if (suite.error) {
                console.log(`${index + 1}. 💥 ${suite.suiteName}: FAILED - ${suite.error}`);
            } else {
                const status = suite.successRate >= 80 ? '🟢' : suite.successRate >= 60 ? '🟡' : '🔴';
                console.log(`${index + 1}. ${status} ${suite.suiteName}: ${suite.passed}/${suite.totalTests} passed (${suite.successRate}%)`);
            }
        });

        // Generate summary
        this.generateSummary();

        // Save master report
        this.saveMasterReport();

        // Generate HTML master report
        this.generateHTMLMasterReport();

        console.log('\n🎉 ALL TESTING COMPLETE!');
    }

    generateSummary() {
        console.log('\n📊 SUMMARY:');
        
        const overallSuccessRate = (this.allResults.totalPassed / this.allResults.totalTests) * 100;
        
        if (overallSuccessRate >= 90) {
            console.log('🟢 EXCELLENT: App is in great shape!');
        } else if (overallSuccessRate >= 80) {
            console.log('🟡 GOOD: App is working well with minor issues');
        } else if (overallSuccessRate >= 60) {
            console.log('🟠 FAIR: App has some issues that need attention');
        } else {
            console.log('🔴 POOR: App has significant issues that need immediate attention');
        }

        // Identify critical issues
        const criticalIssues = this.allResults.suiteResults.filter(suite => 
            suite.error || (suite.successRate && suite.successRate < 50)
        );

        if (criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            criticalIssues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.suiteName}: ${issue.error || 'Low success rate'}`);
            });
        }

        // Identify areas for improvement
        const improvementAreas = this.allResults.suiteResults.filter(suite => 
            suite.successRate && suite.successRate >= 50 && suite.successRate < 80
        );

        if (improvementAreas.length > 0) {
            console.log('\n🔧 AREAS FOR IMPROVEMENT:');
            improvementAreas.forEach((area, index) => {
                console.log(`${index + 1}. ${area.suiteName}: ${area.successRate}% success rate`);
            });
        }
    }

    saveMasterReport() {
        const reportPath = path.join(__dirname, 'test-results-master.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.allResults, null, 2));
        console.log(`\n💾 Master report saved to: ${reportPath}`);
    }

    generateHTMLMasterReport() {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RSVP App - Master Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .master-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .error { color: #ffc107; }
        .suite-results { margin-bottom: 30px; }
        .suite-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid; }
        .suite-excellent { border-color: #28a745; }
        .suite-good { border-color: #17a2b8; }
        .suite-fair { border-color: #ffc107; }
        .suite-poor { border-color: #dc3545; }
        .suite-name { font-weight: bold; font-size: 1.2rem; margin-bottom: 10px; }
        .suite-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 15px; }
        .suite-stat { text-align: center; padding: 10px; background: white; border-radius: 5px; }
        .test-results { max-height: 300px; overflow-y: auto; }
        .test-result { padding: 8px; margin-bottom: 5px; border-radius: 4px; font-size: 0.9rem; }
        .test-passed { background: #d4edda; }
        .test-failed { background: #f8d7da; }
        .test-error { background: #fff3cd; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 RSVP Management App</h1>
            <h2>Master Test Report</h2>
        </div>
        
        <div class="master-stats">
            <div class="stat-card">
                <div class="stat-number">${this.allResults.totalSuites}</div>
                <div>Test Suites</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.allResults.totalTests}</div>
                <div>Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number passed">${this.allResults.totalPassed}</div>
                <div>Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number failed">${this.allResults.totalFailed}</div>
                <div>Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number error">${this.allResults.totalErrors}</div>
                <div>Errors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${((this.allResults.totalPassed / this.allResults.totalTests) * 100).toFixed(1)}%</div>
                <div>Success Rate</div>
            </div>
        </div>

        <div class="suite-results">
            <h3>📋 Test Suite Results</h3>
            ${this.allResults.suiteResults.map(suite => {
                if (suite.error) {
                    return `
                        <div class="suite-card suite-poor">
                            <div class="suite-name">💥 ${suite.suiteName}</div>
                            <div style="color: #dc3545;">FAILED: ${suite.error}</div>
                        </div>
                    `;
                } else {
                    const successRate = parseFloat(suite.successRate);
                    const suiteClass = successRate >= 80 ? 'suite-excellent' : 
                                     successRate >= 60 ? 'suite-good' : 
                                     successRate >= 40 ? 'suite-fair' : 'suite-poor';
                    
                    return `
                        <div class="suite-card ${suiteClass}">
                            <div class="suite-name">${suite.suiteName}</div>
                            <div class="suite-stats">
                                <div class="suite-stat">
                                    <div style="font-weight: bold;">${suite.totalTests}</div>
                                    <div>Total Tests</div>
                                </div>
                                <div class="suite-stat">
                                    <div style="font-weight: bold; color: #28a745;">${suite.passed}</div>
                                    <div>Passed</div>
                                </div>
                                <div class="suite-stat">
                                    <div style="font-weight: bold; color: #dc3545;">${suite.failed}</div>
                                    <div>Failed</div>
                                </div>
                                <div class="suite-stat">
                                    <div style="font-weight: bold; color: #ffc107;">${suite.errors}</div>
                                    <div>Errors</div>
                                </div>
                                <div class="suite-stat">
                                    <div style="font-weight: bold;">${suite.successRate}%</div>
                                    <div>Success Rate</div>
                                </div>
                            </div>
                            <div class="test-results">
                                ${suite.results.map(result => `
                                    <div class="test-result test-${result.status.toLowerCase()}">
                                        ${result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '💥'} 
                                        ${result.name}
                                        ${result.details ? `<br><small>${result.details}</small>` : ''}
                                        ${result.error ? `<br><small style="color: #dc3545;">Error: ${result.error}</small>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            }).join('')}
        </div>

        <div class="timestamp">
            Generated on ${new Date(this.allResults.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>`;

        const htmlPath = path.join(__dirname, 'test-results-master.html');
        fs.writeFileSync(htmlPath, html);
        console.log(`📄 Master HTML report saved to: ${htmlPath}`);
    }
}

// Run all test suites
async function main() {
    const runner = new MasterTestRunner();
    await runner.runAllTestSuites();
}

// Handle command line execution
if (require.main === module) {
    main().catch(console.error);
}

module.exports = MasterTestRunner;
