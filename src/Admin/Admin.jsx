import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
// Uso de emojis en lugar de react-icons para evitar dependencias faltantes

// Usar los datos existentes en el proyecto
import productosData from "../data/Pasteles.json";
import usuariosData from "../data/Usuarios.json";

const AdminDashboard = () => {
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar datos reales (pueden venir de archivos o API)
    setProductos(productosData || []);
    setUsuarios(usuariosData || []);
    // las órdenes pueden venir de localStorage (pedidos_local) — usar como fuente principal
    try {
      const raw = localStorage.getItem("pedidos_local");
      const parsed = raw ? JSON.parse(raw) : [];
      setOrdenes(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      setOrdenes([]);
    }
  }, []);

  // Cálculos dinámicos
  const totalProductos = productos.length;
  const totalUsuarios = usuarios.length;
  const totalOrdenes = ordenes.length;
  const inventarioActual = 500;
  const nuevosUsuariosMes = 120;
  const probAumento = 20;

  return (
    <div className="d-flex bg-muted admin-min-vh">
      {/* Sidebar */}
      <div className="bg-white border-end p-3 admin-sidebar-width">
        <h4 className="text-center mb-4 text-primary fw-bold">Panel Admin</h4>
        <ul className="nav flex-column">
          <li className="nav-item">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-link ${
                  isActive ? "active text-primary fw-semibold" : "text-dark"
                }`
              }
            >
              Dashboard
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/admin/ordenes"
              className={({ isActive }) =>
                isActive ? "nav-link active text-primary" : "nav-link text-dark"
              }
            >
              Órdenes
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/admin/pasteles"
              className={({ isActive }) =>
                isActive ? "nav-link active text-primary" : "nav-link text-dark"
              }
            >
              Productos
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/categorias"
              className={({ isActive }) =>
                isActive ? "nav-link active text-primary" : "nav-link text-dark"
              }
            >
              Categorías
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/admin/usuarios"
              className={({ isActive }) =>
                isActive ? "nav-link active text-primary" : "nav-link text-dark"
              }
            >
              Usuarios
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/admin/reportes"
              className={({ isActive }) =>
                isActive ? "nav-link active text-primary" : "nav-link text-dark"
              }
            >
              Reportes
            </NavLink>
          </li>
        </ul>

        <hr />

        <div className="mt-auto">
          <div className="d-flex align-items-center mb-3">
            <span className="fs-4 me-2 text-secondary">👤</span>
            <NavLink to="/perfil" className="text-dark">
              Perfil
            </NavLink>
          </div>
          <button
            className="btn btn-danger w-100"
            onClick={() => {
              try {
                localStorage.removeItem("session_user");
                window.dispatchEvent(new Event("storage"));
              } catch {}
              navigate("/");
            }}
          >
            <span className="me-2">🚪</span> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-grow-1 p-4">
        <h3 className="fw-bold">Dashboard</h3>
        <p className="text-muted">Resumen de las actividades diarias</p>

        {/* Tarjetas de métricas */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card text-white bg-primary shadow-sm h-100">
              <div className="card-body">
                <span className="fs-2">🛒</span>
                <h4 className="mt-3">Compras</h4>
                <h2>{totalOrdenes}</h2>
                <small>
                  Probabilidad de aumento: <strong>{probAumento}%</strong>
                </small>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-white bg-success shadow-sm h-100">
              <div className="card-body">
                <span className="fs-2">📦</span>
                <h4 className="mt-3">Productos</h4>
                <h2>{totalProductos}</h2>
                <small>
                  Inventario actual: <strong>{inventarioActual}</strong>
                </small>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-dark bg-warning shadow-sm h-100">
              <div className="card-body">
                <span className="fs-2">👥</span>
                <h4 className="mt-3">Usuarios</h4>
                <h2>{totalUsuarios}</h2>
                <small>
                  Nuevos usuarios este mes: <strong>{nuevosUsuariosMes}</strong>
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Cuadrícula de accesos */}
        <div className="row g-3">
          {[
            {
              title: "Dashboard",
              desc: "Visión general de todas las métricas.",
              icon: <span>📊</span>,
            },
            {
              title: "Órdenes",
              desc: "Gestión y seguimiento de compras.",
              icon: <span>🧾</span>,
            },
            {
              title: "Productos",
              desc: "Administrar inventario y detalles.",
              icon: <span>📦</span>,
            },
            {
              title: "Categorías",
              desc: "Organizar productos por categoría.",
              icon: <span>🗂️</span>,
            },
            {
              title: "Usuarios",
              desc: "Gestión de cuentas de usuario.",
              icon: <span>👥</span>,
            },
            {
              title: "Reportes",
              desc: "Generar informes detallados.",
              icon: <span>📈</span>,
            },
            {
              title: "Perfil",
              desc: "Información personal y configuración.",
              icon: <span>👤</span>,
            },
            // 'Tienda' eliminado del panel admin por decisión de UX
          ].map((card, index) => (
            <div key={index} className="col-md-3">
              <div className="card h-100 text-center shadow-sm border-0">
                <div className="card-body">
                  <div className="mb-2 fs-3 text-primary">{card.icon}</div>
                  <h6 className="fw-bold">{card.title}</h6>
                  <p className="text-muted small">{card.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
