// Navbar: barra superior con navegación, buscador, menú de categorías y accesos de usuario.
// - Calcula categorías desde el JSON de productos.
// - Controla el estado del carrito y de la sesión leyendo localStorage.
// - Implementa un dropdown controlado en React para evitar conflictos con el JS de Bootstrap.
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search } from "lucide-react";
import blogPosts from "../data/BlogPosts";
import pastelesData from "../data/Pasteles.json";
import { getCart } from "../utils/localstorageHelper";

export default function Navbar() {
  const [categorias, setCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [bump, setBump] = useState(false);
  const [cartTotalMoney, setCartTotalMoney] = useState(0);
  const [sessionUser, setSessionUser] = useState(null);
  const navigate = useNavigate();
  // confirm logout modal
  const logoutModalRef = useRef(null);
  const logoutModalInstance = useRef(null);

  useEffect(() => {
    const cats = new Set();

    // Intentar usar pasteles almacenados en localStorage si existen.
    let source = pastelesData;
    try {
      const rawLocal = localStorage.getItem("pasteles_local");
      const local = rawLocal ? JSON.parse(rawLocal) : [];
      if (local && local.length) source = local;
    } catch {
      // si falla el parse, continuar con el JSON embebido
      source = pastelesData;
    }

    source.forEach((p) => {
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
    const updateCart = () => {
      try {
        const cart = getCart();
        const newCount = cart.reduce((acc, i) => acc + (i.cantidad || 1), 0);
        // trigger bump animation only when count increases
        setCartCount((prev) => {
          if (newCount > prev) {
            setBump(true);
            // remove bump after animation
            setTimeout(() => setBump(false), 400);
          }
          return newCount;
        });
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

    const updateUser = () => {
      try {
        const raw = localStorage.getItem("session_user");
        if (raw) {
          const userData = JSON.parse(raw);
          setSessionUser(userData);
          // Actualizar isAdmin cuando el usuario cambia
          if (userData.role === "admin") {
            console.log("Usuario admin detectado");
          }
        } else {
          setSessionUser(null);
        }
      } catch (err) {
        console.error("Error al cargar usuario:", err);
        setSessionUser(null);
      }
    };

    // Ejecutar actualizaciones iniciales
    updateCart();
    updateUser();

    const onStorage = (e) => {
      if (e.key === null || e.key === "pasteleria_cart") {
        updateCart();
      }
      if (e.key === null || e.key === "session_user") {
        updateUser();
      }
    };

    // Escuchar eventos de storage y custom events
    window.addEventListener("storage", onStorage);
    window.addEventListener("cartUpdated", updateCart);
    window.addEventListener("userLogin", updateUser);
    window.addEventListener("userLogout", updateUser);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cartUpdated", updateCart);
      window.removeEventListener("userLogin", updateUser);
      window.removeEventListener("userLogout", updateUser);
    };
  }, []);

  const isAdmin = Boolean(sessionUser && sessionUser.role === "admin");
  const isVendedor = Boolean(
    sessionUser &&
      (sessionUser.role === "vendedor" || sessionUser.rol === "vendedor")
  );

  const handleLogout = async () => {
    // mostrar modal de confirmación
    try {
      if (!logoutModalInstance.current && window.bootstrap) {
        logoutModalInstance.current = new window.bootstrap.Modal(
          logoutModalRef.current,
          { backdrop: "static" }
        );
        logoutModalInstance.current.show();
      } else {
        // fallback: confirm nativo
        if (window.confirm("¿Cerrar sesión?")) {
          await confirmLogout();
        }
      }
    } catch (err) {
      console.error("Error en handleLogout:", err);
      // si todo falla, intentar logout directo
      if (window.confirm("¿Cerrar sesión?")) {
        await confirmLogout();
      }
    }
  };

  const confirmLogout = async () => {
    try {
      // Guardar el usuario actual para el evento
      const currentUser = sessionUser;

      // Eliminar sesión y actualizar estado
      localStorage.removeItem("session_user");
      setSessionUser(null);

      // Disparar eventos de logout
      window.dispatchEvent(
        new CustomEvent("userLogout", { detail: currentUser })
      );
      window.dispatchEvent(new Event("storage"));

      // Ocultar modal si existe
      try {
        if (logoutModalInstance.current) {
          logoutModalInstance.current.hide();
        }
      } catch (err) {
        console.error("Error ocultando modal:", err);
      }

      // Esperar un tick para que se procesen los cambios
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Redirigir a login
      navigate("/login");
    } catch (err) {
      console.error("Error durante el cierre de sesión:", err);
      throw err; // Propagar el error para manejo
    }
  };

  // control del dropdown de categorias en React para evitar dependencias del JS de Bootstrap
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef(null);
  // blog dropdown control
  const [blogOpen, setBlogOpen] = useState(false);
  const blogRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target))
        setCatOpen(false);
      if (blogRef.current && !blogRef.current.contains(e.target))
        setBlogOpen(false);
    };
    window.addEventListener("click", onDocClick);
    return () => window.removeEventListener("click", onDocClick);
  }, []);

  return (
    <>
      <nav className="navbar navbar-expand-lg site-navbar px-4 py-2 reveal slide-up">
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
            <li className="nav-item dropdown" ref={blogRef}>
              <a
                className={`nav-link dropdown-toggle ${blogOpen ? "show" : ""}`}
                href="#"
                id="blogDropdown"
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  setBlogOpen((v) => !v);
                }}
                aria-expanded={blogOpen}
              >
                Blog
              </a>
              <ul
                className={`dropdown-menu${blogOpen ? " show" : ""}`}
                aria-labelledby="blogDropdown"
              >
                <li>
                  <Link
                    className="dropdown-item"
                    to="/blog"
                    onClick={() => setBlogOpen(false)}
                  >
                    Ver todas
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                {blogPosts.map((b) => (
                  <li key={b.slug}>
                    <Link
                      className="dropdown-item"
                      to={b.slug}
                      onClick={() => setBlogOpen(false)}
                    >
                      {b.title}
                    </Link>
                  </li>
                ))}
              </ul>
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
            {isVendedor && (
              <li className="nav-item">
                <Link className="nav-link nav-vendedor fw-semibold text-dark" to="/vendedor/productos">
                  Panel Vendedor
                </Link>
              </li>
            )}
          </ul>

          {/* Buscador */}
          <form
            className="d-flex me-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchTerm.trim()) {
                navigate(
                  `/productos?search=${encodeURIComponent(searchTerm.trim())}`
                );
                setSearchTerm(""); // Limpiar después de buscar
              }
            }}
          >
            <input
              className="form-control me-2"
              type="search"
              placeholder="Buscar pasteles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchTerm.trim()) {
                  e.preventDefault();
                  navigate(
                    `/productos?search=${encodeURIComponent(searchTerm.trim())}`
                  );
                  setSearchTerm(""); // Limpiar después de buscar
                }
              }}
            />
            <button
              className="btn btn-search rounded-pill d-flex align-items-center justify-content-center"
              type="submit"
              disabled={!searchTerm.trim()}
              aria-label={searchTerm.trim() ? `Buscar ${searchTerm}` : "Buscar"}
              title="Buscar"
            >
              <Search size={16} />
            </button>
          </form>

          {/* Botones login, registro y carrito */}
          <div className="d-flex align-items-center">
            {!sessionUser ? (
              <>
                <button
                  className="btn me-2 btn-login"
                  onClick={() => navigate("/login")}
                >
                  Iniciar Sesión
                </button>
                <button
                  className="btn me-3 btn-register"
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
                  {(sessionUser.avatar || sessionUser.imagen) ? (
                    <img
                      src={sessionUser.avatar || sessionUser.imagen}
                      alt={sessionUser.nombre}
                      className="rounded-circle me-2 avatar-small"
                      loading="lazy"
                    />
                  ) : (
                    <div className="rounded-circle bg-dark text-white d-inline-flex justify-content-center align-items-center me-2 avatar-placeholder">
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
                      Ver perfil
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to={isAdmin ? "/admin/pedidos" : "/pedidos"}>
                      Mis pedidos
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                      data-testid="logout-button"
                      role="menuitem"
                      aria-label="Cerrar sesión"
                    >
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
              </div>
            )}

            {/* Botón Carrito */}
            <button
              className="btn d-flex align-items-center btn-cart position-relative"
              onClick={() => navigate("/carrito")}
              aria-label="Ir al carrito"
            >
              <span className="cart-badge-container d-inline-flex align-items-center me-2">
                <ShoppingCart size={16} />
                {cartCount > 0 && (
                  <span
                    data-testid="cart-badge"
                    className={`cart-badge${bump ? " bump" : ""}`}
                    aria-live="polite"
                  >
                    {cartCount}
                  </span>
                )}
              </span>
              <span>Carrito</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Modal de confirmación de logout (Bootstrap) */}
      <div
        className="modal fade"
        id="logoutModal"
        tabIndex="-1"
        aria-hidden="true"
        ref={logoutModalRef}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirmar cierre de sesión</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() =>
                  logoutModalInstance.current &&
                  logoutModalInstance.current.hide()
                }
              ></button>
            </div>
            <div className="modal-body">
              <p>¿Deseas cerrar sesión?</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  logoutModalInstance.current &&
                  logoutModalInstance.current.hide()
                }
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmLogout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}