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

  // Estilos inline para los botones del admin
  const buttonStyles = {
    transition: "all 0.3s ease",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  };

  return (
    <div className="d-flex bg-light admin-min-vh">
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

        {/* Tarjetas de métricas como botones */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <button
              onClick={() => navigate("/admin/ordenes")}
              className="card w-100 border-0 bg-primary text-white h-100 admin-stat-button"
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "translateY(-5px)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <div className="card-body text-center">
                <span className="fs-1">🛒</span>
                <h4 className="mt-3 mb-2">Compras Totales</h4>
                <h2 className="display-4 fw-bold mb-0">{totalOrdenes}</h2>
                <small className="text-white-50">Click para ver detalles</small>
              </div>
            </button>
          </div>

          <div className="col-md-4">
            <button
              onClick={() => navigate("/admin/pasteles")}
              className="card w-100 border-0 bg-success text-white h-100 admin-stat-button"
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "translateY(-5px)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <div className="card-body text-center">
                <span className="fs-1">🎂</span>
                <h4 className="mt-3 mb-2">Productos Activos</h4>
                <h2 className="display-4 fw-bold mb-0">{totalProductos}</h2>
                <small className="text-white-50">Click para administrar</small>
              </div>
            </button>
          </div>

          <div className="col-md-4">
            <button
              onClick={() => navigate("/admin/usuarios")}
              className="card w-100 border-0 bg-info text-white h-100 admin-stat-button"
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "translateY(-5px)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <div className="card-body text-center">
                <span className="fs-1">👥</span>
                <h4 className="mt-3 mb-2">Usuarios Registrados</h4>
                <h2 className="display-4 fw-bold mb-0">{totalUsuarios}</h2>
                <small className="text-white-50">Click para gestionar</small>
              </div>
            </button>
          </div>
        </div>

        {/* Cuadrícula de accesos con botones */}
        <div className="row g-3">
          {[
            {
              title: "Órdenes",
              desc: "Gestión y seguimiento de compras",
              icon: "🧾",
              route: "/admin/ordenes",
              color: "primary",
            },
            {
              title: "Productos",
              desc: "Administrar pasteles y stock",
              icon: "🎂",
              route: "/admin/pasteles",
              color: "success",
            },
            {
              title: "Usuarios",
              desc: "Gestión de cuentas",
              icon: "👥",
              route: "/admin/usuarios",
              color: "info",
            },
            {
              title: "Reportes",
              desc: "Ver estadísticas y gráficos",
              icon: "📊",
              route: "/admin/reportes",
              color: "warning",
            },
            {
              title: "Agregar Pastel",
              desc: "Crear nuevo producto",
              icon: "➕",
              route: "/admin/pasteles/agregar",
              color: "success",
            },
          ].map((card) => (
            <div key={card.title} className="col-md-4">
              <button
                onClick={() => navigate(card.route)}
                className={`card h-100 w-100 border-0 bg-${card.color} text-white admin-card-button`}
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "translateY(-5px)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div className="card-body d-flex flex-column align-items-center text-center p-4">
                  <div className="mb-3 fs-1">{card.icon}</div>
                  <h4 className="fw-bold mb-2">{card.title}</h4>
                  <p className="mb-0 text-white-50">{card.desc}</p>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
