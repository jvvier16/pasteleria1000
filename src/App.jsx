// App: Composición principal de la aplicación.
// - Incluye el layout (Navbar, Footer).
// - Define las rutas públicas y las rutas protegidas (RequireAuth / RequireAdmin).
import React from "react";
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { ApiHealthProvider } from "./context/ApiHealthContext"
import ApiDown from "./components/ApiDown"

// Pages
import Index from "./pages/Index.jsx";
import Productos from "./pages/Productos.jsx";
import Ofertas from "./pages/Ofertas.jsx";
import Categorias from "./pages/Categoria.jsx";
import Contacto from "./pages/ContactoPage.jsx";
import Pago from "./pages/Pago.jsx";
import BlogIndex from "./pages/BlogIndex.jsx";
import BlogUno from "./pages/BlogUno.jsx";
import BlogDos from "./pages/BlogDos.jsx";
import Login from "./pages/Login.jsx";
import Registro from "./pages/Registro.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import Carrito from "./pages/Carrito.jsx";
import Perfil from "./pages/Perfil.jsx";
import Pedidos from "./Admin/Pedidos.jsx";
import ProductoDetalle from "./pages/ProductoDetalle.jsx";
//admin Pages
import Admin from "./Admin/Admin.jsx";
import AgregarPastel from "./Admin/AgregarPastel.jsx";
import AdminUsuarios from "./Admin/UsuariosAdmin";
import AdminPasteles from "./Admin/AdminPastel";
import AdminReportes from "./Admin/Reportes";
import AdminOrdenes from "./Admin/AdminOrdenes.jsx";
import AdminCategoria from "./Admin/AdminCategoria";

// Guards
import RequireAuth from "./components/RequireAuth.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import RequireVendedor from "./components/RequireVendedor.jsx";
// Vendedor pages
import Vendedor from "./vendedor/Vendedor.jsx";
import ProductosVendedor from "./vendedor/ProductosVendedor.jsx";
import ProductoDetalleVendedor from "./vendedor/ProductoDetalleVendedor.jsx";
import OrdenesVendedor from "./vendedor/OrdenesVendedor.jsx";
import OrdenDetalleVendedor from "./vendedor/OrdenDetalleVendedor.jsx";
import EditarPastelVendedor from "./vendedor/EditarPastelVendedor.jsx";
import CategoriasVendedor from "./vendedor/CategoriasVendedor.jsx";

function App() {
  return (
    <ApiHealthProvider>
      <Navbar />
      <ApiDown />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/productos/:id" element={<ProductoDetalle />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/ofertas" element={<Ofertas />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route
          path="/pago"
          element={
            <RequireAuth>
              <Pago />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/uno" element={<BlogUno />} />
        <Route path="/blog/dos" element={<BlogDos />} />
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

        <Route path="/admin/*" element={<RequireAdmin><Admin /></RequireAdmin>}>
          <Route index element={<AdminOrdenes />} />
          <Route path="pasteles/agregar" element={<AgregarPastel />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="pasteles/*" element={<AdminPasteles />} />
          <Route path="pedidos" element={<AdminOrdenes />} />
          <Route path="reportes" element={<AdminReportes />} />
          <Route path="categorias" element={<AdminCategoria />} />
        </Route>

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
      
      <Routes>
        <Route
          path="/vendedor/*"
          element={
            <RequireVendedor>
              <Vendedor />
            </RequireVendedor>
          }
        >
          <Route index element={<Navigate to="productos" replace />} />
          <Route path="productos" element={<ProductosVendedor />} />
          <Route path="productos/:id" element={<ProductoDetalleVendedor />} />
          <Route path="productos/:id/editar" element={<EditarPastelVendedor />} />
          <Route path="ordenes" element={<OrdenesVendedor />} />
          <Route path="ordenes/:id" element={<OrdenDetalleVendedor />} />
          <Route path="categorias" element={<CategoriasVendedor />} />
        </Route>
      </Routes>
      <Footer />
    </ApiHealthProvider>
  );
}

export default App;
