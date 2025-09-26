#!/usr/bin/env node

/**
 * Comprehensive Test Runner for "Yes or No Invites"
 * 
 * This script runs all types of tests:
 * - Unit tests (Jest)
 * - Integration tests
 * - End-to-end tests
 * - Manual tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            unit: { passed: 0, failed: 0, total: 0 },
            integration: { passed: 0, failed: 0, total: 0 },
            e2e: { passed: 0, failed: 0, total: 0 },
            manual: { passed: 0, failed: 0, total: 0 },
            summary: { passed: 0, failed: 0, total: 0 }
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            test: '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async runCommand(command, description) {
        try {
            this.log(`Running: ${description}`, 'test');
            const output = execSync(command, { 
                encoding: 'utf8', 
                stdio: 'pipe',
                cwd: process.cwd()
            });
            return { success: true, output };
        } catch (error) {
            return { success: false, error: error.message, output: error.stdout || error.stderr };
        }
    }

    async runUnitTests() {
        this.log('🧪 Running Unit Tests...', 'info');
        
        try {
            // Check if Jest is available
            const jestCheck = await this.runCommand('npx jest --version', 'Checking Jest availability');
            if (!jestCheck.success) {
                this.log('⚠️ Jest not available, installing...', 'warning');
                await this.runCommand('npm install --save-dev jest supertest', 'Installing Jest');
            }

            // Run unit tests
            const result = await this.runCommand('npx jest tests/unit --verbose', 'Running unit tests');
            
            if (result.success) {
                this.log('✅ Unit tests completed successfully', 'success');
                this.results.unit.passed = this.parseJestOutput(result.output).passed;
                this.results.unit.failed = this.parseJestOutput(result.output).failed;
                this.results.unit.total = this.results.unit.passed + this.results.unit.failed;
            } else {
                this.log('❌ Unit tests failed', 'error');
                this.results.unit.failed = 1;
                this.results.unit.total = 1;
                console.log(result.output);
            }
        } catch (error) {
            this.log(`❌ Unit tests error: ${error.message}`, 'error');
            this.results.unit.failed = 1;
            this.results.unit.total = 1;
        }
    }

    async runIntegrationTests() {
        this.log('🔗 Running Integration Tests...', 'info');
        
        try {
            const result = await this.runCommand('npx jest tests/integration --verbose', 'Running integration tests');
            
            if (result.success) {
                this.log('✅ Integration tests completed successfully', 'success');
                this.results.integration.passed = this.parseJestOutput(result.output).passed;
                this.results.integration.failed = this.parseJestOutput(result.output).failed;
                this.results.integration.total = this.results.integration.passed + this.results.integration.failed;
            } else {
                this.log('❌ Integration tests failed', 'error');
                this.results.integration.failed = 1;
                this.results.integration.total = 1;
                console.log(result.output);
            }
        } catch (error) {
            this.log(`❌ Integration tests error: ${error.message}`, 'error');
            this.results.integration.failed = 1;
            this.results.integration.total = 1;
        }
    }

    async runE2ETests() {
        this.log('🌐 Running End-to-End Tests...', 'info');
        
        try {
            const result = await this.runCommand('npx jest tests/e2e --verbose', 'Running E2E tests');
            
            if (result.success) {
                this.log('✅ E2E tests completed successfully', 'success');
                this.results.e2e.passed = this.parseJestOutput(result.output).passed;
                this.results.e2e.failed = this.parseJestOutput(result.output).failed;
                this.results.e2e.total = this.results.e2e.passed + this.results.e2e.failed;
            } else {
                this.log('❌ E2E tests failed', 'error');
                this.results.e2e.failed = 1;
                this.results.e2e.total = 1;
                console.log(result.output);
            }
        } catch (error) {
            this.log(`❌ E2E tests error: ${error.message}`, 'error');
            this.results.e2e.failed = 1;
            this.results.e2e.total = 1;
        }
    }

    async runManualTests() {
        this.log('👤 Running Manual Tests...', 'info');
        
        try {
            const result = await this.runCommand('node tests/manual/run-manual-tests.js', 'Running manual tests');
            
            if (result.success) {
                this.log('✅ Manual tests completed successfully', 'success');
                // Parse manual test results from the output
                const manualResults = this.parseManualTestOutput(result.output);
                this.results.manual.passed = manualResults.passed;
                this.results.manual.failed = manualResults.failed;
                this.results.manual.total = manualResults.total;
            } else {
                this.log('❌ Manual tests failed', 'error');
                this.results.manual.failed = 1;
                this.results.manual.total = 1;
                console.log(result.output);
            }
        } catch (error) {
            this.log(`❌ Manual tests error: ${error.message}`, 'error');
            this.results.manual.failed = 1;
            this.results.manual.total = 1;
        }
    }

    parseJestOutput(output) {
        // Parse Jest output to extract test results
        const passedMatch = output.match(/(\d+) passed/);
        const failedMatch = output.match(/(\d+) failed/);
        
        return {
            passed: passedMatch ? parseInt(passedMatch[1]) : 0,
            failed: failedMatch ? parseInt(failedMatch[1]) : 0
        };
    }

    parseManualTestOutput(output) {
        // Parse manual test output to extract results
        const totalMatch = output.match(/Total Tests: (\d+)/);
        const passedMatch = output.match(/Passed: (\d+)/);
        const failedMatch = output.match(/Failed: (\d+)/);
        
        return {
            total: totalMatch ? parseInt(totalMatch[1]) : 0,
            passed: passedMatch ? parseInt(passedMatch[1]) : 0,
            failed: failedMatch ? parseInt(failedMatch[1]) : 0
        };
    }

    calculateSummary() {
        this.results.summary.total = 
            this.results.unit.total + 
            this.results.integration.total + 
            this.results.e2e.total + 
            this.results.manual.total;
            
        this.results.summary.passed = 
            this.results.unit.passed + 
            this.results.integration.passed + 
            this.results.e2e.passed + 
            this.results.manual.passed;
            
        this.results.summary.failed = 
            this.results.unit.failed + 
            this.results.integration.failed + 
            this.results.e2e.failed + 
            this.results.manual.failed;
    }

    generateReport() {
        this.calculateSummary();
        
        const reportPath = path.join(__dirname, 'test-results.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        const htmlReport = this.generateHTMLReport();
        const htmlReportPath = path.join(__dirname, 'test-results.html');
        fs.writeFileSync(htmlReportPath, htmlReport);
        
        this.log(`📊 Test report generated: ${reportPath}`, 'success');
        this.log(`📊 HTML report generated: ${htmlReportPath}`, 'success');
    }

    generateHTMLReport() {
        const passRate = ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1);
        const statusColor = passRate >= 80 ? '#4CAF50' : passRate >= 60 ? '#FF9800' : '#F44336';
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Results - Yes or No Invites</title>
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
        .test-types { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .test-type { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .test-type h3 { margin-top: 0; }
        .test-stats { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .test-stat { text-align: center; }
        .test-stat .number { font-size: 1.5em; font-weight: bold; }
        .test-stat .label { font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Results</h1>
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

        <div class="test-types">
            <div class="test-type">
                <h3>🧪 Unit Tests</h3>
                <div class="test-stats">
                    <div class="test-stat">
                        <div class="number passed">${this.results.unit.passed}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="test-stat">
                        <div class="number failed">${this.results.unit.failed}</div>
                        <div class="label">Failed</div>
                    </div>
                    <div class="test-stat">
                        <div class="number">${this.results.unit.total}</div>
                        <div class="label">Total</div>
                    </div>
                </div>
            </div>

            <div class="test-type">
                <h3>🔗 Integration Tests</h3>
                <div class="test-stats">
                    <div class="test-stat">
                        <div class="number passed">${this.results.integration.passed}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="test-stat">
                        <div class="number failed">${this.results.integration.failed}</div>
                        <div class="label">Failed</div>
                    </div>
                    <div class="test-stat">
                        <div class="number">${this.results.integration.total}</div>
                        <div class="label">Total</div>
                    </div>
                </div>
            </div>

            <div class="test-type">
                <h3>🌐 E2E Tests</h3>
                <div class="test-stats">
                    <div class="test-stat">
                        <div class="number passed">${this.results.e2e.passed}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="test-stat">
                        <div class="number failed">${this.results.e2e.failed}</div>
                        <div class="label">Failed</div>
                    </div>
                    <div class="test-stat">
                        <div class="number">${this.results.e2e.total}</div>
                        <div class="label">Total</div>
                    </div>
                </div>
            </div>

            <div class="test-type">
                <h3>👤 Manual Tests</h3>
                <div class="test-stats">
                    <div class="test-stat">
                        <div class="number passed">${this.results.manual.passed}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="test-stat">
                        <div class="number failed">${this.results.manual.failed}</div>
                        <div class="label">Failed</div>
                    </div>
                    <div class="test-stat">
                        <div class="number">${this.results.manual.total}</div>
                        <div class="label">Total</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    printSummary() {
        this.calculateSummary();
        
        this.log('=' .repeat(60), 'info');
        this.log('📊 TEST SUMMARY', 'info');
        this.log('=' .repeat(60), 'info');
        
        this.log(`🧪 Unit Tests:     ${this.results.unit.passed}/${this.results.unit.total} passed`, 
                 this.results.unit.failed === 0 ? 'success' : 'error');
        this.log(`🔗 Integration:    ${this.results.integration.passed}/${this.results.integration.total} passed`, 
                 this.results.integration.failed === 0 ? 'success' : 'error');
        this.log(`🌐 E2E Tests:      ${this.results.e2e.passed}/${this.results.e2e.total} passed`, 
                 this.results.e2e.failed === 0 ? 'success' : 'error');
        this.log(`👤 Manual Tests:   ${this.results.manual.passed}/${this.results.manual.total} passed`, 
                 this.results.manual.failed === 0 ? 'success' : 'error');
        
        this.log('-' .repeat(60), 'info');
        this.log(`📈 Total:          ${this.results.summary.passed}/${this.results.summary.total} passed`, 
                 this.results.summary.failed === 0 ? 'success' : 'error');
        
        const passRate = ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1);
        this.log(`📊 Pass Rate:      ${passRate}%`, 
                 passRate >= 80 ? 'success' : passRate >= 60 ? 'warning' : 'error');
        
        if (this.results.summary.failed === 0) {
            this.log('🎉 All tests passed!', 'success');
        } else {
            this.log(`⚠️ ${this.results.summary.failed} test(s) failed. Check the reports for details.`, 'warning');
        }
    }

    async run() {
        this.log('🚀 Starting Comprehensive Test Suite for "Yes or No Invites"', 'info');
        this.log('=' .repeat(60), 'info');
        
        // Run all test types
        await this.runUnitTests();
        await this.runIntegrationTests();
        await this.runE2ETests();
        await this.runManualTests();
        
        // Generate reports
        this.generateReport();
        
        // Print summary
        this.printSummary();
    }
}

// Run the tests
if (require.main === module) {
    const runner = new TestRunner();
    runner.run().catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = TestRunner;
