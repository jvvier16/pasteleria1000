import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Admin from "./Admin";

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = mockLocalStorage;

describe("Admin Component", () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    localStorage.getItem.mockClear();
  });

  it("muestra mensaje de no autorizado cuando no hay sesión", () => {
    localStorage.getItem.mockReturnValue(null);

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    expect(screen.getByText("No autorizado")).toBeInTheDocument();
  });

  it("muestra mensaje de no autorizado cuando el usuario no es admin", () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ role: "user" }));

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    expect(screen.getByText("No autorizado")).toBeInTheDocument();
  });

  it("muestra el panel de administración para usuarios admin", () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ role: "admin" }));

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    expect(screen.getByText("Panel de Administración")).toBeInTheDocument();
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
  });
});
