import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// TODO: ajusta la ruta si difiere
import Navbar from "../components/Navbar.jsx";

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
  const logoutButton = screen.getByTestId("logout-button");
  expect(logoutButton).toHaveTextContent(/cerrar sesión/i);
});

test("77) Click en Cerrar sesión elimina session_user del localStorage", async () => {
  localStorage.setItem("session_user", JSON.stringify(USER));
  const u = userEvent.setup();
  mountAt("/");
  // Simular que no hay modal de Bootstrap y configurar confirm antes del clic
  window.bootstrap = undefined;
  window.confirm = () => true;
  await u.click(screen.getByTestId("logout-button"));
  // Esperar a que el logout se complete
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(localStorage.getItem("session_user")).toBeNull();
});

test("78) Tras Cerrar sesión ya no aparece el botón de usuario", async () => {
  localStorage.setItem("session_user", JSON.stringify(USER));
  const u = userEvent.setup();
  mountAt("/");
  window.bootstrap = undefined;
  window.confirm = () => true;
  await u.click(screen.getByTestId("logout-button"));
  // Esperar a que se actualice el estado
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(screen.queryByTestId("logout-button")).not.toBeInTheDocument();
});

test("79) Tras Cerrar sesión redirige/permite ir a Login", async () => {
  localStorage.setItem("session_user", JSON.stringify(USER));
  const u = userEvent.setup();
  mountAt("/");
  window.bootstrap = undefined;
  window.confirm = () => true;
  await u.click(screen.getByTestId("logout-button"));
  // El findByText ya incluye espera automática
  expect(
    await screen.findByText(/Login OK/i, {}, { timeout: 2000 })
  ).toBeInTheDocument();
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
  window.bootstrap = undefined;
  await u.click(screen.getByTestId("logout-button"));
  window.confirm = () => true;

  expect(localStorage.getItem("pasteleria_cart")).not.toBeNull();
  expect(localStorage.getItem("usuarios_local")).not.toBeNull();
});
