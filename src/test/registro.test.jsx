import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Registro from "../src/pages/Registro.jsx";

function mount() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Registro />} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

async function fillMinimalValid(user) {
  await user.type(screen.getByLabelText(/Nombre/i), "Lola");
  await user.type(screen.getByLabelText(/Apellido/i), "Mora");
  await user.type(screen.getByLabelText(/Correo/i), "lola@example.com");
  await user.type(screen.getByLabelText(/Contraseña/i), "contrasenaSegura12");
  await user.type(
    screen.getByLabelText(/Repetir contraseña/i),
    "contrasenaSegura12"
  );
  await user.type(screen.getByLabelText(/Fecha de nacimiento/i), "1995-05-10");
  await user.type(screen.getByLabelText(/Dirección/i), "Calle 123 #1");
}

test("55) Valida match de contraseñas", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(screen.getByLabelText(/Contraseña/i), "abcabcabcabc");
  await user.type(
    screen.getByLabelText(/Repetir contraseña/i),
    "xxxxabcabcabc"
  );
  await user.click(screen.getByRole("button", { name: /registrar/i }));
  expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();
});

test("56) Valida largo de contraseña (12-18)", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(screen.getByLabelText(/Contraseña/i), "corta");
  await user.type(screen.getByLabelText(/Repetir contraseña/i), "corta");
  await user.click(screen.getByRole("button", { name: /registrar/i }));
  expect(screen.getByText(/entre 12 y 18/i)).toBeInTheDocument();
});

test("57) Valida formato de fecha", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(screen.getByLabelText(/Fecha de nacimiento/i), "10/05/1995");
  await user.click(screen.getByRole("button", { name: /registrar/i }));
  expect(screen.getByText(/Formato inválido/i)).toBeInTheDocument();
});

test("58) Valida edad mínima 18", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(screen.getByLabelText(/Fecha de nacimiento/i), "2010-01-01");
  await user.click(screen.getByRole("button", { name: /registrar/i }));
  expect(screen.getByText(/al menos 18/i)).toBeInTheDocument();
});

test("59) Valida edad máxima 90", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(screen.getByLabelText(/Fecha de nacimiento/i), "1900-01-01");
  await user.click(screen.getByRole("button", { name: /registrar/i }));
  expect(screen.getByText(/Edad máxima 90/i)).toBeInTheDocument();
});

test("60) Valida correo duplicado (JSON o local)", async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    "usuarios_local",
    JSON.stringify([{ id: 1, correo: "lola@example.com" }])
  );
  mount();
  await fillMinimalValid(user);
  await user.click(screen.getByRole("button", { name: /registrar/i }));
  expect(screen.getByText(/ya está registrado/i)).toBeInTheDocument();
});

test("61) Registro válido guarda en usuarios_local y redirige a /login", async () => {
  const user = userEvent.setup();
  localStorage.setItem("usuarios_local", JSON.stringify([]));
  mount();
  await fillMinimalValid(user);
  await user.click(screen.getByRole("button", { name: /registrar/i }));
  const saved = JSON.parse(localStorage.getItem("usuarios_local") || "[]");
  expect(saved.length).toBeGreaterThan(0);
});

test("62) Genera id incremental basado en máximos JSON+local", async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    "usuarios_local",
    JSON.stringify([{ id: 100, correo: "a@a.a" }])
  );
  mount();
  await fillMinimalValid(user);
  await user.click(screen.getByRole("button", { name: /registrar/i }));
  const saved = JSON.parse(localStorage.getItem("usuarios_local") || "[]");
  expect(saved[saved.length - 1].id).toBeGreaterThan(100);
});

test("63) Campo Dirección requerido", async () => {
  const user = userEvent.setup();
  mount();
  await user.type(screen.getByLabelText(/Nombre/i), "Lola");
  await user.type(screen.getByLabelText(/Apellido/i), "Mora");
  await user.type(screen.getByLabelText(/Correo/i), "lola@example.com");
  await user.type(screen.getByLabelText(/Contraseña/i), "contrasenaSegura12");
  await user.type(
    screen.getByLabelText(/Repetir contraseña/i),
    "contrasenaSegura12"
  );
  await user.type(screen.getByLabelText(/Fecha de nacimiento/i), "1995-05-10");
  await user.click(screen.getByRole("button", { name: /registrar/i }));
  expect(screen.getByText(/dirección/i)).toBeInTheDocument();
});

test("64) Botón 'Registrar' existe", () => {
  mount();
  expect(
    screen.getByRole("button", { name: /registrar/i })
  ).toBeInTheDocument();
});
