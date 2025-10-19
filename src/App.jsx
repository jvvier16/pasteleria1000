import { useState } from "react";
import "./App.css";
import Card from "./components/Card";
import pasteles from "./data/Pasteles.json";
import Navbar from "./pages/Navbar.jsx";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/index.jsx";
import Productos from "./pages/Productos.jsx";
import Admin from "./pages/Admin.jsx";
import RequireAdmin from "./components/RequireAdmin";
import Carrito from "./pages/Carrito.jsx";
import RequireAuth from "./components/RequireAuth";
import Contacto from "./pages/Contacto.jsx";
import Pago from "./pages/pago.jsx";
import Categorias from "./pages/Categorias.jsx";
import Pedidos from "./pages/Pedidos.jsx";
import Registro from "./pages/Registro.jsx";
import Login from "./pages/Login.jsx";
import Perfil from "./pages/Perfil.jsx";

function App() {
  const [count, setCount] = useState(0);

  // Resolver la URL de las imágenes listadas en pasteles.json
  const productos = pasteles.map((p) => {
    const filename = p.imagen.split("/").pop();
    const imageUrl = new URL(`./assets/img/${filename}`, import.meta.url).href;
    return { ...p, imageUrl };
  });

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/productos" element={<Productos />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
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
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/pago" element={<Pago />} />
        <Route path="/login" element={<Login />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route
          path="/pedidos"
          element={
            <RequireAuth>
              <Pedidos />
            </RequireAuth>
          }
        />
        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <Perfil />
            </RequireAuth>
          }
        />
        <Route path="/register" element={<Registro />} />
      </Routes>
    </>
  );
}

export default App;
