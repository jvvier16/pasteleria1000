import { useState } from "react";
import "./App.css";
import Card from "./components/Card";
import pasteles from "./data/Pasteles.json";
import Navbar from "./pages/Navbar.jsx";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/index.jsx";
import Productos from "./pages/Productos.jsx";
import Admin from "./pages/admin.jsx";
import Carrito from "./pages/carrito.jsx";
import Contacto from "./pages/contacto.jsx";
import Pago from "./pages/pago.jsx";
import Login from "./pages/Login.jsx";

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
        <Route path="/admin" element={<Admin />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/pago" element={<Pago />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
