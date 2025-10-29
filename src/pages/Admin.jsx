import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
// Uso de emojis en lugar de react-icons para evitar dependencias faltantes

// Usar los datos existentes en el proyecto
import productosData from "../data/Pasteles.json";
import usuariosData from "../data/Usuarios.json";

const AdminDashboard = () => {
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ordenes, setOrdenes] = useState([]);

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
    <div
      className="d-flex"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}
    >
      {/* Sidebar */}
      <div className="bg-white border-end p-3" style={{ width: "250px" }}>
        <h4 className="text-center mb-4 text-primary fw-bold">Panel Admin</h4>
        <ul className="nav flex-column">
          <li className="nav-item">
            <a href="#" className="nav-link active text-primary fw-semibold">
              Dashboard
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link text-dark">
              Órdenes
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link text-dark">
              Productos
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link text-dark">
              Categorías
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link text-dark">
              Usuarios
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link text-dark">
              Reportes
            </a>
          </li>
        </ul>

        <hr />

        <div className="mt-auto">
          <div className="d-flex align-items-center mb-3">
            <span style={{ fontSize: 24 }} className="me-2 text-secondary">
              👤
            </span>
            <span>Perfil</span>
          </div>
          <button className="btn btn-dark w-100 mb-2">
            <span className="me-2">🏬</span> Tienda
          </button>
          <button className="btn btn-danger w-100">
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
                <span style={{ fontSize: 28 }}>🛒</span>
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
                <span style={{ fontSize: 28 }}>📦</span>
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
                <span style={{ fontSize: 28 }}>👥</span>
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
            {
              title: "Tienda",
              desc: "Visualiza la tienda en tiempo real.",
              icon: <span>🏬</span>,
            },
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
