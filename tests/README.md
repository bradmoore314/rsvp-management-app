# Testing Guide for "Yes or No Invites"

This directory contains comprehensive tests for the RSVP management application. The test suite includes unit tests, integration tests, end-to-end tests, and manual testing scripts.

## 📁 Test Structure

```
tests/
├── unit/                    # Unit tests for individual services
│   ├── eventService.test.js
│   ├── qrCodeService.test.js
│   └── rsvpService.test.js
├── integration/             # Integration tests for API endpoints
│   └── api.test.js
├── e2e/                     # End-to-end workflow tests
│   └── complete-workflow.test.js
├── manual/                  # Manual testing scripts and checklists
│   ├── test-checklist.md
│   └── run-manual-tests.js
├── setup.js                 # Jest setup configuration
├── run-all-tests.js         # Comprehensive test runner
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Test Dependencies**
   ```bash
   npm install --save-dev jest supertest
   ```

3. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running Tests

#### Run All Tests
```bash
npm run test:all
# or
node tests/run-all-tests.js
```

#### Run Specific Test Types

**Unit Tests Only**
```bash
npm test
# or
npx jest tests/unit
```

**Integration Tests Only**
```bash
npm run test:integration
# or
npx jest tests/integration
```

**End-to-End Tests Only**
```bash
npx jest tests/e2e
```

**Manual Tests Only**
```bash
npm run test:manual
# or
node tests/manual/run-manual-tests.js
```

#### Run Tests with Coverage
```bash
npm run test:coverage
```

#### Run Tests in Watch Mode
```bash
npm run test:watch
```

## 🧪 Test Types

### 1. Unit Tests

Unit tests verify individual components in isolation:

- **EventService**: Event creation, retrieval, updating, deletion
- **RSVPService**: RSVP submission, validation, statistics
- **QRCodeService**: QR code generation, file handling

**Example:**
```javascript
test('should create a new event with all required fields', async () => {
    const eventData = {
        name: 'Test Event',
        date: '2025-12-25',
        // ... other fields
    };
    
    const event = await eventService.createEvent(eventData);
    
    expect(event).toBeDefined();
    expect(event.name).toBe('Test Event');
});
```

### 2. Integration Tests

Integration tests verify API endpoints and service interactions:

- **Event Management API**: CRUD operations
- **RSVP API**: Form serving and submission
- **Invite API**: Generation and retrieval
- **Error Handling**: Invalid requests and responses

**Example:**
```javascript
test('POST /events - should create a new event', async () => {
    const response = await request(app)
        .post('/events')
        .send(eventData)
        .expect(200);
        
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Test Event');
});
```

### 3. End-to-End Tests

E2E tests verify complete user workflows:

- **Complete Event Lifecycle**: Create → Generate Invites → Submit RSVPs → View Results
- **Data Persistence**: Events and RSVPs survive server restarts
- **Error Scenarios**: Invalid data handling
- **Data Validation**: Email, date, and other field validation

**Example:**
```javascript
test('Complete Event Management Workflow', async () => {
    // 1. Create event
    const event = await createEvent();
    
    // 2. Generate invites
    const invites = await generateInvites(event.id);
    
    // 3. Submit RSVPs
    await submitRSVPs(invites);
    
    // 4. Verify data
    const stats = await getEventStats(event.id);
    expect(stats.totalResponses).toBe(4);
});
```

### 4. Manual Tests

Manual tests provide automated checks and manual verification guides:

- **Environment Checks**: Server status, dependencies, configuration
- **API Health Checks**: Basic endpoint functionality
- **Manual Testing Checklist**: Comprehensive verification guide
- **Test Reports**: HTML and JSON reports

**Example:**
```bash
node tests/manual/run-manual-tests.js
# Generates: manual-test-report.html
```

## 📊 Test Reports

### Coverage Reports

Jest generates coverage reports in the `coverage/` directory:

- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **Text Summary**: Console output

### Test Results

Test runners generate detailed reports:

- **JSON Report**: `tests/test-results.json`
- **HTML Report**: `tests/test-results.html`
- **Manual Report**: `tests/manual/manual-test-report.html`

## 🔧 Configuration

### Jest Configuration

Jest is configured in `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### Test Setup

Tests are configured in `tests/setup.js`:

- Environment variables
- Global test utilities
- Mock configurations
- Cleanup procedures

## 🐛 Debugging Tests

### Common Issues

1. **Server Not Running**
   ```bash
   # Start server in another terminal
   npm start
   ```

2. **Environment Variables Missing**
   ```bash
   # Check .env file
   cat .env
   ```

3. **Dependencies Missing**
   ```bash
   # Install missing packages
   npm install
   ```

### Debug Mode

Run tests with debug output:

```bash
DEBUG=* npm test
```

### Verbose Output

Get detailed test information:

```bash
npx jest --verbose
```

## 📝 Writing Tests

### Test Structure

```javascript
describe('ServiceName', () => {
    let service;
    
    beforeEach(() => {
        service = new ServiceName();
        // Setup
    });
    
    afterEach(() => {
        // Cleanup
    });
    
    describe('methodName', () => {
        test('should do something', async () => {
            // Arrange
            const input = 'test data';
            
            // Act
            const result = await service.methodName(input);
            
            // Assert
            expect(result).toBeDefined();
            expect(result).toEqual(expectedOutput);
        });
    });
});
```

### Best Practices

1. **Test Naming**: Use descriptive test names
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock Dependencies**: Isolate units under test
4. **Test Edge Cases**: Include error scenarios
5. **Clean Up**: Reset state between tests

### Mocking

```javascript
// Mock external dependencies
jest.mock('googleapis', () => ({
    google: {
        drive: jest.fn(() => ({
            files: {
                list: jest.fn(),
                create: jest.fn()
            }
        }))
    }
}));
```

## 🚀 Continuous Integration

### GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:all
```

### Pre-commit Hooks

Install husky for pre-commit testing:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test"
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🤝 Contributing

When adding new features:

1. Write unit tests for new services
2. Add integration tests for new API endpoints
3. Update E2E tests for new workflows
4. Update manual test checklist
5. Ensure all tests pass before submitting

## 📞 Support

If you encounter issues with tests:

1. Check the test logs for error messages
2. Verify environment configuration
3. Ensure all dependencies are installed
4. Check server status and connectivity
5. Review the test reports for detailed information
