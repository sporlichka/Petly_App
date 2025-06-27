// Jest setup file for performance testing
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
}));

// Mock react-native-feather
jest.mock('react-native-feather', () => ({
  Plus: 'Plus',
  Calendar: 'Calendar',
  FileText: 'FileText',
  Edit2: 'Edit2',
  Trash2: 'Trash2',
  Heart: 'Heart',
  Repeat: 'Repeat',
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock Picker
jest.mock('@react-native-picker/picker', () => ({
  Picker: 'Picker',
}));

// Performance testing utilities
global.performance = {
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  now: jest.fn(() => Date.now()),
};

// Mock console methods for performance testing
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Performance measurement helper
global.measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start}ms`);
  return result;
};

// Memory usage helper
global.getMemoryUsage = () => {
  if (global.performance && global.performance.memory) {
    return global.performance.memory;
  }
  return { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
};

// Setup test environment
beforeAll(() => {
  // Set up any global test configuration
});

afterAll(() => {
  // Clean up any global test configuration
}); 