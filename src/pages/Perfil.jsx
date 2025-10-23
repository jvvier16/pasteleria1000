import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("session_user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch (err) {
      setUser(null);
    }
  }, []);

  if (!user) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">No has iniciado sesión.</div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h3>Perfil de {user.nombre}</h3>
      <p>
        <strong>Correo:</strong> {user.correo}
      </p>
      <div className="d-flex gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => {
            localStorage.removeItem("session_user");
            window.dispatchEvent(new Event("storage"));
            navigate("/");
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
