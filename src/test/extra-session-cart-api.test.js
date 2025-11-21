import { describe, it, expect, beforeEach } from 'vitest';
import * as session from '../utils/session';
import * as cartApi from '../utils/cart';
import * as ls from '../utils/localstorageHelper';

describe('Session and cart API wrappers - extra tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getSessionUser returns null by default', () => {
    expect(session.getSessionUser()).toBeNull();
  });

  it('setSessionUser and getSessionUser roundtrip', () => {
    const u = { id: 10, name: 'Test' };
    session.setSessionUser(u);
    expect(session.getSessionUser()).toEqual(u);
  });

  it('clearSessionUser removes session', () => {
    session.setSessionUser({ id: 1 });
    session.clearSessionUser();
    expect(session.getSessionUser()).toBeNull();
  });

  it('cart.cartCount sums cantidades', () => {
    ls.saveCart([{ id: 'a', cantidad: 2 }, { id: 'b', cantidad: 3 }]);
    expect(cartApi.cartCount()).toBe(5);
  });

  it('cart.cartTotalMoney delegates to getTotal', () => {
    ls.saveCart([{ id: 'm1', cantidad: 2, precio: 3 }]);
    expect(cartApi.cartTotalMoney()).toBe(6);
  });

  it('cart.addToCart wrapper adds with given cantidad', () => {
    const p = { id: 'wrap1', precio: 4 };
    cartApi.addToCart(p, 3);
    const item = ls.getCart().find((i) => i.id === 'wrap1');
    expect(item.cantidad).toBe(3);
  });

  it('cart.clearCart empties via wrapper', () => {
    ls.saveCart([{ id: 'z', cantidad: 1 }]);
    cartApi.clearCart();
    expect(ls.getCart()).toEqual([]);
  });

  it('setCart (saveCart) followed by getCart returns same content', () => {
    cartApi.setCart([{ id: 'zz', cantidad: 7 }]);
    expect(cartApi.getCart()).toEqual([{ id: 'zz', cantidad: 7 }]);
  });

  it('getTotal treats non-number precio as 0', () => {
    ls.saveCart([{ id: 'n1', precio: 'not-a-number', cantidad: 3 }]);
    expect(cartApi.cartTotalMoney()).toBe(0);
  });

  it('addToCart returns array and contains correct cantidad', () => {
    const out = cartApi.addToCart({ id: 'final1', precio: 2 }, 2);
    expect(Array.isArray(out)).toBe(true);
    const it = out.find((i) => i.id === 'final1');
    expect(it.cantidad).toBe(2);
  });
});
