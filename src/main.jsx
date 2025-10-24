// Entry point: inicializa la aplicación, importa estilos globales y monta React.
// - Copia datos semilla (usuarios, pasteles) a localStorage si no existen.
// - Envoltorio con BrowserRouter y ErrorBoundary para manejar rutas y errores en tiempo de ejecución.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import ErrorBoundary from "./components/ErrorBoundary";
import usuariosData from "./data/Usuarios.json";
import pastelesData from "./data/Pasteles.json";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
// Inicializar datos en localStorage si no existen
try {
  const uRaw = localStorage.getItem("usuarios_local");
  if (!uRaw || uRaw === "[]") {
    // copiar Usuarios.json al localStorage para permitir edición/local persist
    localStorage.setItem("usuarios_local", JSON.stringify(usuariosData || []));
  }

  const pRaw = localStorage.getItem("pasteles_local");
  if (!pRaw || pRaw === "[]") {
    localStorage.setItem("pasteles_local", JSON.stringify(pastelesData || []));
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
