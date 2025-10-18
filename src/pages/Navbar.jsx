import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import pastelesData from "../data/Pasteles.json"; // Ajusta la ruta si es distinta

export default function Navbar() {
  const [categorias, setCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Generar categorías automáticamente desde los nombres
  useEffect(() => {
    const cats = new Set();

    pastelesData.forEach((p) => {
      const nombre = p.nombre.toLowerCase();
      if (nombre.includes("sin azúcar")) cats.add("Sin Azúcar");
      else if (nombre.includes("sin gluten")) cats.add("Sin Gluten");
      else if (nombre.includes("vegana") || nombre.includes("vegano"))
        cats.add("Veganas");
      else if (nombre.includes("especial")) cats.add("Especiales");
      else if (nombre.includes("torta")) cats.add("Tortas");
      else cats.add("Otros");
    });

    setCategorias(Array.from(cats));
  }, []);

  return (
    <nav className="navbar navbar-expand-lg site-navbar">
      <div className="container-fluid px-4">
        <a className="navbar-brand d-flex align-items-center" href="#">
          <img
            src={new URL("../assets/img/logo.png", import.meta.url).href}
            alt="Logo"
            className="logo rounded-circle me-2"
          />
          <span className="brand-text">pastelería 1000 Sabores</span>
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Contenido del menú */}
        <div className="collapse navbar-collapse" id="navbarContent">
          {/* Enlaces */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-3">
            <li className="nav-item">
              <Link className="nav-link active fw-semibold" to="/">
                Home
              </Link>
            </li>

            {/* Dropdown dinámico de categorías */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="categoriasDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Categorías
              </a>
              <ul
                className="dropdown-menu"
                aria-labelledby="categoriasDropdown"
              >
                {categorias.map((cat, i) => (
                  <li key={i}>
                    <a className="dropdown-item" href="#">
                      {cat}
                    </a>
                  </li>
                ))}
              </ul>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/ofertas">
                Ofertas
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/contacto">
                Contacto
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/productos">
                productos
              </Link>
            </li>
          </ul>

          {/* Buscador */}
          <form
            className="d-flex me-3"
            onSubmit={(e) => {
              e.preventDefault();
              // navegar a /productos con query param search
              navigate(`/productos?search=${encodeURIComponent(searchTerm)}`);
            }}
          >
            <input
              className="form-control me-2"
              type="search"
              placeholder="Buscar pasteles..."
              aria-label="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-search" type="submit">
              Buscar
            </button>
          </form>

          {/* Botones derecha (mantienen colores inline según petición) */}
          <div className="d-flex align-items-center">
            <button
              className="btn me-2"
              style={{ backgroundColor: "#7ea6f2", color: "white" }}
              onClick={() => navigate("/login")}
            >
              Iniciar Sesión
            </button>
            <button
              className="btn me-3"
              style={{ backgroundColor: "#4f80e1", color: "white" }}
              onClick={() => navigate("/register")}
            >
              Crear Cuenta
            </button>
            <button
              className="btn d-flex align-items-center"
              style={{ backgroundColor: "#7bc47f", color: "white" }}
              onClick={() => navigate("/carrito")}
            >
              <ShoppingCart className="me-1" size={16} />
              Carrito
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
