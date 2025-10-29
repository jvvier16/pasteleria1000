import * as ls from "./localstorageHelper";

export function getCart() {
  return ls.getCart();
}
export function setCart(cart) {
  return ls.saveCart(cart);
}
export function cartCount() {
  return ls.getCart().reduce((acc, it) => acc + (it.cantidad || 0), 0);
}
export function cartTotalMoney() {
  return ls.getTotal();
}
export function addToCart(product, cantidad = 1) {
  const p = { ...product, cantidad };
  return ls.addToCart(p);
}
export function clearCart() {
  return ls.clearCart();
}

export default {
  getCart,
  setCart,
  cartCount,
  cartTotalMoney,
  addToCart,
  clearCart,
};
