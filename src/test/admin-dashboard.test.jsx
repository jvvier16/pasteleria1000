import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
// TODO: ajusta si difiere
import Admin from "../Admin/Admin.jsx";

function mountAdmin() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

test("17) Admin renderiza sin crashear (con datos por defecto)", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com", role: "admin" })
  );
  mountAdmin();

  // Verificar elementos básicos del dashboard
  expect(screen.getByText(/Panel de Administración/i)).toBeInTheDocument();
  expect(screen.getByTestId("stats-productos")).toBeInTheDocument();
  expect(screen.getByTestId("stats-usuarios")).toBeInTheDocument();
  expect(screen.getByTestId("stats-pedidos")).toBeInTheDocument();
});

test("18) Admin muestra tarjetas de resumen (Productos, Usuarios, Órdenes)", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com", role: "admin" })
  );
  mountAdmin();
  expect(screen.getByTestId("stats-productos")).toBeInTheDocument();
  expect(screen.getByTestId("stats-usuarios")).toBeInTheDocument();
  expect(screen.getByTestId("stats-pedidos")).toBeInTheDocument();
});

test("19) Muestra inventario actual estimado", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com", role: "admin" })
  );
  mountAdmin();
  expect(screen.getByText(/Inventario:/i)).toBeInTheDocument();
});

test("20) Soporta órdenes desde localStorage (pedidos_local)", async () => {
  // Configurar sesión de admin
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com", role: "admin" })
  );

  // Guardar pedidos en localStorage
  const pedidosPrueba = [
    { id: 1, userId: 2, estado: "pendiente", fecha: "2023-10-27" },
    { id: 2, userId: 3, estado: "completado", fecha: "2023-10-26" },
  ];
  localStorage.setItem("pedidos_local", JSON.stringify(pedidosPrueba));

  mountAdmin();

  // Verificar conteo de órdenes
  const ordenesCard = await screen.findByTestId("stats-pedidos");
  expect(ordenesCard).toHaveTextContent(/2 órdenes/i);

  // Verificar que la información se muestra correctamente
  expect(ordenesCard).toBeVisible();
  expect(ordenesCard).toHaveAttribute("role", "region");
  expect(ordenesCard.parentElement).toHaveClass("card");
});

test("21) Si pedidos_local corrupto → no crashea", async () => {
  // Limpiar localStorage
  localStorage.clear();

  // Configurar sesión de admin
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com", role: "admin" })
  );

  // Establecer datos corruptos
  localStorage.setItem("pedidos_local", "{malo:json"); // JSON corrupto
  localStorage.setItem("usuarios_local", "[malojson}"); // JSON corrupto
  localStorage.setItem("pasteles_local", "{invalido}"); // JSON corrupto

  // Montar componente
  const { container } = mountAdmin();

  // Verificar que el componente no crashea
  expect(container).toBeInTheDocument();

  // Verificar valores por defecto
  const ordenesCard = await screen.findByTestId("stats-pedidos");
  const usuariosCard = await screen.findByTestId("stats-usuarios");
  const productosCard = await screen.findByTestId("stats-productos");

  expect(ordenesCard).toHaveTextContent(/0 órdenes/i);
  expect(usuariosCard).toHaveTextContent(/[0-9]+ usuarios/i); // Al menos los usuarios del JSON base
  expect(productosCard).toHaveTextContent(/0 productos/i);
});

test("22) Usa Usuarios.json para contar usuarios base", async () => {
  // Limpiar localStorage completamente
  localStorage.clear();

  // Configurar sesión de admin
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com", role: "admin" })
  );

  // No configuramos usuarios_local para que use el JSON base
  mountAdmin();

  // Verificar que el conteo incluye los usuarios del JSON base
  const usuariosCard = await screen.findByTestId("stats-usuarios");
  expect(usuariosCard).toHaveTextContent(/[1-9][0-9]* usuarios/i);

  // Esperar a que los datos se carguen
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Verificar que la card tiene el formato correcto
  expect(usuariosCard.closest(".card")).toHaveClass("card");
  expect(usuariosCard).toBeVisible();
  expect(usuariosCard).toHaveAttribute("role", "region");
});

test("23) Sidebar contiene links como 'Ordenes' y 'Reportes'", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com", role: "admin" })
  );
  mountAdmin();
  const links = screen.getAllByRole("link");
  const ordenesLink = links.find((link) =>
    link.textContent.includes("Órdenes")
  );
  const reportesLink = links.find((link) =>
    link.textContent.includes("Reportes")
  );

  expect(ordenesLink).toBeInTheDocument();
  expect(reportesLink).toBeInTheDocument();
});

test("24) Cards de 'Navegación rápida' existen", () => {
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com", role: "admin" })
  );
  mountAdmin();
  const navigationSection = screen.getByText("Navegación rápida");
  expect(navigationSection).toBeInTheDocument();

  const productosLink = screen.getByRole("link", { name: /Ver productos/i });
  expect(productosLink).toHaveAttribute("href", "/admin/pasteles");
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

test("26) Render con productos y usuarios JSON cargados", async () => {
  // Limpiar localStorage
  localStorage.clear();

  // Configurar sesión de admin
  localStorage.setItem(
    "session_user",
    JSON.stringify({ correo: "admin@gmail.com", role: "admin" })
  );

  // Configurar datos de prueba
  const productos = [
    { id: 1, nombre: "Pastel test", precio: 1000, stock: 5 },
    { id: 2, nombre: "Torta test", precio: 2000, stock: 3 },
  ];

  const usuarios = [
    { id: 1, nombre: "Usuario test 1", role: "user" },
    { id: 2, nombre: "Usuario test 2", role: "admin" },
  ];

  localStorage.setItem("pasteles_local", JSON.stringify(productos));
  localStorage.setItem("usuarios_local", JSON.stringify(usuarios));

  // Montar componente
  mountAdmin();

  // Esperar a que los datos se carguen
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Verificar las tarjetas de estadísticas
  const productosCard = await screen.findByTestId("stats-productos");
  const usuariosCard = await screen.findByTestId("stats-usuarios");

  // Verificar conteos
  expect(productosCard).toHaveTextContent(/2 productos/i);
  expect(usuariosCard).toHaveTextContent(/2 usuarios/i);

  // Verificar que muestra el inventario total
  expect(productosCard.textContent).toMatch(/inventario.*8 unidades/i);
});
