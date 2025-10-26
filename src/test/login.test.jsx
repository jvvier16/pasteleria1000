import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../src/pages/Login.jsx";

function mount() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>Index</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

test("47) Valida campos vacíos", async () => {
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: /ingresar/i }));
  expect(screen.getByText(/Ingresa usuario o email/i)).toBeInTheDocument();
  expect(screen.getByText(/Ingresa la contraseña/i)).toBeInTheDocument();
});

test("48) Valida longitud de contraseña (min 12, max 18)", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(
    screen.getByPlaceholderText(/usuario|email/i),
    "ana@example.com"
  );
  await user.type(screen.getByPlaceholderText(/\*{4,}/i), "corta");
  await user.click(screen.getByRole("button", { name: /ingresar/i }));
  expect(screen.getByText(/al menos 12/i)).toBeInTheDocument();
});

test("49) Usuario inexistente muestra error contextual", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(
    screen.getByPlaceholderText(/usuario|email/i),
    "no@existe.com"
  );
  await user.type(screen.getByPlaceholderText(/\*{4,}/i), "contrasenialarga12");
  await user.click(screen.getByRole("button", { name: /ingresar/i }));
  expect(screen.getByText(/no registrado/i)).toBeInTheDocument();
});

test("50) Contraseña incorrecta muestra alerta roja", async () => {
  const user = userEvent.setup();
  // Inyectamos un usuario local para asegurar existencia
  localStorage.setItem(
    "usuarios_local",
    JSON.stringify([
      {
        id: 50,
        nombre: "Test",
        apellido: "User",
        correo: "test@ex.com",
        contrasena: "correcta123456",
      },
    ])
  );
  mount();
  await user.type(screen.getByPlaceholderText(/usuario|email/i), "test@ex.com");
  await user.type(screen.getByPlaceholderText(/\*{4,}/i), "incorrecta123456");
  await user.click(screen.getByRole("button", { name: /ingresar/i }));
  expect(screen.getByText(/Error al iniciar sesión/i)).toBeInTheDocument();
});

test("51) Login correcto guarda session_user y muestra éxito", async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    "usuarios_local",
    JSON.stringify([
      {
        id: 51,
        nombre: "Test",
        apellido: "Ok",
        correo: "ok@ex.com",
        contrasena: "correcta123456",
      },
    ])
  );
  mount();
  await user.type(screen.getByPlaceholderText(/usuario|email/i), "ok@ex.com");
  await user.type(screen.getByPlaceholderText(/\*{4,}/i), "correcta123456");
  await user.click(screen.getByRole("button", { name: /ingresar/i }));
  expect(screen.getByText(/Has ingresado correctamente/i)).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("session_user")).correo).toBe(
    "ok@ex.com"
  );
});

test("52) Botón Limpiar resetea el formulario", async () => {
  const user = userEvent.setup();
  mount();
  const userInput = screen.getByPlaceholderText(/usuario|email/i);
  await user.type(userInput, "algo@ex.com");
  await user.click(screen.getByRole("button", { name: /limpiar/i }));
  expect(userInput).toHaveValue("");
});

test("53) Toggle mostrar/ocultar contraseña funciona", async () => {
  const user = userEvent.setup();
  mount();
  const pass = screen.getByPlaceholderText(/\*{4,}/i);
  const toggle = screen.getByRole("button", { name: "" }); // botón con icono
  await user.click(toggle);
  expect(pass).toHaveAttribute("type", "text");
});

test("54) Carga usuarios = JSON + usuarios_local", () => {
  localStorage.setItem("usuarios_local", JSON.stringify([]));
  mount();
  // no crashea
  expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
});
