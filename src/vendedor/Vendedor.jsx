import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import boletas from "../data/Boleta.json";
import { getSessionUser } from "../utils/session";

export default function Vendedor() {
  const location = useLocation();

  // restore active helper so nav links show current route
  const active = (path) => (location.pathname.startsWith(path) ? "active fw-semibold" : "");

  // orders summary
  const orders = Array.isArray(boletas) ? boletas : [];
  const pendingCount = orders.filter((o) => o.estado && o.estado !== "entregado").length;
  const recent = orders.slice(0, 3);

  // session user (vendedor)
  const sessionUser = getSessionUser();
  const displayName = sessionUser ? `${sessionUser.nombre || ''} ${sessionUser.apellido || ''}`.trim() : "Juan Vendedor";

  // Build an inline SVG avatar (data URL) from initials when no image provided
  const makeInitialsAvatar = (name) => {
    const initials = (name || "JV")
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const bg = "%23eef2ff"; // light background hex encoded (#eef2ff -> %23eef2ff)
    const fg = "%230f172a"; // dark text
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='100%' height='100%' fill='${bg}' rx='48' ry='48'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Helvetica,Arial,sans-serif' font-size='36' fill='${fg}'>${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const avatarSrc = sessionUser?.avatar || sessionUser?.imagen || makeInitialsAvatar(displayName);

  return (
    <div className="container-fluid">
      <div className="row">
        <aside className="col-12 col-md-3 col-lg-2 vh-100 p-3 reveal slide-up fade-delay-1 vendedor-panel shadow-sm">
          <div className="profile-panel text-center">
            <div className="profile-avatar vendedor-avatar mb-2">
              <img src={avatarSrc} alt="avatar" />
            </div>
            <h6 className="profile-name mb-0">{displayName}</h6>
            <div className="profile-email small text-muted">Mi tienda · Pastelería</div>
            <div className="profile-stats mt-3 d-flex justify-content-center" style={{gap:'.6rem'}}>
              <div className="profile-stat text-center">
                <div className="stat-value fw-bold">{/* placeholder producto count - kept from earlier */}24</div>
                <div className="stat-label small">Productos</div>
              </div>
              <div className="profile-stat text-center">
                <div className="stat-value fw-bold">{orders.length}</div>
                <div className="stat-label small">Total Órdenes</div>
              </div>
            </div>
            <div className="avatar-actions mt-3">
              <Link to="/vendedor/productos" className="btn btn-sm btn-primary w-100">Ver Productos</Link>
            </div>

            <div className="orders-panel mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Órdenes</strong>
                <Link to="/vendedor/ordenes" className="small text-decoration-none">Ver todas <span className="order-badge ms-2">{pendingCount}</span></Link>
              </div>
              <div className="list-group orders-preview">
                {recent.map((b) => (
                  <Link key={b.id} to={`/vendedor/ordenes/${b.id}`} className="list-group-item list-group-item-action small d-flex justify-content-between align-items-center">
                    <div className="text-truncate" style={{maxWidth:'120px'}}>#{b.id} — {b.cliente?.nombre || '—'}</div>
                    <div className="text-end small text-muted">${b.total}</div>
                  </Link>
                ))}
                {recent.length === 0 && <div className="small text-muted">Sin órdenes recientes</div>}
              </div>
            </div>
          </div>

          <nav className="nav flex-column vendedor-nav mt-4">
            <li className="nav-item mb-2">
              <Link className={`nav-link ${active("/vendedor/productos")}`} to="/vendedor/productos">
                🍰 Productos
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className={`nav-link ${active("/vendedor/ordenes")}`} to="/vendedor/ordenes">
                📦 Órdenes
              </Link>
            </li>
            <li className="nav-item mt-3">
              <Link className="nav-link text-muted small" to="/vendedor/reportes">
                📈 Reportes
              </Link>
            </li>
          </nav>
        </aside>

        <main className="col p-3">
          <div className="d-flex align-items-center justify-content-between mb-3 reveal slide-up fade-delay-1">
            <div>
              <h4 className="mb-0">Panel Vendedor</h4>
              <div className="small text-muted">Aquí puedes gestionar tus productos y pedidos</div>
            </div>
            <div>
              <button className="btn btn-outline-secondary btn-sm">Ajustes</button>
            </div>
          </div>

          <div className="reveal slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
