// Navbar: barra superior con navegación, buscador, menú de categorías y accesos de usuario.
// - Calcula categorías desde el JSON de productos.
// - Controla el estado del carrito y de la sesión leyendo localStorage.
// - Implementa un dropdown controlado en React para evitar conflictos con el JS de Bootstrap.
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import pastelesData from "../data/Pasteles.json";
import { getCart } from "../utils/localstorageHelper";

export default function Navbar() {
  const [categorias, setCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [cartTotalMoney, setCartTotalMoney] = useState(0);
  const [sessionUser, setSessionUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cats = new Set();
    pastelesData.forEach((p) => {
      const nombre = (p.nombre || "").toLowerCase();
      if (nombre.includes("sin azúcar")) cats.add("Sin Azúcar");
      else if (nombre.includes("sin gluten")) cats.add("Sin Gluten");
      else if (nombre.includes("vegana") || nombre.includes("vegano"))
        cats.add("Veganas");
      else if (nombre.includes("especial")) cats.add("Especiales");
      else if (nombre.includes("torta")) cats.add("Tortas");
      const c = (p.categoria || "").toString().trim();
      if (c) cats.add(c);
    });
    if (cats.size === 0) cats.add("Otros");
    setCategorias(Array.from(cats));
  }, []);

  const slugify = (str) =>
    String(str)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\-]/g, "")
      .toLowerCase();

  useEffect(() => {
    const update = () => {
      try {
        const cart = getCart();
        setCartCount(cart.reduce((acc, i) => acc + (i.cantidad || 1), 0));
        setCartTotalMoney(
          cart.reduce(
            (acc, i) => acc + (Number(i.precio) || 0) * (i.cantidad || 1),
            0
          )
        );
      } catch {
        setCartCount(0);
        setCartTotalMoney(0);
      }
    };
    update();

    const onStorage = (e) => {
      if (e.key === null || e.key === "pasteleria_cart") update();
      if (e.key === null || e.key === "session_user") {
        try {
          const raw = localStorage.getItem("session_user");
          setSessionUser(raw ? JSON.parse(raw) : null);
        } catch {
          setSessionUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("session_user");
      setSessionUser(raw ? JSON.parse(raw) : null);
    } catch {
      setSessionUser(null);
    }
  }, []);

  const isAdmin = Boolean(
    sessionUser &&
      (sessionUser.correo || sessionUser.email || "").toLowerCase() ===
        "admin@gmail.com"
  );

  // control del dropdown de categorias en React para evitar dependencias del JS de Bootstrap
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target))
        setCatOpen(false);
    };
    window.addEventListener("click", onDocClick);
    return () => window.removeEventListener("click", onDocClick);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg site-navbar px-4 py-2">
      <Link className="navbar-brand d-flex align-items-center" to="/">
        <img
          src={new URL("../assets/img/logo.png", import.meta.url).href}
          alt="Logo"
          className="logo rounded-circle me-2"
        />
        <span className="brand-text">Pastelería 1000 Sabores</span>
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarContent"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarContent">
        {/* Links principales */}
        <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-3">
          <li className="nav-item">
            <Link className="nav-link active fw-semibold" to="/">
              Home
            </Link>
          </li>

          <li className="nav-item dropdown" ref={catRef}>
            <a
              className={`nav-link dropdown-toggle ${catOpen ? "show" : ""}`}
              href="#"
              id="categoriaDropdown"
              role="button"
              onClick={(e) => {
                e.preventDefault();
                setCatOpen((v) => !v);
              }}
              aria-expanded={catOpen}
            >
              Categorías
            </a>
            <ul
              className={`dropdown-menu${catOpen ? " show" : ""}`}
              aria-labelledby="categoriaDropdown"
            >
              <li>
                <Link
                  className="dropdown-item"
                  to="/categorias"
                  onClick={() => setCatOpen(false)}
                >
                  Ver todas
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              {categorias.map((cat, i) => (
                <li key={i}>
                  <Link
                    className="dropdown-item"
                    to={`/categorias?cat=${encodeURIComponent(slugify(cat))}`}
                    onClick={() => setCatOpen(false)}
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
            <Link className="nav-link" to="/nosotros">
              Nosotros
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
            navigate(`/productos?search=${encodeURIComponent(searchTerm)}`);
          }}
        >
          <input
            className="form-control me-2"
            type="search"
            placeholder="Buscar pasteles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-search rounded-pill" type="submit">
            Buscar
          </button>
        </form>

        {/* Botones login, registro y carrito */}
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
                className="btn rounded-pill d-flex align-items-center dropdown-toggle btn-user"
                type="button"
                data-bs-toggle="dropdown"
              >
                {sessionUser.imagen ? (
                  <img
                    src={sessionUser.imagen}
                    alt={sessionUser.nombre}
                    className="rounded-circle me-2"
                    style={{ width: 34, height: 34, objectFit: "cover" }}
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
                {sessionUser.nombre}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
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
                    className="btn me-3"
                    style={{ backgroundColor: "#4f80e1", color: "white" }}
                    onClick={() => navigate("/register")}
                  >
                    Crear Cuenta
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Botón Carrito */}
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
    </nav>
  );
}
