import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// TODO: ajusta la ruta si difiere
import Navbar from "../src/components/Navbar.jsx";

function mountAt(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Navbar />} />
        <Route path="/login" element={<div>Login OK</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const USER = {
  id: 10,
  nombre: "Pedro",
  apellido: "Abarca",
  correo: "pedro@example.com",
  role: "user",
};

beforeEach(() => localStorage.clear());

test("76) Con sesión muestra botón Cerrar sesión en el navbar", () => {
  localStorage.setItem("session_user", JSON.stringify(USER));
  mountAt("/");
  expect(screen.getByText(/Cerrar sesión/i)).toBeInTheDocument();
});

test("77) Click en Cerrar sesión elimina session_user del localStorage", async () => {
  localStorage.setItem("session_user", JSON.stringify(USER));
  const u = userEvent.setup();
  mountAt("/");
  await u.click(screen.getByText(/Cerrar sesión/i));
  expect(localStorage.getItem("session_user")).toBeNull();
});

test("78) Tras Cerrar sesión ya no aparece el botón de usuario", async () => {
  localStorage.setItem("session_user", JSON.stringify(USER));
  const u = userEvent.setup();
  mountAt("/");
  await u.click(screen.getByText(/Cerrar sesión/i));
  expect(screen.queryByText(/Cerrar sesión/i)).not.toBeInTheDocument();
});

test("79) Tras Cerrar sesión redirige/permite ir a Login", async () => {
  localStorage.setItem("session_user", JSON.stringify(USER));
  const u = userEvent.setup();
  mountAt("/");
  await u.click(screen.getByText(/Cerrar sesión/i));
  // Forzamos navegación a /login para validar que existe sin crash
  await u.click(screen.getByRole("button", { name: /iniciar sesión/i }));
  expect(await screen.findByText(/Login OK/i)).toBeInTheDocument();
});

test("80) El logout no borra carrito ni usuarios_local", async () => {
  localStorage.setItem("session_user", JSON.stringify(USER));
  localStorage.setItem("pasteleria_cart", JSON.stringify([{ id: 1 }]));
  localStorage.setItem(
    "usuarios_local",
    JSON.stringify([{ id: 200, correo: "a@a.a" }])
  );
  const u = userEvent.setup();
  mountAt("/");
  await u.click(screen.getByText(/Cerrar sesión/i));

  expect(localStorage.getItem("pasteleria_cart")).not.toBeNull();
  expect(localStorage.getItem("usuarios_local")).not.toBeNull();
});
