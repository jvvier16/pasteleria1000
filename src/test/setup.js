import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock global.jest para compatibilidad
global.jest = {
  restoreAllMocks: vi.restoreAllMocks,
  spyOn: vi.spyOn,
  fn: vi.fn
};

// Mock window.confirm
window.confirm = vi.fn(() => true);

// Limpiar después de cada prueba
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});