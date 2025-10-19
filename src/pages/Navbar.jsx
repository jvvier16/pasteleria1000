import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import pastelesData from "../data/Pasteles.json"; // Ajusta la ruta si es distinta
import { getCart } from "../utils/localstorageHelper";

export default function Navbar() {
  const [categorias, setCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [cartTotalMoney, setCartTotalMoney] = useState(0);
  const [sessionUser, setSessionUser] = useState(null);
  const navigate = useNavigate();

  // Generar categorías automáticamente desde los nombres
  useEffect(() => {
    // Tomar las categorías directamente del campo `categoria` de cada pastel
    const cats = new Set();
    pastelesData.forEach((p) => {
      const c = (p.categoria || "").toString().trim();
      if (c) cats.add(c);
      else cats.add("Otros");
    });
    setCategorias(Array.from(cats));
  }, []);

  // helper para crear slugs compatibles con la página de Categorías
  const slugify = (str) =>
    String(str)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\-]/g, "")
      .toLowerCase();

  useEffect(() => {
    const update = () => {
      const cart = getCart();
      const total = cart.reduce((acc, i) => acc + (i.cantidad || 1), 0);
      setCartCount(total);
      const money = cart.reduce(
        (acc, i) => acc + (Number(i.precio) || 0) * (i.cantidad || 1),
        0
      );
      setCartTotalMoney(money);
    };
    update();
    const onStorage = (e) => {
      if (e.key === null || e.key === "pasteleria_cart") update();
      if (e.key === null || e.key === "session_user") {
        try {
          const raw = localStorage.getItem("session_user");
          setSessionUser(raw ? JSON.parse(raw) : null);
        } catch (err) {
          setSessionUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    // inicializar sessionUser
    try {
      const raw = localStorage.getItem("session_user");
      setSessionUser(raw ? JSON.parse(raw) : null);
    } catch (err) {
      setSessionUser(null);
    }
  }, []);

  // determinar si el usuario es admin (por correo)
  const isAdmin = Boolean(
    sessionUser &&
      (sessionUser.correo || sessionUser.email || "").toLowerCase() ===
        "admin@gmail.com"
  );

  return (
    <nav className="navbar navbar-expand-lg site-navbar">
      <div className="container-fluid px-4">
        <a className="navbar-brand d-flex align-items-center" href="#">
          <img
            src={new URL("../assets/img/logo.png", import.meta.url).href}
            alt="Logo"
            className="logo rounded-circle me-2"
          />
          <span className="brand-text">Pastelería 1000 Sabores</span>
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
                    <Link
                      className="dropdown-item"
                      to={`/categorias?cat=${encodeURIComponent(slugify(cat))}`}
                    >
                      {cat}
                    </Link>
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
                Pasteles
              </Link>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <Link className="nav-link text-danger fw-semibold" to="/admin">
                  Admin
                </Link>
              </li>
            )}
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
            {!sessionUser ? (
              <>
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
              </>
            ) : (
              <div className="dropdown me-3">
                <button
                  className="btn d-flex align-items-center dropdown-toggle"
                  type="button"
                  id="userMenuBtn"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                  }}
                >
                  {sessionUser.imagen ? (
                    <img
                      src={sessionUser.imagen}
                      alt={sessionUser.nombre}
                      style={{ width: 34, height: 34, objectFit: "cover" }}
                      className="rounded-circle me-2"
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-dark text-white d-inline-flex justify-content-center align-items-center me-2"
                      style={{ width: 34, height: 34 }}
                    >
                      {sessionUser.nombre
                        ? sessionUser.nombre.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}
                  <span className="me-1">{sessionUser.nombre}</span>
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="userMenuBtn"
                >
                  <li>
                    <Link className="dropdown-item" to="/perfil">
                      Perfil
                    </Link>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Mis pedidos
                    </a>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => {
                        localStorage.removeItem("session_user");
                        window.dispatchEvent(new Event("storage"));
                        setSessionUser(null);
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
              </div>
            )}

            <button
              className="btn d-flex align-items-center"
              style={{ backgroundColor: "#7bc47f", color: "white" }}
              onClick={() => navigate("/carrito")}
            >
              <ShoppingCart className="me-1" size={16} />
              Carrito
              {cartCount > 0 && (
                <>
                  <span className="badge bg-dark rounded-pill ms-2">
                    {cartCount}
                  </span>
                  <small className="ms-2 text-white">
                    ${Number(cartTotalMoney).toLocaleString("es-CL")}
                  </small>
                </>
              )}
            </button>

            {sessionUser && (
              <button
                className="btn btn-outline-light ms-2"
                onClick={() => {
                  localStorage.removeItem("session_user");
                  window.dispatchEvent(new Event("storage"));
                  setSessionUser(null);
                }}
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
