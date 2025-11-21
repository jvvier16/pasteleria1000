import { describe, it, expect, beforeEach } from 'vitest';
import * as ls from '../utils/localstorageHelper';

describe('LocalStorage cart helper - extra tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getCart returns empty array when nothing stored', () => {
    expect(ls.getCart()).toEqual([]);
  });

  it('addToCart adds a product to the cart', () => {
    const p = { id: 'p1', nombre: 'Pastelito', precio: 10 };
    const cart = ls.addToCart(p);
    expect(Array.isArray(cart)).toBe(true);
    expect(cart.length).toBe(1);
    expect(cart[0].id).toBe('p1');
    expect(cart[0].cantidad).toBe(1);
  });

  it('addToCart increases cantidad when adding same product', () => {
    const p = { id: 'p2', nombre: 'Torta', precio: 20 };
    ls.addToCart(p);
    const cart2 = ls.addToCart({ ...p, cantidad: 2 });
    const item = cart2.find((i) => i.id === 'p2');
    expect(item.cantidad).toBeGreaterThanOrEqual(2);
  });

  it('addToCart respects stock when provided', () => {
    const p = { id: 'p3', nombre: 'Cupcake', precio: 3, stock: 2 };
    ls.addToCart({ ...p, cantidad: 5 });
    const item = ls.getCart().find((i) => i.id === 'p3');
    expect(item.cantidad).toBe(2);
  });

  it('updateQuantity sets cantidad and respects stock', () => {
    const p = { id: 'p4', nombre: 'Brownie', precio: 5, stock: 3 };
    ls.addToCart(p);
    ls.updateQuantity('p4', 10);
    const item = ls.getCart().find((i) => i.id === 'p4');
    expect(item.cantidad).toBe(3);
  });

  it('removeFromCart removes specified item', () => {
    ls.addToCart({ id: 'x1', precio: 1 });
    ls.addToCart({ id: 'x2', precio: 2 });
    ls.removeFromCart('x1');
    const keys = ls.getCart().map((i) => i.id);
    expect(keys).not.toContain('x1');
    expect(keys).toContain('x2');
  });

  it('clearCart empties the cart', () => {
    ls.addToCart({ id: 'c1', precio: 1 });
    ls.clearCart();
    expect(ls.getCart()).toEqual([]);
  });

  it('getTotal computes sum correctly', () => {
    ls.clearCart();
    ls.addToCart({ id: 't1', precio: 2, cantidad: 2 });
    ls.addToCart({ id: 't2', precio: 3, cantidad: 1 });
    expect(ls.getTotal()).toBe(7);
  });

  it('saveCart and getCart persist JSON', () => {
    ls.saveCart([{ id: 's1', cantidad: 4 }]);
    const c = ls.getCart();
    expect(c.length).toBe(1);
    expect(c[0].id).toBe('s1');
  });

  it('addToCart dispatches cartUpdated event in window', () => {
    return new Promise((resolve, reject) => {
      function handler(e) {
        try {
          expect(Array.isArray(e.detail)).toBe(true);
          window.removeEventListener('cartUpdated', handler);
          resolve();
        } catch (err) { reject(err); }
      }
      window.addEventListener('cartUpdated', handler);
      ls.addToCart({ id: 'evt1', precio: 1 });
    });
  });
});
