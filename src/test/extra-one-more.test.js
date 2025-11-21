import { it, expect } from 'vitest';
import slugify from '../utils/slugify';

it('slugify removes emoji and special symbols and normalizes accents', () => {
  const input = 'Pastel 🎂 del día!';
  const out = slugify(input);
  expect(out).toBe('pastel-del-dia');
});
