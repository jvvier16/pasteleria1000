// Perfil: muestra información del usuario autenticado y permite cerrar sesión.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nombre: "", correo: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("session_user");
      const parsed = raw ? JSON.parse(raw) : null;
      setUser(parsed);
      if (parsed)
        setForm({ nombre: parsed.nombre || "", correo: parsed.correo || "" });
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

      {!editing ? (
        <>
          <p>
            <strong>Correo:</strong> {user.correo}
          </p>
          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              Editar perfil
            </button>
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
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // validar correo simple
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
              return alert("Correo inválido");
            }

            try {
              // actualizar session_user
              const updated = {
                ...user,
                nombre: form.nombre,
                correo: form.correo,
              };
              localStorage.setItem("session_user", JSON.stringify(updated));
              // actualizar usuarios_local si existe el usuario allí
              try {
                const rawLocal = localStorage.getItem("usuarios_local");
                const arrLocal = rawLocal ? JSON.parse(rawLocal) : [];
                const idx = arrLocal.findIndex((u) => u.id === user.id);
                if (idx !== -1) {
                  arrLocal[idx] = {
                    ...arrLocal[idx],
                    nombre: form.nombre,
                    correo: form.correo,
                  };
                  localStorage.setItem(
                    "usuarios_local",
                    JSON.stringify(arrLocal)
                  );
                }
              } catch {}

              window.dispatchEvent(new Event("storage"));
              setUser(updated);
              setEditing(false);
            } catch (err) {
              console.error(err);
              alert("No se pudo actualizar el perfil");
            }
          }}
        >
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input
              className="form-control"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Correo</label>
            <input
              className="form-control"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
            />
          </div>
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-success">
              Guardar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditing(false);
                setForm({
                  nombre: user.nombre || "",
                  correo: user.correo || "",
                });
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
