import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function Vendedor() {
  const location = useLocation();

  const active = (path) => (location.pathname.startsWith(path) ? "active fw-semibold" : "");

  return (
    <div className="container-fluid">
      <div className="row">
        <aside className="col-12 col-md-3 col-lg-2 bg-light vh-100 p-3 reveal slide-up fade-delay-1">
          <h5 className="mb-3">Panel Vendedor</h5>
          <div className="small text-muted mb-3">Accesos rápidos y métricas</div>
          <ul className="nav flex-column">
            <li className="nav-item mb-2">
              <Link className={`nav-link ${active("/vendedor/productos")}`} to="/vendedor/productos">
                Productos
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className={`nav-link ${active("/vendedor/ordenes")}`} to="/vendedor/ordenes">
                Órdenes
              </Link>
            </li>
          </ul>
        </aside>

        <main className="col p-3">
          <div className="reveal slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
