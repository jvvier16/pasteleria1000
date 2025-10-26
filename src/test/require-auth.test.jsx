import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import App from "../src/App";

function mount(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

const user = { id: 7, nombre: "Ana", correo: "ana@example.com", role: "user" };

test("11) /carrito sin sesión → Login", () => {
  mount("/carrito");
  expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
});

test("12) /carrito con sesión → renderiza Carrito", () => {
  localStorage.setItem("session_user", JSON.stringify(user));
  mount("/carrito");
  expect(
    screen.queryByRole("button", { name: /ingresar/i })
  ).not.toBeInTheDocument();
});

test("13) /pago sin sesión → Login", () => {
  mount("/pago");
  expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
});

test("14) /pago con sesión → no Login", () => {
  localStorage.setItem("session_user", JSON.stringify(user));
  mount("/pago");
  expect(
    screen.queryByRole("button", { name: /ingresar/i })
  ).not.toBeInTheDocument();
});

test("15) /pedidos sin sesión → Login", () => {
  mount("/pedidos");
  expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
});

test("16) /pedidos con sesión → no Login", () => {
  localStorage.setItem("session_user", JSON.stringify(user));
  mount("/pedidos");
  expect(
    screen.queryByRole("button", { name: /ingresar/i })
  ).not.toBeInTheDocument();
});
