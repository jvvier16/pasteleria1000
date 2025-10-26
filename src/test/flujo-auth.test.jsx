/**
 * Test Suite: Flujo de Autenticación
 *
 * Este conjunto de pruebas verifica el flujo de autenticación básico
 * y la persistencia de la sesión del usuario, centrándose en:
 * - Carga de datos de usuario desde localStorage
 * - Renderizado correcto del perfil de usuario
 * - Mantenimiento de la sesión
 */

import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import Perfil from "../pages/Perfil";

/**
 * Usuario de prueba
 * Simula un usuario regular con todos los campos necesarios
 * para probar la funcionalidad del perfil
 */
const FAKE_USER = {
  id: 201,
  nombre: "María",
  apellido: "Lagos",
  correo: "maria@example.com",
  role: "user",
};

/**
 * Función auxiliar para montar el componente Perfil
 * - Configura el enrutamiento necesario
 * - Simula la navegación a /perfil
 * - Renderiza el componente en un entorno controlado
 */
function mountPerfil() {
  return render(
    <MemoryRouter initialEntries={["/perfil"]}>
      <Routes>
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Flujo mínimo – login simulado → ver Perfil", () => {
  beforeEach(() => localStorage.clear());

  /**
   * Test #16: Persistencia y Renderizado del Perfil de Usuario
   *
   * Propósito:
   * - Verificar que los datos del usuario persisten en localStorage
   * - Comprobar que el perfil muestra los datos correctamente
   *
   * Pasos:
   * 1. Simular usuario en localStorage
   * 2. Renderizar componente Perfil
   * 3. Verificar campos del formulario
   *
   * Aserciones:
   * - El campo nombre debe mostrar el nombre del usuario
   * - El campo correo debe mostrar el correo del usuario
   */
  test("16) Con session_user en localStorage, Perfil renderiza algo del usuario", () => {
    localStorage.setItem("session_user", JSON.stringify(FAKE_USER));
    mountPerfil();

    // Verificar que los campos del formulario contienen la información del usuario
    const nombreInput = screen.getByLabelText(/nombre/i);
    const correoInput = screen.getByLabelText(/correo/i);

    expect(nombreInput).toHaveValue(FAKE_USER.nombre);
    expect(correoInput).toHaveValue(FAKE_USER.correo);
  });
});
