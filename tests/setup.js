// Test setup file for Jest
// This file runs before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.APP_URL = 'http://localhost:3001';

// Mock console methods to reduce noise during tests
const originalConsole = global.console;

global.console = {
  ...originalConsole,
  // Keep error and warn for debugging
  error: originalConsole.error,
  warn: originalConsole.warn,
  // Mock info and log to reduce noise
  info: jest.fn(),
  log: jest.fn(),
  debug: jest.fn()
};

// Global test utilities
global.testUtils = {
  // Generate test data
  generateTestEvent: () => ({
    name: 'Test Event',
    description: 'Test Description',
    date: '2025-12-25',
    time: '7:00 PM',
    location: 'Test Location',
    hostName: 'Test Host',
    hostEmail: 'test@example.com',
    showDietaryRestrictions: true,
    showDressCode: false,
    showHostMessage: true,
    dressCode: '',
    hostMessage: 'Test message',
    eventCategory: 'Test',
    eventTags: ['test'],
    status: 'active',
    reminderEnabled: false,
    dietaryOptions: ['Vegetarian', 'Vegan', 'No Restrictions']
  }),

  generateTestRSVP: (eventId, inviteId) => ({
    eventId: eventId || 'test-event-id',
    inviteId: inviteId || 'test-invite-id',
    guestName: 'Test Guest',
    guestEmail: 'test@example.com',
    guestPhone: '555-1234',
    emergencyContact: 'Emergency Contact - 555-5678',
    attendance: 'yes',
    guestCount: 1,
    dietaryOptions: ['Vegetarian'],
    dietaryRestrictions: 'No nuts',
    message: 'Test message',
    timestamp: new Date().toISOString()
  }),

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock fetch responses
  mockFetch: (response, status = 200) => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status: status,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response))
      })
    );
  },

  // Reset fetch mock
  resetFetch: () => {
    if (global.fetch && global.fetch.mockReset) {
      global.fetch.mockReset();
    }
  }
};

// Clean up after each test
afterEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Reset fetch mock
  global.testUtils.resetFetch();
});

// Clean up after all tests
afterAll(() => {
  // Restore original console
  global.console = originalConsole;
});
