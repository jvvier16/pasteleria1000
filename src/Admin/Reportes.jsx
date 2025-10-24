import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminReportes() {
  const [mensajes, setMensajes] = useState([]);
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
        const raw = localStorage.getItem("reportes_contacto");
        const arr = raw ? JSON.parse(raw) : [];
        setMensajes(Array.isArray(arr) ? arr : []);
      } catch {
        setMensajes([]);
      }
    };

    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [navigate]);

  const handleEliminar = (id) => {
    if (!window.confirm("Eliminar este mensaje?")) return;
    try {
      const raw = localStorage.getItem("reportes_contacto");
      const arr = raw ? JSON.parse(raw) : [];
      const next = arr.filter((m) => m.id !== id);
      localStorage.setItem("reportes_contacto", JSON.stringify(next));
      setMensajes(next);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = () => {
    if (!window.confirm("Eliminar todos los mensajes?")) return;
    localStorage.removeItem("reportes_contacto");
    setMensajes([]);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Reportes de Contacto</h3>
        <div>
          <button className="btn btn-danger me-2" onClick={handleClearAll}>
            Eliminar todos
          </button>
        </div>
      </div>

      {mensajes.length === 0 ? (
        <div className="alert alert-info">No hay mensajes registrados.</div>
      ) : (
        mensajes.map((m) => (
          <div key={m.id} className="card mb-2">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="mb-1">{m.nombre}</h6>
                  <small className="text-muted">{m.correo}</small>
                </div>
                <div className="text-end">
                  <small className="text-muted">
                    {new Date(m.createdAt).toLocaleString()}
                  </small>
                </div>
              </div>
              <p className="mt-2">{m.mensaje}</p>
              <div className="text-end">
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleEliminar(m.id)}
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
