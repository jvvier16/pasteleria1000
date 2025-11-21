import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import pastelesJson from "../data/Pasteles.json";

function loadPasteles() {
  try {
    const raw = localStorage.getItem("pasteles_local");
    const local = raw ? JSON.parse(raw) : null;
    if (Array.isArray(local) && local.length) return local;
  } catch (e) {
    // ignore and fallback to JSON
  }
  return pastelesJson;
}

export default function ProductosVendedor() {
  const [query, setQuery] = useState("");
  const pasteles = useMemo(loadPasteles, []);

  const filtered = pasteles.filter((p) =>
    `${p.nombre} ${p.categoria} ${p.descripcion}`.toLowerCase().includes(query.toLowerCase())
  );

  const totalStock = pasteles.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const totalValue = pasteles.reduce((acc, p) => acc + (Number(p.precio) || 0) * (Number(p.stock) || 0), 0);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h3 className="mb-0">Mis Productos</h3>
          <div className="small text-muted">{pasteles.length} productos · Stock total: {totalStock} · Valor estimado: ${totalValue}</div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <input
            className="form-control form-control-sm input-anim"
            placeholder="Buscar en mis productos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <Link to="/vendedor/productos/agregar" className="btn btn-primary btn-sm">
            + Nuevo
          </Link>
        </div>
      </div>

      <div className="row">
        {filtered.map((p, idx) => (
          <div className="col-md-6 mb-4" key={p.id}>
            <div className={`card h-100 shadow-sm reveal fade-delay-${(idx % 3) + 1}`}>
              <div className="row g-0">
                <div className="col-5 position-relative">
                  <img
                    src={new URL(`../assets/img/${p.imagen.split("/").pop()}`, import.meta.url).href}
                    className="img-fluid rounded-start"
                    alt={p.nombre}
                    style={{ objectFit: "cover", height: "100%", width: "100%" }}
                  />
                  <span className="badge bg-dark text-white position-absolute" style={{ right: 8, top: 8 }}>
                    Stock: {p.stock}
                  </span>
                </div>
                <div className="col-7">
                  <div className="card-body d-flex flex-column h-100">
                    <h5 className="card-title">{p.nombre}</h5>
                    <p className="card-text text-muted mb-1">Categoría: {p.categoria}</p>
                    <p className="card-text mb-1 text-truncate">{p.descripcion}</p>
                    <p className="card-text small">Stock: <strong>{p.stock}</strong></p>
                    <p className="card-text fw-bold mb-2">Precio: ${p.precio}</p>

                    <div className="mt-auto d-flex gap-2">
                      <Link to={`${p.id}`} className="btn btn-outline-primary btn-sm">
                        Ver detalle
                      </Link>
                      <Link to={`${p.id}/editar`} className="btn btn-outline-secondary btn-sm">
                        Editar
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
