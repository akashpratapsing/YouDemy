import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

// jsdom does not implement these browser APIs used by Radix/Tailwind components.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  configurable: true,
  value: vi.fn(() => false),
});
Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  configurable: true,
  value: vi.fn(),
});
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  configurable: true,
  value: vi.fn(),
});

// ProseMirror (Tiptap) needs layout APIs that jsdom does not implement.
if (!document.elementFromPoint) {
  document.elementFromPoint = vi.fn(() => document.body);
}
if (!Element.prototype.getClientRects) {
  Element.prototype.getClientRects = vi.fn(() => [] as unknown as DOMRectList);
}
if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = vi.fn(() => [] as unknown as DOMRectList);
}
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = vi.fn(() => ({
    top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0,
    toJSON: () => ({}),
  }) as DOMRect);
}

// IFrame Player API stub: LearningPage dynamically loads the YT global.
Object.defineProperty(window, 'YT', {
  writable: true,
  value: undefined,
});
