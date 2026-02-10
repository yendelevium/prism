// Test env fix: provide jest->vi shim and browser globals for jsdom tests.
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

globalThis.jest = vi as unknown as typeof globalThis.jest;

if (!globalThis.navigator) {
  // @ts-expect-error test shim
  globalThis.navigator = {};
}

if (!globalThis.navigator.clipboard) {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
    configurable: true,
  });
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
