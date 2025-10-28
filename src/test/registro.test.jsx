import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Registro from "../pages/Registro.jsx";

import { UNSAFE_NavigationContext } from "react-router-dom";

function mount() {
  // Configurar el flag para usar startTransition
  const futureFlagCtx = {
    v7_startTransition: true,
  };

  return render(
    <UNSAFE_NavigationContext.Provider value={futureFlagCtx}>
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Registro />} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    </UNSAFE_NavigationContext.Provider>
  );
}

beforeEach(() => localStorage.clear());

async function fillMinimalValid(user) {
  await user.type(screen.getByTestId("registro-nombre"), "Lola");
  await user.type(screen.getByTestId("registro-apellido"), "Mora");
  await user.type(screen.getByTestId("registro-email"), "lola@example.com");
  await user.type(
    screen.getByTestId("registro-password"),
    "ContrasenaSegura12"
  );
  await user.type(
    screen.getByTestId("registro-confirm-password"),
    "ContrasenaSegura12"
  );
  // Los inputs de tipo date no siempre aceptan `user.type` en jsdom; establecer valor directamente
  fireEvent.change(screen.getByTestId("registro-fecha"), {
    target: { value: "1995-05-10" },
  });
  // Asegurar valor en el campo dirección directamente
  fireEvent.change(screen.getByTestId("registro-direccion"), {
    target: { value: "Calle 123 #1" },
  });
}

test("55) Valida match de contraseñas", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(
    screen.getByTestId("registro-password"),
    "ContrasenaSegura12"
  );
  await user.type(
    screen.getByTestId("registro-confirm-password"),
    "XontrasenaSegura12"
  );
  fireEvent.submit(screen.getByTestId("registro-form"));
  const mensajeError = await screen.findByText(/Las contraseñas no coinciden/i);
  expect(mensajeError).toBeInTheDocument();
});

test("56) Valida largo de contraseña (12-18)", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(screen.getByTestId("registro-password"), "corta");
  await user.type(screen.getByTestId("registro-confirm-password"), "corta");
  fireEvent.submit(screen.getByTestId("registro-form"));
  const mensajeError = await screen.findByText(/al menos 12 caracteres/i);
  expect(mensajeError).toBeInTheDocument();
});

test("57) Valida formato de fecha", async () => {
  const user = userEvent.setup();
  mount();

  // El input type="date" no permite valores inválidos directamente,
  // así que cambiamos su type a text temporalmente para probar el error
  const fechaInput = screen.getByTestId("registro-fecha");
  fechaInput.type = "text";

  await user.type(fechaInput, "10/05/1995");
  fireEvent.submit(screen.getByTestId("registro-form"));

  const mensajeError = await screen.findByText(
    /Formato inválido \(YYYY-MM-DD\)/i
  );
  expect(mensajeError).toBeInTheDocument();

  // Restaurar el type="date"
  fechaInput.type = "date";
});

test("58) Valida edad mínima 18", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(screen.getByTestId("registro-fecha"), "2010-01-01");
  fireEvent.submit(screen.getByTestId("registro-form"));
  const mensajeError = await screen.findByText(/Debe tener al menos 18 años/i);
  expect(mensajeError).toBeInTheDocument();
});

test("59) Valida edad máxima 90", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(screen.getByTestId("registro-fecha"), "1900-01-01");
  fireEvent.submit(screen.getByTestId("registro-form"));
  // Verificar mensaje de error de edad máxima
  const errorEdad = await screen.findByText(/Edad máxima 90 años/i);
  expect(errorEdad).toBeInTheDocument();
});

test("60) Valida correo duplicado (JSON o local)", async () => {
  const user = userEvent.setup();

  // Limpiar localStorage primero
  localStorage.clear();

  // Configurar un usuario existente
  localStorage.setItem(
    "usuarios_local",
    JSON.stringify([{ id: 1, correo: "lola@example.com" }])
  );

  mount();
  await fillMinimalValid(user);
  fireEvent.submit(screen.getByTestId("registro-form"));

  // Verificar mensaje de error
  const mensajeError = await screen.findByText(/ya está registrado/i);
  expect(mensajeError).toBeInTheDocument();

  // Verificar que no se agregó el usuario duplicado
  const saved = JSON.parse(localStorage.getItem("usuarios_local") || "[]");
  expect(saved.length).toBe(1);
});

test("61) Registro válido guarda en usuarios_local y redirige a /login", async () => {
  const user = userEvent.setup();

  // Limpiar y configurar localStorage
  localStorage.clear();
  localStorage.setItem("usuarios_local", JSON.stringify([]));

  mount();
  await fillMinimalValid(user);
  fireEvent.submit(screen.getByTestId("registro-form"));

  // Esperar el mensaje de éxito
  const mensajeExito = await screen.findByTestId("registro-exitoso");
  expect(mensajeExito).toBeInTheDocument();

  // Verificar almacenamiento local
  const saved = JSON.parse(localStorage.getItem("usuarios_local") || "[]");
  expect(saved.length).toBe(1);
  expect(saved[0]).toMatchObject({
    nombre: "Lola",
    apellido: "Mora",
    correo: "lola@example.com",
    fechaNacimiento: "1995-05-10",
    direccion: "Calle 123 #1",
    role: "user",
  });

  // Verificar redirección a /login después del timeout
  await new Promise((resolve) => setTimeout(resolve, 2500));
  expect(screen.getByText("Login")).toBeInTheDocument();
});

test("62) Genera id incremental basado en máximos JSON+local", async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    "usuarios_local",
    JSON.stringify([{ id: 100, correo: "a@a.a" }])
  );
  mount();
  await fillMinimalValid(user);
  fireEvent.submit(screen.getByTestId("registro-form"));

  // Esperar el mensaje de éxito
  await screen.findByTestId("registro-exitoso");

  // Verificar ID incremental
  const saved = JSON.parse(localStorage.getItem("usuarios_local") || "[]");
  expect(saved[saved.length - 1].id).toBeGreaterThan(100);
});

test("63) Campo Dirección requerido", async () => {
  const user = userEvent.setup();
  mount();
  // Llenar todos los campos excepto dirección
  await fillMinimalValid(user);
  // DEBUG: asegurar que el campo dirección quedó con el valor esperado
  expect(screen.getByTestId("registro-direccion")).toHaveValue("Calle 123 #1");
  // Limpiar el campo de dirección (asegurar valor vacío)
  fireEvent.change(screen.getByTestId("registro-direccion"), {
    target: { value: "" },
  });
  // DEBUG: verificar que el cambio se reflejó
  expect(screen.getByTestId("registro-direccion")).toHaveValue("");
  fireEvent.submit(screen.getByTestId("registro-form"));
  // Verificar que aparece el mensaje de error de dirección
  const mensajeError = await screen.findByText(/La dirección es obligatoria/i);
  expect(mensajeError).toBeInTheDocument();

  // Verificar que el formulario no se envió
  expect(screen.queryByTestId("registro-exitoso")).not.toBeInTheDocument();
});

test("64) Botón 'Registrar' existe", () => {
  mount();
  expect(screen.getByTestId("registro-submit")).toBeInTheDocument();
});
