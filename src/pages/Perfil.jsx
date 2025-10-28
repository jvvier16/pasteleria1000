import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PerfilPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", correo: "", contrasena: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("session_user");
    if (!raw) {
      navigate("/login");
      return;
    }
    try {
      const u = JSON.parse(raw);
      if (!u || !u.id) {
        navigate("/login");
        return;
      }
      setForm({
        nombre: u.nombre || "",
        correo: u.correo || u.email || "",
        contrasena: u.contrasena || u.password || "",
      });
    } catch (err) {
      console.error("Error parsing session:", err);
      navigate("/login");
    }
  }, [navigate]);

  // Handlers del formulario
  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    try {
      const raw = localStorage.getItem("session_user");
      const existing = raw ? JSON.parse(raw) : {};
      const toSave = { ...existing, ...form };
      localStorage.setItem("session_user", JSON.stringify(toSave));
      // notificar otros listeners (Navbar, etc.)
      window.dispatchEvent(new Event("storage"));
      setSaved(true);
    } catch (err) {
      console.error("Error guardando perfil:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("session_user");
    window.dispatchEvent(new Event("storage"));
    navigate("/");
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 m-0">Mi perfil</h2>
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-outline-danger btn-sm"
                >
                  Cerrar sesión
                </button>
              </div>

              {saved && (
                <div className="alert alert-success">
                  Cambios guardados correctamente
                </div>
              )}

              <form onSubmit={onSubmit} data-testid="perfil-form">
                <div className="mb-3">
                  <label htmlFor="nombre" className="form-label">
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    value={form.nombre}
                    onChange={onChange}
                    className="form-control"
                    data-testid="perfil-nombre"
                    aria-label="Nombre"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="correo" className="form-label">
                    Correo
                  </label>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    value={form.correo}
                    onChange={onChange}
                    className="form-control"
                    data-testid="perfil-correo"
                    aria-label="Correo"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="contrasena" className="form-label">
                    Contraseña
                  </label>
                  <input
                    id="contrasena"
                    name="contrasena"
                    type="password"
                    value={form.contrasena}
                    onChange={onChange}
                    className="form-control"
                  />
                </div>

                <button className="btn btn-dark w-100">Guardar cambios</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
