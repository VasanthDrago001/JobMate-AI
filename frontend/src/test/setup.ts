import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock window.scrollTo for jsdom environment
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});
