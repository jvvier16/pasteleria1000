/**
 * Test Suite: Admin Avanzado
 * Propósito: Verificar funcionalidades avanzadas del panel de administración
 * Enfoque: Gestión de productos, manejo de errores y persistencia de datos
 */

import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Admin from "../Admin/Admin.jsx";

// Usuario admin de prueba para simular sesión
const ADMIN = { correo: "admin@gmail.com", role: "admin" };

/**
 * Función auxiliar para montar el componente Admin
 * - Simula una sesión de administrador
 * - Configura el enrutamiento necesario
 * - Renderiza el componente en un entorno controlado
 */
function mount(path = "/admin") {
  localStorage.setItem("session_user", JSON.stringify(ADMIN));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </MemoryRouter>
  );
}

// Limpiar localStorage antes de cada test para evitar interferencias
beforeEach(() => localStorage.clear());

/**
 * Test #81: Verificación de Interfaz Básica
 * Propósito: Asegurar que el panel de administración muestra la sección de productos
 */
test("81) Admin muestra accesos a gestión de productos", () => {
  mount();
  // Verificar que el enlace de navegación rápida hacia productos existe
  expect(
    screen.getByRole("link", { name: /Ver productos/i })
  ).toBeInTheDocument();
});

/**
 * Test #82: Manejo de Estado Inicial
 * Propósito: Verificar que la aplicación maneja correctamente un estado inicial vacío
 * Comportamiento esperado: No debe crashear cuando pasteles_local está vacío
 */
test("82) Abrir módulo de productos no crashea aunque pasteles_local esté vacío", async () => {
  // Montar directamente la ruta de productos para evitar navegación por <a href>
  mount("/admin/pasteles");
  // El módulo de productos muestra el título principal
  expect(
    screen.getByRole("heading", { name: /Administrar Pasteles/i })
  ).toBeInTheDocument();
});

/**
 * Test #83: Manejo de Errores de Datos
 * Propósito: Verificar la resistencia a datos corruptos
 * Comportamiento esperado: No debe crashear con JSON inválido
 */
test("83) Si pasteles_local corrupto no crashea el listado", async () => {
  localStorage.setItem("pasteles_local", "{bad-json");
  // Montar directamente la ruta de productos
  mount("/admin/pasteles");
  // Asegurarse que el título principal se renderiza incluso con JSON corrupto
  expect(
    screen.getByRole("heading", { name: /Administrar Pasteles/i })
  ).toBeInTheDocument();
});

/**
 * Test #84: Creación de Productos
 * Propósito: Verificar el flujo completo de creación de productos
 * Pasos:
 * 1. Abrir el formulario de creación
 * 2. Ingresar datos del producto
 * 3. Guardar el producto
 * 4. Verificar persistencia en localStorage
 */
test("84) Crear producto agrega entrada a pasteles_local", async () => {
  const u = userEvent.setup();
  mount("/admin/pasteles");
  // El botón del formulario inline dentro del dashboard tiene testid único
  await u.click(screen.getByTestId("card-add-pastel"));
  await u.type(screen.getByLabelText(/Nombre/i), "Producto Test");
  await u.type(screen.getByLabelText(/Precio/i), "1000");
  await u.click(screen.getByRole("button", { name: /guardar|Guardar/i }));
  const saved = JSON.parse(localStorage.getItem("pasteles_local") || "[]");
  expect(saved.some((p) => p.nombre === "Producto Test")).toBe(true);
});

/**
 * Test #85: Eliminación de Productos
 * Propósito: Verificar el flujo de eliminación de productos
 * Pasos:
 * 1. Preparar datos de prueba en localStorage
 * 2. Renderizar el componente
 * 3. Ejecutar la eliminación
 * 4. Verificar que el producto ya no existe
 */
test("85) Eliminar producto lo quita de pasteles_local", async () => {
  localStorage.setItem(
    "pasteles_local",
    JSON.stringify([
      { id: 501, nombre: "EliminarMe", precio: 1000, categoria: "Tortas" },
    ])
  );
  const u = userEvent.setup();
  mount("/admin/pasteles");
  const btnDel = screen.getAllByRole("button", {
    name: /Eliminar|Eliminar|eliminar|borrar/i,
    hidden: true,
  })[0];
  await u.click(btnDel);
  const items = JSON.parse(localStorage.getItem("pasteles_local"));
  expect(items.some((p) => p.nombre === "EliminarMe")).toBe(false);
});
