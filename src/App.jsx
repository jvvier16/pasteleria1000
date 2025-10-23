import React from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";

// Layout
import Navbar from "./pages/Navbar.jsx";
import Footer from "./components/Footer.jsx";

// Pages
import Index from "./pages/Index.jsx";
import Productos from "./pages/Productos.jsx";
import Ofertas from "./pages/Ofertas.jsx";
import Categorias from "./pages/Categoria.jsx";
import Contacto from "./pages/ContactoPage.jsx";
import Pago from "./pages/Pago.jsx";
import Login from "./pages/Login.jsx";
import Registro from "./pages/Registro.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import Carrito from "./pages/Carrito.jsx";
import Perfil from "./pages/Perfil.jsx";
import Pedidos from "./pages/Pedidos.jsx";
import Admin from "./pages/Admin.jsx";

// Guards
import RequireAuth from "./components/RequireAuth.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/ofertas" element={<Ofertas />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/pago" element={<Pago />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/nosotros" element={<Nosotros />} />

        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <Perfil />
            </RequireAuth>
          }
        />

        <Route
          path="/carrito"
          element={
            <RequireAuth>
              <Carrito />
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />

        <Route
          path="/pedidos"
          element={
            <RequireAuth>
              <Pedidos />
            </RequireAuth>
          }
        />

        {/* fallback a index para rutas no definidas */}
        <Route path="*" element={<Index />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
