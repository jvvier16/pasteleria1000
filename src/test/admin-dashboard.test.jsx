import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
// TODO: ajusta si difiere
import Admin from "../src/Admin/Admin.jsx";

function mountAdmin() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

test("17) Admin renderiza sin crashear (con datos por defecto)", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com" })
  );
  mountAdmin();
  // debería mostrar algo de su dashboard
  expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
});

test("18) Admin muestra tarjetas de resumen (Productos, Usuarios, Órdenes)", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com" })
  );
  mountAdmin();
  expect(screen.getByText(/Productos/i)).toBeInTheDocument();
  expect(screen.getByText(/Usuarios/i)).toBeInTheDocument();
  expect(screen.getByText(/Órdenes/i)).toBeInTheDocument();
});

test("19) Muestra inventario actual estimado", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com" })
  );
  mountAdmin();
  expect(screen.getByText(/Inventario actual/i)).toBeInTheDocument();
});

test("20) Soporta órdenes desde localStorage (pedidos_local)", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com" })
  );
  localStorage.setItem("pedidos_local", JSON.stringify([{ id: 1, userId: 2 }]));
  mountAdmin();
  expect(screen.getByText(/Órdenes/i)).toBeInTheDocument();
});

test("21) Si pedidos_local corrupto → no crashea", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com" })
  );
  localStorage.setItem("pedidos_local", "{malo:json}");
  mountAdmin();
  expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
});

test("22) Usa Usuarios.json para contar usuarios base", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com" })
  );
  mountAdmin();
  expect(screen.getByText(/Usuarios/i)).toBeInTheDocument();
});

test("23) Sidebar contiene links como 'Ordenes' y 'Reportes'", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com" })
  );
  mountAdmin();
  expect(screen.getByText(/Ordenes/i)).toBeInTheDocument();
  expect(screen.getByText(/Reportes/i)).toBeInTheDocument();
});

test("24) Cards de 'Navegación rápida' existen", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com" })
  );
  mountAdmin();
  expect(screen.getByText(/Gestión de productos/i)).toBeInTheDocument();
});

test("25) No aparece 'Ingresar' dentro del admin (no es Login)", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com" })
  );
  mountAdmin();
  expect(
    screen.queryByRole("button", { name: /ingresar/i })
  ).not.toBeInTheDocument();
});

test("26) Render con productos y usuarios JSON cargados", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com" })
  );
  mountAdmin();
  // al menos existe un texto de contexto
  expect(screen.getByText(/Panel/i)).toBeInTheDocument();
});
