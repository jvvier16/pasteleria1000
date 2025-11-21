/**
 * Componente: Panel de Administración
 *
 * Este componente implementa el panel de administración principal de la pastelería.
 * Proporciona funcionalidades para:
 * - Gestión de productos (CRUD)
 * - Persistencia de datos en localStorage
 * - Manejo de autenticación y autorización
 * - Interfaz de usuario intuitiva
 */

import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminPastel from "./AdminPastel";
import UsuariosAdmin from "./UsuariosAdmin";
import AdminOrdenes from "./AdminOrdenes";

import { checkAdmin } from "../utils/adminHelper.js";
import usuariosBase from "../data/Usuarios.json";

export default function Admin() {
  // Si no es admin, mostrar mensaje de no autorizado
  const [showProductForm, setShowProductForm] = useState(false);
  const [productos, setProductos] = useState([]);
  const [formData, setFormData] = useState({ nombre: "", precio: "" });
  const [stats, setStats] = useState({
    productos: 0,
    usuarios: 0,
    ordenes: 0,
    inventario: 0,
  });

  useEffect(() => {
    try {
      // Cargar productos desde localStorage
      const productosRaw = localStorage.getItem("pasteles_local");
      const productosLocal = productosRaw ? JSON.parse(productosRaw) : [];
      setProductos(Array.isArray(productosLocal) ? productosLocal : []);

      // Cargar usuarios desde localStorage y combinar con usuarios base sin duplicados
      const usuariosRaw = localStorage.getItem("usuarios_local");
      let usuariosLocal = [];
      try {
        const parsed = JSON.parse(usuariosRaw);
        usuariosLocal = Array.isArray(parsed) ? parsed : [];
      } catch {
        usuariosLocal = [];
      }

      const keysSet = new Set();
      const usuariosUnicos = [...usuariosLocal, ...usuariosBase].filter((u) => {
        const key = u && u.correo
          ? u.correo.toLowerCase()
          : u && u.id !== undefined
          ? `id:${u.id}`
          : u && u.nombre
          ? `name:${u.nombre}`
          : null;
        if (!key) return false;
        if (keysSet.has(key)) return false;
        keysSet.add(key);
        return true;
      });

      // Contar órdenes desde localStorage
      const ordenesRaw = localStorage.getItem("pedidos_local");
      let ordenes = [];
      try {
        const parsed = JSON.parse(ordenesRaw);
        ordenes = Array.isArray(parsed) ? parsed : [];
      } catch {
        ordenes = [];
      }

      const inventarioTotal = (Array.isArray(productosLocal) ? productosLocal : []).reduce(
        (acc, p) => acc + (Number(p && p.stock) || 0),
        0
      );

      setStats({
        productos: Array.isArray(productosLocal) ? productosLocal.length : 0,
        usuarios: usuariosUnicos.length,
        ordenes: ordenes.length,
        inventario: inventarioTotal,
      });
    } catch (err) {
      console.error("Error cargando datos:", err);
      setProductos([]);
      setStats({ productos: 0, usuarios: usuariosBase.length, ordenes: 0, inventario: 0 });
    }
  }, []);

  // Si no es admin, mostrar mensaje de no autorizado
  const isAdmin = checkAdmin();
  if (!isAdmin) {
    console.log("No hay sesión");
    return (
      <div className="container py-4">
        <div
          className="alert alert-danger"
          role="alert"
          data-testid="no-auth-message"
        >
          No autorizado. Debes iniciar sesión como administrador.
        </div>
      </div>
    );
  }
  console.log("¿Es admin?", isAdmin);

  /**
   * Manejador de guardado de productos
   * @param {Event} e - Evento del formulario
   *
   * Flujo:
   * 1. Previene el envío del formulario
   * 2. Recupera productos existentes
   * 3. Crea nuevo producto con ID único
   * 4. Actualiza localStorage y estado
   * 5. Limpia y cierra el formulario
   */
  const handleSaveProduct = (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem("pasteles_local");
      const existing = saved ? JSON.parse(saved) : [];
      const newProduct = {
        ...formData,
        id: Date.now(),
        precio: Number(formData.precio),
        categoria: "Tortas",
      };
      const updated = [...existing, newProduct];
      localStorage.setItem("pasteles_local", JSON.stringify(updated));
      setProductos(updated);
      setShowProductForm(false);
      setFormData({ nombre: "", precio: "" });
    } catch (err) {
      console.error("Error al guardar:", err);
    }
  };

  /**
   * Manejador de eliminación de productos
   * @param {number} id - ID del producto a eliminar
   *
   * Flujo:
   * 1. Filtra el producto seleccionado
   * 2. Actualiza localStorage
   * 3. Actualiza el estado local
   * 4. Maneja errores si ocurren
   */
  const handleDeleteProduct = (id) => {
    try {
      const updated = productos.filter((p) => p.id !== id);
      localStorage.setItem("pasteles_local", JSON.stringify(updated));
      setProductos(updated);
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();

  // Métricas derivadas para mostrar en la UI
  const totalOrdenes = stats.ordenes || 0;
  const totalProductos = stats.productos || 0;
  const totalUsuarios = stats.usuarios || 0;
  const inventarioActual = stats.inventario || 0;
  const nuevosUsuariosMes = 120;
  const probAumento = 20;

  // Estilos inline para el layout y botones (pequeños toques visuales)
  const sidebarStyle = { width: "250px", minHeight: "100vh" };
  const mainStyle = { flex: 1, padding: "24px" };
  const buttonStyles = {
    transition: "all 0.3s ease",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.08)",
  };

  return (
    <div className="d-flex" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className="bg-white border-end p-3" style={sidebarStyle}>
        <h4 className="text-center mb-4 text-primary fw-bold">
          Panel de Administración
        </h4>
        <nav role="navigation" aria-label="Admin sidebar">
          <div className="list-group list-group-flush">
            <Link
              to="/admin"
              className={`list-group-item list-group-item-action ${location.pathname === "/admin" ? "active" : ""}`}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/pasteles"
              className={`list-group-item list-group-item-action ${location.pathname.startsWith("/admin/pasteles") ? "active" : ""}`}
            >
              Productos
            </Link>
            <Link
              to="/admin/usuarios"
              className={`list-group-item list-group-item-action ${location.pathname === "/admin/usuarios" ? "active" : ""}`}
            >
              Usuarios
            </Link>
            <Link
              to="/admin/pedidos"
              className={`list-group-item list-group-item-action ${location.pathname === "/admin/pedidos" ? "active" : ""}`}
            >
              Órdenes
            </Link>
            <Link
              to="/admin/reportes"
              className={`list-group-item list-group-item-action ${location.pathname === "/admin/reportes" ? "active" : ""}`}
            >
              Reportes
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main style={mainStyle} className="bg-light">
        {/* Decidir si mostramos el dashboard (cuando estamos en /admin)
            o el contenido del submódulo (Outlet) cuando navegamos a
            /admin/pedidos, /admin/pasteles, etc. */}
        {location.pathname === "/admin" || location.pathname === "/admin/" ? (
          <>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h2 className="mb-0">Dashboard</h2>
                <small className="text-muted">Resumen de las actividades diarias</small>
              </div>
            </div>

            {/* Tarjetas de métricas */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div
                  className="card text-white bg-primary shadow-sm h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/admin/pedidos")}
                >
                  <div className="card-body text-center" data-testid="stats-pedidos" role="region">
                    <span className="fs-1">🛒</span>
                    <h4 className="mt-3 mb-1">Compras Totales</h4>
                    <h2 className="display-4 fw-bold mb-0">{totalOrdenes}</h2>
                    <p className="mb-0 small text-white-50">{totalOrdenes} órdenes</p>
                    <small className="text-white-50">Probabilidad de aumento: <strong>{probAumento}%</strong></small>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div
                  className="card text-white bg-success shadow-sm h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/admin/pasteles")}
                >
                  <div className="card-body text-center" data-testid="stats-productos" role="region">
                    <span className="fs-1">🎂</span>
                    <h4 className="mt-3 mb-1">Productos Activos</h4>
                    <h2 className="display-4 fw-bold mb-0">{totalProductos}</h2>
                    <p className="mb-0 small text-white-50">{totalProductos} productos</p>
                    <small className="text-white-50">Inventario: <strong>{inventarioActual} unidades</strong></small>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div
                  className="card text-dark bg-warning shadow-sm h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/admin/usuarios")}
                >
                  <div className="card-body text-center" data-testid="stats-usuarios" role="region">
                    <span className="fs-1">👥</span>
                    <h4 className="mt-3 mb-1">Usuarios Registrados</h4>
                    <h2 className="display-4 fw-bold mb-0">{totalUsuarios}</h2>
                    <p className="mb-0 small text-white-50">{totalUsuarios} usuarios</p>
                    <small className="text-white-50">Nuevos este mes: <strong>{nuevosUsuariosMes}</strong></small>
                  </div>
                </div>
              </div>
            </div>

            {/* Título de la cuadrícula de accesos (mantener tests) */}
            <h4 className="mb-3">Navegación rápida</h4>

            {/* Indicador de stock crítico: listamos los pasteles críticos cuando haya */}
            {(() => {
              const criticalProducts = (productos || []).filter((p) => {
                const s = Number(p && p.stock) || 0;
                // usar stockCritico si está definido; por defecto consideramos 5 unidades como crítico
                const sc = Number(p && p.stockCritico) || 5;
                return s <= sc;
              });

              return (
                <div className="mb-3">
                  {criticalProducts.length > 0 ? (
                    <div className="alert alert-warning" role="status" data-testid="admin-stock-critico">
                      <strong>⚠️ Pasteles en stock crítico ({criticalProducts.length}):</strong>
                      <ul className="mb-0 mt-2">
                        {criticalProducts.map((p) => (
                          <li key={p.id}>{p.nombre} — {p.stock} unidad{Number(p.stock) === 1 ? "" : "es"}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="alert alert-success" role="status" data-testid="admin-stock-ok">
                      ✅ No hay productos en stock crítico. Inventario OK.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Grid de accesos rápidos */}
            <div className="row g-3 mb-4">
              {[
                { title: "Órdenes", desc: "Gestionar compras", icon: "🧾", route: "/admin/pedidos", color: "primary" },
                { title: "Productos", desc: "Administrar inventario", icon: "🎂", route: "/admin/pasteles", color: "success" },
                { title: "Usuarios", desc: "Gestión de cuentas", icon: "👥", route: "/admin/usuarios", color: "info" },
                { title: "Reportes", desc: "Informes y métricas", icon: "📈", route: "/admin/reportes", color: "warning" },
              ].map((card) => (
                <div key={card.title} className="col-md-3">
                  <div className={`card h-100 text-white bg-${card.color} shadow-sm`} style={{ ...buttonStyles }}>
                    <div className="card-body d-flex flex-column align-items-center justify-content-center text-center p-4" onClick={() => {
                      const dest = card.route && card.route.startsWith("/") ? card.route : `/admin/${card.route}`;
                      navigate(dest);
                    }}>
                      <div className="mb-2 fs-2">{card.icon}</div>
                      <h6 className="fw-bold text-white">{card.title}</h6>
                      <p className="small text-white-50 mb-0">{card.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Link rápido mantenido para tests */}
            <div className="mb-4">
              <Link to="/admin/pasteles" className="btn btn-outline-primary btn-sm" data-testid="nav-ver-productos">Ver productos</Link>
            </div>

            <div className="card mb-4 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <h3 className="mb-0">Gestión de productos</h3>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => setShowProductForm((s) => !s)} data-testid="card-add-pastel">{showProductForm ? "Cerrar" : "+ Agregar pastel"}</button>
                </div>

                {!showProductForm ? (
                  <>
                    <div className="table-responsive mt-3">
                      {productos.length === 0 ? (
                        <div className="alert alert-info my-2">No hay productos creados aún.</div>
                      ) : (
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Precio</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productos.map((p) => (
                              <tr key={p.id}>
                                <td>{p.nombre}</td>
                                <td>${p.precio}</td>
                                <td>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(p.id)}>Eliminar</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSaveProduct} className="mt-3">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="admin-product-nombre" className="form-label">Nombre</label>
                        <input id="admin-product-nombre" className="form-control" value={formData.nombre} onChange={(e) => setFormData((f) => ({ ...f, nombre: e.target.value }))} />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label htmlFor="admin-product-precio" className="form-label">Precio</label>
                        <input id="admin-product-precio" type="number" className="form-control" value={formData.precio} onChange={(e) => setFormData((f) => ({ ...f, precio: e.target.value }))} />
                      </div>
                      <div className="col-md-3 d-flex align-items-end mb-3">
                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-primary">Guardar</button>
                          <button type="button" className="btn btn-secondary" onClick={() => setShowProductForm(false)}>Cancelar</button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </>
        ) : location.pathname.startsWith("/admin/pasteles") ? (
          <div>
            <AdminPastel />
          </div>
        ) : (
          <div>
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
