// localstorageHelper: funciones utilitarias para manejar el carrito en localStorage.
// Exporta: getCart, saveCart, addToCart, updateQuantity, removeFromCart, clearCart, getTotal
const CART_KEY = "pasteleria_cart";

export function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error leyendo el carrito desde localStorage", e);
    return [];
  }
}

export function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Error guardando el carrito en localStorage", e);
  }
}

export function addToCart(product) {
  const qty = Number(product.cantidad) || 1;
  const cart = getCart();
  const existing = cart.find((i) => i.id === product.id);
  // intentar obtener stock desde el objeto pasado o desde el item existente
  const stock = product.stock ?? existing?.stock ?? null;
  if (existing) {
    const newQty = (existing.cantidad || 0) + qty;
    if (stock != null && newQty > stock) {
      existing.cantidad = stock;
    } else {
      existing.cantidad = newQty;
    }
  } else {
    const toAdd = { ...product, cantidad: qty };
    if (stock != null && toAdd.cantidad > stock) toAdd.cantidad = stock;
    cart.push(toAdd);
  }
  saveCart(cart);
  return cart;
}

export function updateQuantity(id, cantidad) {
  // respetar stock si existe
  const cart = getCart().map((i) => {
    if (i.id !== id) return i;
    const desired = Number(cantidad) || 1;
    const stock = i.stock ?? null;
    if (stock != null && desired > stock) return { ...i, cantidad: stock };
    return { ...i, cantidad: desired };
  });
  saveCart(cart);
  return cart;
}

export function removeFromCart(id) {
  const cart = getCart().filter((i) => i.id !== id);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}

export function getTotal() {
  return getCart().reduce(
    (acc, item) => acc + (Number(item.precio) || 0) * (item.cantidad || 1),
    0
  );
}

export default {
  getCart,
  saveCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotal,
};