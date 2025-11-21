// localstorageHelper: funciones utilitarias para manejar el carrito en localStorage.
// Exporta: getCart, saveCart, addToCart, updateQuantity, removeFromCart, clearCart, getTotal
const CART_KEY = "pasteleria_cart";

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error leyendo el carrito desde localStorage", e);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Error guardando el carrito en localStorage", e);
  }
}

function addToCart(product) {
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
  // notify other parts of the app in the same window
  try {
    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: cart }));
    }
  } catch (e) {
    // ignore in non-browser envs
  }
  return cart;
}

function updateQuantity(id, cantidad) {
  // respetar stock si existe
  const cart = getCart().map((i) => {
    if (i.id !== id) return i;
    const desired = Number(cantidad) || 1;
    const stock = i.stock ?? null;
    if (stock != null && desired > stock) return { ...i, cantidad: stock };
    return { ...i, cantidad: desired };
  });
  saveCart(cart);
  try {
    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: cart }));
    }
  } catch (e) {}
  return cart;
}

function removeFromCart(id) {
  const cart = getCart().filter((i) => i.id !== id);
  saveCart(cart);
  try {
    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: cart }));
    }
  } catch (e) {}
  return cart;
}

function clearCart() {
  saveCart([]);
  try {
    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: [] }));
    }
  } catch (e) {}
}

function getTotal() {
  return getCart().reduce(
    (acc, item) => acc + (Number(item.precio) || 0) * (item.cantidad || 1),
    0
  );
}

// Export named helpers explicitly. Prefer named exports to avoid import confusion
export {
  getCart,
  saveCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotal,
};