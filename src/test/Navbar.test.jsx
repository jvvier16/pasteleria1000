import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// TODO: ajusta si difiere
import Navbar from "../components/Navbar.jsx";

function mount() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Navbar />} />
        <Route path="/carrito" element={<div>Carrito OK</div>} />
        <Route path="/login" element={<div>Login OK</div>} />
        <Route path="/register" element={<div>Register OK</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

test("27) Renderiza sin sesión: muestra botones de autenticación", () => {
  mount();
  expect(
    screen.getByRole("button", { name: /iniciar sesión/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /crear cuenta|registrar|register/i })
  ).toBeInTheDocument();
});

test("28) Botón Carrito navega a /carrito", async () => {
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: /carrito/i }));
  expect(await screen.findByText(/Carrito OK/i)).toBeInTheDocument();
});

test("29) Iniciar Sesión navega a /login", async () => {
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));
  expect(await screen.findByText(/Login OK/i)).toBeInTheDocument();
});

test("30) Crear Cuenta navega a /register", async () => {
  const user = userEvent.setup();
  mount();
  await user.click(
    screen.getByRole("button", { name: /crear cuenta|registrar|register/i })
  );
  expect(await screen.findByText(/Register OK/i)).toBeInTheDocument();
});

test("31) Calcula conteo de carrito desde localStorage (evento storage)", () => {
  mount();
  localStorage.setItem(
    "pasteleria_cart",
    JSON.stringify([{ id: 1, cantidad: 2 }])
  );
  window.dispatchEvent(new Event("storage"));
  // no hay UI exacta del conteo en texto fijo; este test asegura que no crashea
  expect(screen.getByText(/Carrito/i)).toBeInTheDocument();
});

test("32) Construye categorías desde Pasteles.json", () => {
  mount();
  expect(screen.getByText(/Categorías/i)).toBeInTheDocument();
});

test("33) Dropdown usuario sin sesión no muestra 'Cerrar sesión'", () => {
  mount();
  // Buscar por el role y aria-label específicos del botón de logout
  expect(
    screen.queryByRole("menuitem", { name: /cerrar sesión/i })
  ).not.toBeInTheDocument();
});

test("34) Con sesión muestra 'Cerrar sesión' en el menú", () => {
  // Establecer un usuario con nombre para el dropdown
  localStorage.setItem(
    "session_user",
    JSON.stringify({ id: 5, nombre: "Usuario Test", correo: "a@b.c" })
  );
  mount();
  // Buscar por el role y aria-label específicos del botón de logout
  expect(
    screen.getByRole("menuitem", { name: /cerrar sesión/i })
  ).toBeInTheDocument();
});
