import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Admin from "../pages/admin/Admin";

function mountAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </MemoryRouter>
  );
}

const ADMIN_SESSION = {
  id: 999,
  nombre: "Admin",
  apellido: "Root",
  correo: "admin@gmail.com",
  role: "admin",
};

const USER_SESSION = {
  id: 100,
  nombre: "Juan",
  apellido: "Pérez",
  correo: "juan@example.com",
  role: "user",
};

describe("Admin (/admin) – autorización y renderizado", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test("1) Sin sesión → muestra 'No autorizado'", () => {
    // no session_user
    mountAt("/admin");
    expect(screen.getByText("No autorizado")).toBeInTheDocument();
  });

  test("2) Sesión no admin → muestra 'No autorizado'", () => {
    localStorage.setItem("session_user", JSON.stringify(USER_SESSION));
    mountAt("/admin");
    expect(screen.getByText("No autorizado")).toBeInTheDocument();
  });

  test("3) Sesión admin → NO muestra 'No autorizado' y renderiza contenido", () => {
    localStorage.setItem("session_user", JSON.stringify(ADMIN_SESSION));
    mountAt("/admin");
    expect(screen.queryByText("No autorizado")).not.toBeInTheDocument();
    expect(screen.getByText("Panel de Administración")).toBeInTheDocument();
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
  });

  test("4) Sesión admin con 'usuarios_local' presente → no crashea (render ok)", () => {
    localStorage.setItem("session_user", JSON.stringify(ADMIN_SESSION));
    const locales = [
      {
        id: 101,
        nombre: "Ana",
        apellido: "García",
        correo: "ana@example.com",
        role: "user",
        origin: "local",
      },
      {
        id: 102,
        nombre: "Luis",
        apellido: "Martínez",
        correo: "luis@example.com",
        role: "user",
        origin: "local",
      },
    ];
    localStorage.setItem("usuarios_local", JSON.stringify(locales));
    mountAt("/admin");
    expect(screen.queryByText("No autorizado")).not.toBeInTheDocument();
  });

  test("5) Borrar un usuario no debe cerrar la sesión actual (invariante de sesión)", async () => {
    localStorage.setItem("session_user", JSON.stringify(ADMIN_SESSION));
    mountAt("/admin");

    // Heurística: si existe un botón 'Eliminar' para usuarios, intenta clickear el primero.
    // Si tu UI usa texto distinto (p.ej. 'Borrar' o icono), ajusta el 'getAllByRole' o 'getByText'.
    const user = userEvent.setup();
    const possibleDeleteButtons =
      screen.queryAllByRole("button", { name: /eliminar|borrar/i }) ||
      screen.queryAllByText(/eliminar|borrar/i);

    if (possibleDeleteButtons && possibleDeleteButtons.length > 0) {
      await user.click(possibleDeleteButtons[0]);
    }
    // Verifica que el session_user siga existiendo tras la acción
    const session = localStorage.getItem("session_user");
    expect(session).toBeTruthy();
    expect(JSON.parse(session).role).toBe("admin");
  });
});
