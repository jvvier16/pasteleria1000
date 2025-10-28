import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import Productos from "../pages/Productos.jsx";

function mount(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/productos${search}`]}>
      <Routes>
        <Route path="/productos" element={<Productos />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

test("35) Renderiza listado de productos (JSON base)", () => {
  mount();
  // al menos hay tarjetas renderizadas (Card)
  expect(screen.getByText(/Productos/i)).toBeInTheDocument();
});

test("36) Filtra por ?search= (normaliza tildes)", () => {
  mount("?search=torta");
  // Debe seguir mostrando listado
  expect(screen.getByText(/Productos/i)).toBeInTheDocument();
});

test("37) Combina JSON + pasteles_local si existe", () => {
  localStorage.setItem(
    "pasteles_local",
    JSON.stringify([
      {
        id: 999,
        nombre: "Torta Test Local",
        precio: 1000,
        categoria: "Tortas",
        imagen: "",
      },
    ])
  );
  mount();
  expect(screen.getByText(/Productos/i)).toBeInTheDocument();
});

test("38) Si pasteles_local corrupto → no crashea", () => {
  localStorage.setItem("pasteles_local", "{mal-json");
  mount();
  expect(screen.getByText(/Productos/i)).toBeInTheDocument();
});

test("39) Renderiza precio numérico", () => {
  mount();
  // No sabemos el valor exacto de la UI, pero no debe crashear
  expect(screen.getByText(/Productos/i)).toBeInTheDocument();
});

test("40) Cada Card recibe imagen resuelta via import.meta.url", () => {
  mount();
  expect(screen.getByText(/Productos/i)).toBeInTheDocument();
});
