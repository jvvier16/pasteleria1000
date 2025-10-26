import "@testing-library/jest-dom";

// Estos imports suponen helpers separados por responsabilidades.
// Ajusta rutas si difieren.
// TODO: ajusta rutas si difieren
import { slugify } from "../src/helpers/slugify";
import {
  getCart,
  setCart,
  cartCount,
  cartTotalMoney,
  addToCart,
  clearCart,
} from "../src/helpers/cart";
import {
  getSessionUser,
  setSessionUser,
  clearSessionUser,
} from "../src/helpers/session";

describe("Helpers – slugify", () => {
  test("10) slugify básico: 'Sin Azúcar' → 'sin-azucar'", () => {
    expect(slugify("Sin Azúcar")).toBe("sin-azucar");
  });

  test("11) slugify con signos y espacios: '  Torta  Especial! ' → 'torta-especial'", () => {
    expect(slugify("  Torta  Especial! ")).toBe("torta-especial");
  });
});

describe("Helpers – carrito", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCart?.();
  });

  test("12) addToCart + cartCount suman cantidad correcta", () => {
    addToCart(
      { id: 1, nombre: "Torta chocolate", precio: 45000, imagen: "a.webp" },
      2
    );
    addToCart({ id: 2, nombre: "Brownie", precio: 2000, imagen: "b.webp" }, 3);
    expect(cartCount()).toBe(5);
  });

  test("13) cartTotalMoney suma precios correctamente", () => {
    setCart([
      {
        id: 1,
        nombre: "Torta chocolate",
        precio: 45000,
        imagen: "a.webp",
        cantidad: 1,
      },
      { id: 2, nombre: "Brownie", precio: 2000, imagen: "b.webp", cantidad: 3 },
    ]);
    expect(cartTotalMoney()).toBe(45000 + 2000 * 3);
  });

  test("14) getCart y clearCart mantienen el estado esperado", () => {
    expect(getCart()).toEqual([]);
    addToCart({ id: 1, nombre: "Torta", precio: 1000, imagen: "x" }, 1);
    expect(getCart().length).toBe(1);
    clearCart();
    expect(getCart()).toEqual([]);
  });
});

describe("Helpers – sesión", () => {
  beforeEach(() => localStorage.clear());

  test("15) setSessionUser / getSessionUser / clearSessionUser", () => {
    const u = {
      id: 7,
      nombre: "Valentina",
      correo: "valen@example.com",
      role: "user",
    };
    setSessionUser(u);
    expect(getSessionUser()).toMatchObject({
      correo: "valen@example.com",
      role: "user",
    });
    clearSessionUser();
    expect(getSessionUser()).toBeNull();
  });
});
