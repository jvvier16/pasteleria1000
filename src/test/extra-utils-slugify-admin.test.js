import { describe, it, expect, beforeEach } from 'vitest';
import { slugify } from '../utils/slugify';
import { checkAdmin } from '../utils/adminHelper';

describe('Slugify & Admin helpers - extra tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('slugify returns empty string for falsy input', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });

  it('slugify normalizes accents and lowercases', () => {
    expect(slugify('Árbol')).toBe('arbol');
    expect(slugify('Ñandú')).toBe('nandu');
  });

  it('slugify removes punctuation and collapses spaces to dash', () => {
    expect(slugify('Pastel #1!')).toBe('pastel-1');
    expect(slugify('  Hola   Mundo  ')).toBe('hola-mundo');
  });

  it('slugify collapses multiple dashes', () => {
    expect(slugify('a -- b')).toBe('a-b');
  });

  it('slugify keeps numbers intact', () => {
    expect(slugify('Torta 24')).toBe('torta-24');
  });

  it('checkAdmin returns false when no session_user present', () => {
    localStorage.removeItem('session_user');
    expect(checkAdmin()).toBe(false);
  });

  it('checkAdmin returns false for non-admin role', () => {
    localStorage.setItem('session_user', JSON.stringify({ role: 'user' }));
    expect(checkAdmin()).toBe(false);
  });

  it('checkAdmin returns true for admin role', () => {
    localStorage.setItem('session_user', JSON.stringify({ role: 'admin' }));
    expect(checkAdmin()).toBe(true);
  });

  it('checkAdmin handles corrupted JSON gracefully', () => {
    localStorage.setItem('session_user', '{not-a-valid-json');
    expect(checkAdmin()).toBe(false);
  });
});
