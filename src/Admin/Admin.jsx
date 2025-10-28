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
import { Link, Routes, Route } from "react-router-dom";
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

  /**
   * Efecto de carga inicial
   * - Carga los productos desde localStorage al montar el componente
   * - Maneja errores de datos corruptos
   * - Asegura que productos siempre sea un array
   */
  useEffect(() => {
    try {
      // Cargar y contar productos
      const saved = localStorage.getItem("pasteles_local");
      let productos = [];
      try {
        const parsed = JSON.parse(saved);
        productos = Array.isArray(parsed) ? parsed : [];
      } catch {
        productos = [];
      }
      setProductos(productos);

      // Calcular estadísticas de inventario
      const inventarioTotal = productos.reduce(
        (sum, p) => sum + (Number(p.stock) || 0),
        0
      );

      // Contar usuarios totales (JSON base + localStorage)
      const usuariosRaw = localStorage.getItem("usuarios_local");
      let usuariosLocal = [];
      try {
        const parsed = JSON.parse(usuariosRaw);
        usuariosLocal = Array.isArray(parsed) ? parsed : [];
      } catch {
        usuariosLocal = [];
      }

      // Combinar usuarios sin duplicados — usar correo si existe, si no usar id como clave
      const keysSet = new Set();
      const usuariosUnicos = [...usuariosLocal, ...usuariosBase].filter((u) => {
        // Generar clave única: correo (lowercase) o id fallback o nombre
        const key =
          u && u.correo
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

      // Actualizar estadísticas
      setStats({
        productos: productos.length,
        usuarios: usuariosUnicos.length,
        ordenes: ordenes.length,
        inventario: inventarioTotal,
      });
    } catch (err) {
      console.error("Error cargando datos:", err);
      setProductos([]);
      setStats({
        productos: 0,
        usuarios: usuariosBase.length, // Mantener al menos los usuarios base
        ordenes: 0,
        inventario: 0,
      });
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

  // Si es admin, mostrar el dashboard
  return (
    <div className="container py-4" data-testid="admin-dashboard">
      <h2>Panel de Administración</h2>
      <div className="row mt-4">
        {/* Dashboard Cards */}
        <div className="col-12 mb-4">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card">
                <div
                  className="card-body"
                  data-testid="stats-productos"
                  role="region"
                >
                  <h5>Productos</h5>
                  <p className="h3">{stats.productos} productos</p>
                  <small>Inventario: {stats.inventario} unidades</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div
                  className="card-body"
                  data-testid="stats-usuarios"
                  role="region"
                >
                  <h5>Usuarios</h5>
                  <p className="h3">{stats.usuarios} usuarios</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div
                  className="card-body"
                  data-testid="stats-pedidos"
                  role="region"
                >
                  <h5>Órdenes</h5>
                  <p className="h3">{stats.ordenes} órdenes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="col-12 mb-4">
          <nav>
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <Link className="nav-link" to="/admin/usuarios">
                  Usuarios
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/pasteles">
                  Productos
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/pedidos">
                  Órdenes
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/reportes">
                  Reportes
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Navigation Cards */}
        <div className="col-12 mb-4">
          <h4>Navegación rápida</h4>
          <div className="row g-4">
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h5>Gestión de productos</h5>
                  <Link
                    to="/admin/pasteles"
                    className="btn btn-primary btn-sm"
                    data-testid="nav-ver-productos"
                  >
                    Ver productos
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h5>Gestión de usuarios</h5>
                  <Link to="/admin/usuarios" className="btn btn-primary btn-sm">
                    Ver usuarios
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12">
          <Routes>
            <Route path="usuarios" element={<UsuariosAdmin />} />
            <Route path="pasteles/*" element={<AdminPastel />} />
            <Route path="pedidos" element={<AdminOrdenes />} />
            <Route
              path="/"
              element={
                <div className="card mb-4">
                  <div className="card-body">
                    <p>Selecciona una sección para administrar</p>
                  </div>
                </div>
              }
            />
          </Routes>
          <div className="card mb-4">
            <div className="card-body">
              <h3>Gestión de productos</h3>
              {!showProductForm ? (
                <>
                  <button
                    className="btn btn-primary mb-3"
                    onClick={() => setShowProductForm(true)}
                    data-testid="card-add-pastel"
                  >
                    + Agregar pastel
                  </button>
                  <div className="table-responsive">
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
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteProduct(p.id)}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveProduct}>
                  <div className="mb-3">
                    <label
                      htmlFor="admin-product-nombre"
                      className="form-label"
                    >
                      Nombre
                    </label>
                    <input
                      id="admin-product-nombre"
                      className="form-control"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, nombre: e.target.value }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="admin-product-precio"
                      className="form-label"
                    >
                      Precio
                    </label>
                    <input
                      id="admin-product-precio"
                      type="number"
                      className="form-control"
                      value={formData.precio}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, precio: e.target.value }))
                      }
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowProductForm(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
