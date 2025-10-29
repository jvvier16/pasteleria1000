import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../pages/Login.jsx";

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
  await user.type(screen.getByTestId("login-username"), "ana@example.com");
  await user.type(screen.getByTestId("login-password"), "corta");
  await user.click(screen.getByRole("button", { name: /ingresar/i }));
  const errorMsg = await screen.findByText(/al menos 12 caracteres/i);
  expect(errorMsg).toBeInTheDocument();
});

test("49) Usuario inexistente muestra error contextual", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(screen.getByTestId("login-username"), "no@existe.com");
  await user.type(screen.getByTestId("login-password"), "Contrasenialarga12");
  await user.click(screen.getByRole("button", { name: /ingresar/i }));
  const errorMsg = await screen.findByText(/Usuario o email no registrado/i);
  expect(errorMsg).toBeInTheDocument();
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
        contrasena: "Correcta123456",
      },
    ])
  );
  mount();
  await user.type(screen.getByTestId("login-username"), "test@ex.com");
  await user.type(screen.getByTestId("login-password"), "Incorrecta123456");
  await user.click(screen.getByRole("button", { name: /ingresar/i }));
  const errorMsg = await screen.findByText(/Contraseña incorrecta/i);
  const alertaRoja = await screen.findByText(/Error al iniciar sesión/i);
  expect(errorMsg).toBeInTheDocument();
  expect(alertaRoja).toBeInTheDocument();
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
        contrasena: "Correcta123456",
        role: "user",
      },
    ])
  );
  mount();
  await user.type(screen.getByTestId("login-username"), "ok@ex.com");
  await user.type(screen.getByTestId("login-password"), "Correcta123456");
  await user.click(screen.getByRole("button", { name: /ingresar/i }));

  // Esperar a que session_user se guarde en localStorage
  await new Promise((resolve) => {
    const max = 2000; // ms
    const start = Date.now();
    const iv = setInterval(() => {
      const s = localStorage.getItem("session_user");
      if (s) {
        clearInterval(iv);
        resolve();
      }
      if (Date.now() - start > max) {
        clearInterval(iv);
        resolve();
      }
    }, 50);
  });

  const sessionUser = JSON.parse(localStorage.getItem("session_user"));
  expect(sessionUser).toMatchObject({
    correo: "ok@ex.com",
    nombre: "Test Ok",
    role: "user",
  });

  // Verificar que la navegación ocurrió y la ruta / (Index) se muestra
  expect(screen.getByText(/Index/i)).toBeInTheDocument();
});

test("52) Botón Limpiar resetea el formulario", async () => {
  const user = userEvent.setup();
  mount();

  const userInput = screen.getByTestId("login-username");
  const passInput = screen.getByTestId("login-password");

  await user.type(userInput, "algo@ex.com");
  await user.type(passInput, "Contrasena123");

  await user.click(screen.getByRole("button", { name: /limpiar/i }));

  expect(userInput).toHaveValue("");
  expect(passInput).toHaveValue("");
  expect(screen.queryByText(/Error/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/correctamente/i)).not.toBeInTheDocument();
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
