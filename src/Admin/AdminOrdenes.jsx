import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // proteger ruta: solo admin
    try {
      const raw = localStorage.getItem("session_user");
      if (!raw) return navigate("/");
      const s = JSON.parse(raw);
      if (s.role !== "admin") return navigate("/");
    } catch {
      navigate("/");
    }

    const load = () => {
      try {
        const raw = localStorage.getItem("pedidos_local");
        const arr = raw ? JSON.parse(raw) : [];
        setOrdenes(Array.isArray(arr) ? arr.reverse() : []);
      } catch {
        setOrdenes([]);
      }
    };

    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [navigate]);

  const handleEliminar = (id) => {
    if (!window.confirm("Eliminar orden?")) return;
    try {
      const raw = localStorage.getItem("pedidos_local");
      const arr = raw ? JSON.parse(raw) : [];
      const next = arr.filter((o) => o.id !== id);
      localStorage.setItem("pedidos_local", JSON.stringify(next));
      setOrdenes(next.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container py-4">
      <h3>Órdenes</h3>
      {ordenes.length === 0 ? (
        <div className="alert alert-info">No hay órdenes registradas.</div>
      ) : (
        ordenes.map((o) => (
          <div key={o.id} className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5>Pedido {o.id}</h5>
                  <small className="text-muted">
                    {new Date(
                      o.fecha || o.createdAt || Date.now()
                    ).toLocaleString()}
                  </small>
                  <div>
                    <strong>Cliente:</strong> {o.cliente?.nombre || "-"}{" "}
                    {o.cliente?.correo ? `— ${o.cliente.correo}` : ""}
                  </div>
                </div>
                <div className="text-end">
                  <h6>
                    Total: ${Number(o.total || 0).toLocaleString("es-CL")}
                  </h6>
                </div>
              </div>

              <hr />
              <ul>
                {(o.items || []).map((it, i) => (
                  <li key={i}>
                    {it.nombre || it.id} x {it.cantidad} — $
                    {Number(it.precio || 0).toLocaleString("es-CL")}
                  </li>
                ))}
              </ul>

              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleEliminar(o.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
