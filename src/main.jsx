// Entry point: inicializa la aplicación, importa estilos globales y monta React.
// - Copia datos semilla (usuarios, pasteles) a localStorage si no existen.
// - Envoltorio con BrowserRouter y ErrorBoundary para manejar rutas y errores en tiempo de ejecución.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Global animations (no color changes) - bundle with the app
import "./styles/animations.css";
import "./utils/animations.js";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import ErrorBoundary from "./components/ErrorBoundary";
import usuariosData from "./data/Usuarios.json";
import pastelesData from "./data/Pasteles.json";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
// Inicializar datos en localStorage
try {
  // 1. Inicializar usuarios - SIEMPRE cargar todos para que sean editables
  const usuariosRaw = localStorage.getItem("usuarios_local");
  if (!usuariosRaw || usuariosRaw === "[]") {
    // Marcar todos como editables (origen local)
    const usuariosEditables = usuariosData.map((u) => ({
      ...u,
      _origen: "local",
    }));
    localStorage.setItem("usuarios_local", JSON.stringify(usuariosEditables));
  }

  // 2. Inicializar pasteles - SIEMPRE cargar todos para que sean editables
  const pastelesRaw = localStorage.getItem("pasteles_local");
  if (!pastelesRaw || pastelesRaw === "[]") {
    // Marcar todos como editables y asegurarse que tengan rutas de imagen correctas
    const pastelesEditables = pastelesData.map((p) => ({
      ...p,
      _origen: "local",
      imagen: p.imagen || "", // Asegurarse que imagen nunca sea undefined
    }));
    localStorage.setItem("pasteles_local", JSON.stringify(pastelesEditables));
  }
} catch (err) {
  console.error("No se pudo inicializar localStorage", err);
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);
