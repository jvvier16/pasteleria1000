import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PerfilPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", correo: "", contrasena: "" });
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatar] = useState(null);

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
      if (u.avatar) setAvatar(u.avatar);
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
      const toSave = { ...existing, ...form, ...(avatar ? { avatar } : {}) };
      localStorage.setItem("session_user", JSON.stringify(toSave));
      // notificar otros listeners (Navbar, etc.)
      window.dispatchEvent(new Event("storage"));
      setSaved(true);
    } catch (err) {
      console.error("Error guardando perfil:", err);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    if (!window.confirm('¿Eliminar foto de perfil?')) return;
    setAvatar(null);
    try {
      const raw = localStorage.getItem('session_user');
      const existing = raw ? JSON.parse(raw) : {};
      delete existing.avatar;
      localStorage.setItem('session_user', JSON.stringify(existing));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error removiendo avatar', e);
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
        <div className="col-12 col-md-10">
          <div className="profile-card reveal slide-up">
            <aside className="profile-side">
              <div className="profile-panel text-center">
                <div className="profile-avatar mx-auto mb-3" style={{width:120,height:120}} aria-hidden={!avatar}>
                  {avatar ? (
                    <img src={avatar} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {form.nombre ? form.nombre.split(" ").map(n=>n[0]).slice(0,2).join("") : "U"}
                    </div>
                  )}
                </div>

                <div className="profile-name">{form.nombre || "Usuario"}</div>
                <div className="profile-email">{form.correo || "sin correo"}</div>

                <div className="profile-stats">
                  <div className="profile-stat">
                    <div className="small text-muted">Pedidos</div>
                    <div className="fw-semibold">{(() => {
                      try { const raw = localStorage.getItem('pedidos_local'); const arr = raw ? JSON.parse(raw) : []; return (arr || []).length; } catch { return 0 }
                    })()}</div>
                  </div>
                  <div className="profile-stat">
                    <div className="small text-muted">Rol</div>
                    <div className="fw-semibold">{(() => { try { const raw = localStorage.getItem('session_user'); const u = raw ? JSON.parse(raw) : {}; return u.role || 'cliente' } catch { return 'cliente' } })()}</div>
                  </div>
                </div>

                <div className="profile-cta">
                  <label className="btn btn-outline-secondary btn-sm me-2">
                    Cambiar foto
                    <input className="avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                  <button className="btn btn-outline-danger btn-sm" onClick={logout}>Cerrar sesión</button>
                </div>
              </div>
            </aside>

            <main className="profile-main">
              <div className="profile-panel">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h5 m-0">Editar perfil</h2>
                  {saved && (
                    <div className="badge bg-success text-white">Guardado</div>
                  )}
                </div>

                <form onSubmit={onSubmit} data-testid="perfil-form">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="nombre" className="form-label">Nombre</label>
                      <input id="nombre" name="nombre" value={form.nombre} onChange={onChange} className="form-control" data-testid="perfil-nombre" aria-label="Nombre" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="correo" className="form-label">Correo</label>
                      <input id="correo" name="correo" type="email" value={form.correo} onChange={onChange} className="form-control" data-testid="perfil-correo" aria-label="Correo" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="contrasena" className="form-label">Contraseña</label>
                    <input id="contrasena" name="contrasena" type="password" value={form.contrasena} onChange={onChange} className="form-control" />
                  </div>

                 
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
