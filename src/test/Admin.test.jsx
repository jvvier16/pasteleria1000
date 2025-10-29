import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Admin from "src/Admin/Admin";

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
    localStorage.getItem.mockImplementation((key) => {
      if (key === "session_user") {
        return null; // Default: no session
      }
      return null;
    });
  });

  it("muestra mensaje de no autorizado cuando no hay sesión", () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === "session_user") {
        return null;
      }
      return null;
    });

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    expect(screen.getByText(/no autorizado/i)).toBeInTheDocument();
  });

  it("muestra mensaje de no autorizado cuando el usuario no es admin", () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === "session_user") {
        return JSON.stringify({ role: "user" });
      }
      return null;
    });

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    expect(screen.getByText(/no autorizado/i)).toBeInTheDocument();
  });

  it("muestra el panel de administración para usuarios admin", () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === "session_user") {
        return JSON.stringify({ role: "admin" });
      }
      return null;
    });

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    expect(screen.getByText("Panel de Administración")).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();
  });
});
