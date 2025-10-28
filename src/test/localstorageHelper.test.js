import {
  getCart,
  saveCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotal,
} from "../utils/localstorageHelper";

beforeEach(() => localStorage.clear());

test("65) getCart vacío → []", () => {
  expect(getCart()).toEqual([]);
});

test("66) saveCart y getCart persisten", () => {
  saveCart([{ id: 1, cantidad: 2 }]);
  expect(getCart()).toEqual([{ id: 1, cantidad: 2 }]);
});

test("67) addToCart agrega nuevo item con cantidad por defecto 1", () => {
  addToCart({ id: 1, nombre: "A", precio: 1000 });
  expect(getCart()[0].cantidad).toBe(1);
});

test("68) addToCart respeta stock en item nuevo", () => {
  addToCart({ id: 2, nombre: "B", precio: 1000, cantidad: 10, stock: 3 });
  expect(getCart()[0].cantidad).toBe(3);
});

test("69) addToCart suma cantidad si ya existe y respeta stock", () => {
  addToCart({ id: 3, nombre: "C", precio: 1000, cantidad: 2, stock: 3 });
  addToCart({ id: 3, nombre: "C", precio: 1000, cantidad: 5, stock: 3 });
  expect(getCart()[0].cantidad).toBe(3);
});

test("70) updateQuantity no supera stock", () => {
  addToCart({ id: 4, nombre: "D", precio: 100, cantidad: 1, stock: 2 });
  updateQuantity(4, 99);
  expect(getCart()[0].cantidad).toBe(2);
});

test("71) updateQuantity aplica cantidad válida", () => {
  addToCart({ id: 5, nombre: "E", precio: 100, cantidad: 1 });
  updateQuantity(5, 4);
  expect(getCart()[0].cantidad).toBe(4);
});

test("72) removeFromCart elimina por id", () => {
  addToCart({ id: 7, nombre: "G", precio: 10 });
  addToCart({ id: 8, nombre: "H", precio: 10 });
  removeFromCart(7);
  expect(getCart().map(i => i.id)).toEqual([8]);
});

test("73) clearCart vacía carrito", () => {
  addToCart({ id: 9, nombre: "I", precio: 10 });
  clearCart();
  expect(getCart()).toEqual([]);
});

test("74) getTotal suma precio*cantidad", () => {
  saveCart([
    { id: 1, precio: 1000, cantidad: 2 },
    { id: 2, precio: 500, cantidad: 3 },
  ]);
  expect(getTotal()).toBe(1000 * 2 + 500 * 3);
});

test("75) localStorage corrupto en CART_KEY no crashea", () => {
  localStorage.setItem("pasteleria_cart", "{mal-json");
  expect(getCart()).toEqual([]);
});
