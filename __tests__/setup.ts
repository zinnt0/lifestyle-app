/**
 * Jest Test Setup
 *
 * Global configuration and mocks for test environment
 */

// Extend Jest matchers
import '@testing-library/jest-native/extend-expect';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error and warn for important messages
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
};

// Set test timezone to avoid date-related flakiness
process.env.TZ = 'Europe/Berlin';

// Mock Date.now() for consistent timestamps in tests
const mockNow = new Date('2024-01-15T12:00:00.000Z').getTime();
global.Date.now = jest.fn(() => mockNow);

// Global test utilities
export const createMockProfile = (overrides = {}) => ({
  gender: 'male',
  weight_kg: 75,
  height_cm: 180,
  age: 28,
  pal_factor: 1.55,
  training_goal: 'general_fitness',
  ...overrides,
});

// Tolerance helper for numerical comparisons
export const expectWithinTolerance = (
  actual: number,
  expected: number,
  tolerance: number = 5
) => {
  expect(actual).toBeGreaterThanOrEqual(expected - tolerance);
  expect(actual).toBeLessThanOrEqual(expected + tolerance);
};
