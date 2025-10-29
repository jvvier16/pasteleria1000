import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import App from "src/App";

function renderAt(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

const admin = {
  id: 1,
  nombre: "Admin",
  apellido: "Root",
  correo: "admin@gmail.com",
  role: "admin",
};

const user = {
  id: 2,
  nombre: "Pepe",
  apellido: "Lagos",
  correo: "pepe@example.com",
  role: "user",
};

test("1) Ir a /admin sin sesión → ve pantalla de Login (redirige)", () => {
  renderAt("/admin");
  expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
});

test("2) Ir a /admin con sesión NO admin → redirige a Login", () => {
  localStorage.setItem("session_user", JSON.stringify(user));
  renderAt("/admin");
  expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
});

test("3) Ir a /admin con sesión admin → NO redirige, no aparece Login", () => {
  localStorage.setItem("session_user", JSON.stringify(admin));
  renderAt("/admin");
  expect(screen.queryByText(/ingresar/i)).not.toBeInTheDocument();
});

test("4) Ruta /carrito sin sesión → requiere auth → redirige a /login", () => {
  renderAt("/carrito");
  expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
});

test("5) Ruta /carrito con sesión → muestra la página (no login)", () => {
  localStorage.setItem("session_user", JSON.stringify(user));
  renderAt("/carrito");
  expect(screen.queryByText(/ingresar/i)).not.toBeInTheDocument();
});

test("6) Ruta /pedidos sin sesión → redirige a Login", () => {
  renderAt("/pedidos");
  expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
});

test("7) Ruta /pedidos con sesión → no aparece Login", () => {
  localStorage.setItem("session_user", JSON.stringify(user));
  renderAt("/pedidos");
  expect(screen.queryByText(/ingresar/i)).not.toBeInTheDocument();
});

test("8) Ruta inexistente → cae a Index (fallback '*')", () => {
  renderAt("/no-existe-xyz");
  // Index tiene bastante contenido; verificamos que no estemos en Login:
  expect(
    screen.queryByRole("button", { name: /ingresar/i })
  ).not.toBeInTheDocument();
});

test("9) Ruta /admin/pasteles/agregar sin admin → redirige a Login", () => {
  renderAt("/admin/pasteles/agregar");
  expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
});

test("10) Ruta /admin/pasteles/agregar con admin → no Login", () => {
  localStorage.setItem("session_user", JSON.stringify(admin));
  renderAt("/admin/pasteles/agregar");
  expect(
    screen.queryByRole("button", { name: /ingresar/i })
  ).not.toBeInTheDocument();
});
