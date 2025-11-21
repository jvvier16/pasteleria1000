import { describe, it, beforeEach, expect } from 'vitest';
import { slugify } from '../utils/slugify.js';
import * as ls from '../utils/localstorageHelper.js';
import * as cart from '../utils/cart.js';
import * as session from '../utils/session.js';
import { checkAdmin } from '../utils/adminHelper.js';

// Clean localStorage between tests
beforeEach(() => {
  localStorage.clear();
});

describe('Utilities extra tests (25)', () => {
  // Slugify tests (5)
  it('slugify: removes accents and lowercases', () => {
    expect(slugify('Árbol de TÁCTO')).toBe('arbol-de-tacto');
  });

  it('slugify: removes punctuation and extra spaces', () => {
    expect(slugify("  Torta  Especial! ")).toBe('torta-especial');
  });

  it('slugify: handles empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('slugify: keeps numbers and hyphens', () => {
    expect(slugify('Promo 2025 - Especial')).toBe('promo-2025-especial');
  });

  it('slugify: collapses multiple hyphens', () => {
    expect(slugify('A   B -- C')).toBe('a-b-c');
  });

  // localstorageHelper tests (10)
  it('getCart returns [] when empty', () => {
    expect(ls.getCart()).toEqual([]);
  });

  it('saveCart and getCart persist', () => {
    ls.saveCart([{ id: 1, cantidad: 2 }]);
    expect(ls.getCart()).toEqual([{ id: 1, cantidad: 2 }]);
  });

  it('addToCart adds new product with default cantidad 1', () => {
    const p = { id: 5, nombre: 'X' };
    const res = ls.addToCart(p);
    expect(res.find(i => i.id === 5).cantidad).toBe(1);
  });

  it('addToCart respects stock when adding more than stock', () => {
    const p = { id: 6, nombre: 'Y', cantidad: 10, stock: 3 };
    const res = ls.addToCart(p);
    expect(res.find(i => i.id === 6).cantidad).toBe(3);
  });

  it('addToCart increments existing item cantidad', () => {
    ls.saveCart([{ id: 7, nombre: 'Z', cantidad: 1 }]);
    ls.addToCart({ id: 7, cantidad: 2 });
    const found = ls.getCart().find(i => i.id === 7);
    expect(found.cantidad).toBe(3);
  });

  it('updateQuantity caps at stock if greater', () => {
    ls.saveCart([{ id: 8, nombre: 'C', cantidad: 1, stock: 5 }]);
    ls.updateQuantity(8, 10);
    const found = ls.getCart().find(i => i.id === 8);
    expect(found.cantidad).toBe(5);
  });

  it('updateQuantity sets quantity correctly when valid', () => {
    ls.saveCart([{ id: 9, nombre: 'D', cantidad: 2, stock: 10 }]);
    ls.updateQuantity(9, 4);
    const found = ls.getCart().find(i => i.id === 9);
    expect(found.cantidad).toBe(4);
  });

  it('removeFromCart removes item', () => {
    ls.saveCart([{ id: 10, cantidad: 1 }, { id: 11, cantidad: 2 }]);
    ls.removeFromCart(10);
    expect(ls.getCart().find(i => i.id === 10)).toBeUndefined();
  });

  it('clearCart empties cart', () => {
    ls.saveCart([{ id: 12, cantidad: 2 }]);
    ls.clearCart();
    expect(ls.getCart()).toEqual([]);
  });

  it('getTotal computes total price', () => {
    ls.saveCart([{ id: 13, precio: 100, cantidad: 2 }, { id: 14, precio: 50, cantidad: 1 }]);
    expect(ls.getTotal()).toBe(250);
  });

  // cart wrappers (4)
  it('cart.getCart wrapper returns same as localstorage helper', () => {
    ls.saveCart([{ id: 20, cantidad: 1 }]);
    expect(cart.getCart()).toEqual(ls.getCart());
  });

  it('cart.cartCount sums quantities', () => {
    ls.saveCart([{ id: 21, cantidad: 2 }, { id: 22, cantidad: 3 }]);
    expect(cart.cartCount()).toBe(5);
  });

  it('cart.cartTotalMoney returns total via helper', () => {
    ls.saveCart([{ id: 23, precio: 10, cantidad: 3 }]);
    expect(cart.cartTotalMoney()).toBe(30);
  });

  it('cart.addToCart wrapper adds product with cantidad', () => {
    cart.addToCart({ id: 24, nombre: 'Wrap' }, 2);
    const f = ls.getCart().find(i => i.id === 24);
    expect(f.cantidad).toBe(2);
  });

  // session helpers (3)
  it('session set/get/clear session_user', () => {
    session.setSessionUser({ correo: 'a@b', role: 'user' });
    expect(session.getSessionUser().correo).toBe('a@b');
    session.clearSessionUser();
    expect(session.getSessionUser()).toBeNull();
  });

  it('getSessionUser returns null for invalid JSON', () => {
    localStorage.setItem('session_user', '{badjson');
    expect(session.getSessionUser()).toBeNull();
  });

  it('setSessionUser does not throw on circular structures', () => {
    const o = {}; o.self = o; // circular
    // should not throw
    expect(() => session.setSessionUser(o)).not.toThrow();
  });

  // adminHelper (3)
  it('checkAdmin returns false when no session', () => {
    expect(checkAdmin()).toBe(false);
  });

  it('checkAdmin returns false when role is user', () => {
    session.setSessionUser({ correo: 'x', role: 'user' });
    expect(checkAdmin()).toBe(false);
  });

  it('checkAdmin returns true when role is admin', () => {
    session.setSessionUser({ correo: 'adm', role: 'admin' });
    expect(checkAdmin()).toBe(true);
  });

});
