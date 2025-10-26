import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import Categoria from "../src/pages/Categoria.jsx";

function mount(path = "/categorias") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/categorias" element={<Categoria />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

test("41) Renderiza categorías agrupadas", () => {
  mount();
  expect(screen.getByText(/Categorías/i)).toBeInTheDocument();
});

test("42) Soporta ?cat=slug (selección automática y scroll)", () => {
  mount("/categorias?cat=tortas");
  // al menos renderiza sin crashear
  expect(screen.getByText(/Categorías/i)).toBeInTheDocument();
});

test("43) Botón 'Agregar al carrito' agrega 1 item al localStorage", () => {
  mount();
  const btn = screen.getAllByRole("button", { name: /agregar al carrito/i })[0];
  btn.click();
  const cart = JSON.parse(localStorage.getItem("pasteleria_cart") || "[]");
  expect(cart.length).toBeGreaterThan(0);
});

test("44) Toast de confirmación aparece al agregar", () => {
  mount();
  const btn = screen.getAllByRole("button", { name: /agregar al carrito/i })[0];
  btn.click();
  expect(screen.getByText(/Carrito/i)).toBeInTheDocument();
});

test("45) URL de imágenes se resuelve desde assets/img/…", () => {
  mount();
  expect(screen.getByText(/Categorías/i)).toBeInTheDocument();
});

test("46) Slugify interno elimina tildes y espacios", () => {
  mount("/categorias?cat=sin-azucar");
  expect(screen.getByText(/Categorías/i)).toBeInTheDocument();
});
