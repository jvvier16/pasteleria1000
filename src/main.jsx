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
import { AuthProvider } from "./context/AuthContext";
import { initializeData } from "./services/dataService";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

// Inicializar datos centralizados en localStorage
initializeData();

createRoot(root).render(
  <StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);
