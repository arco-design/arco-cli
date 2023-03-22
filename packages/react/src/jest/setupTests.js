// add babel-polyfill.
// require('babel-polyfill');
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom/extend-expect');

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

Object.defineProperty(global, 'localStorage', {
  value: {
    store: {},
    setItem(key, value) {
      this.store[key] = value;
    },
    getItem(key) {
      return this.store[key];
    },
    removeItem(key) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    },
  },
  configurable: true,
});

Object.defineProperty(global, 'ResizeObserver', {
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
  configurable: true,
});
