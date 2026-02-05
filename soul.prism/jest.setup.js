import '@testing-library/jest-dom'

// Mocking Browsers ResizeObserver class
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};