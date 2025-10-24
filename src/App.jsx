// App: Composición principal de la aplicación.
// - Incluye el layout (Navbar, Footer).
// - Define las rutas públicas y las rutas protegidas (RequireAuth / RequireAdmin).
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
//admin Pages
import Admin from "./Admin/Admin.jsx";
import AgregarPastel from "./Admin/AgregarPastel.jsx";
import AdminUsuarios from "./Admin/UsuariosAdmin";
import AdminPasteles from "./Admin/AdminPastel";
import AdminReportes from "./Admin/Reportes";
import AdminOrdenes from "./Admin/AdminOrdenes";

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
          path="/admin/pasteles/agregar"
          element={
            <RequireAdmin>
              <AgregarPastel />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <RequireAdmin>
              <AdminUsuarios />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/pasteles"
          element={
            <RequireAdmin>
              <AdminPasteles />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ordenes"
          element={
            <RequireAdmin>
              <AdminOrdenes />
            </RequireAdmin>
          }
        />
        <Route path="/admin/reportes" element={<AdminReportes />} />

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
