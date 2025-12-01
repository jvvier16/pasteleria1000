import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PerfilPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", correo: "", contrasena: "" });
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [misPedidos, setMisPedidos] = useState([]);

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
      // Support multiple possible image fields saved in session_user
      const rawAvatar = u.avatar || u.imagen || u.image || u.avatarUrl || null;
      if (rawAvatar) {
        // if it's a relative asset path like '../assets/img/xxx', convert via new URL
        const resolve = (val) => {
          if (!val) return null;
          if (typeof val !== "string") return null;
          if (val.startsWith("data:") || val.startsWith("http") || val.startsWith("/") ) return val;
          // handle relative imports pointing to assets
          if (val.includes("assets/img") || val.startsWith("../assets") || val.startsWith("./assets")) {
            try {
              return new URL(val, import.meta.url).href;
            } catch (e) {
              return val;
            }
          }
          return val;
        };
        setAvatar(resolve(rawAvatar));
      }
    } catch (err) {
      console.error("Error parsing session:", err);
      navigate("/login");
    }
  }, [navigate]);

  // Cargar pedidos del usuario
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pedidos_local");
      const all = raw ? JSON.parse(raw) : [];
      const rawUser = localStorage.getItem("session_user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      if (!u) return setMisPedidos([]);
      const uid = u.id !== undefined ? u.id : null;
      const mail = (u.correo || u.email || "").toString().toLowerCase();
      const filtered = Array.isArray(all)
        ? all.filter((p) => {
            // soportar varias formas: userId, user_id, correo, email
            if (uid !== null && (p.userId === uid || p.user_id === uid)) return true;
            const pMail = (p.correo || p.email || "").toString().toLowerCase();
            if (pMail && mail && pMail === mail) return true;
            // also support orders that include a cliente object with correo or id
            if (p.cliente) {
              if (typeof p.cliente === "object") {
                if (p.cliente.id !== undefined && uid !== null && p.cliente.id === uid) return true;
                const cMail = (p.cliente.correo || p.cliente.email || "").toString().toLowerCase();
                if (cMail && mail && cMail === mail) return true;
              }
            }
            return false;
          })
        : [];
      setMisPedidos(filtered);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      setMisPedidos([]);
    }
  }, []);

  // Handlers del formulario
  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const raw = localStorage.getItem("session_user");
      const existing = raw ? JSON.parse(raw) : {};
      
      // Preparar datos para enviar al backend
      const updateData = {
        nombre: form.nombre,
        imagen: avatar || null,  // Enviar la imagen (base64 o URL)
      };
      
      // Obtener el token JWT
      const token = existing.token || localStorage.getItem('jwt_token');
      
      if (token) {
        // Llamar al API del backend para guardar en la base de datos
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8094';
        const response = await fetch(`${API_BASE}/api/v2/perfil`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.error("Error del servidor:", data.message || data.error);
          alert("Error al guardar en el servidor: " + (data.message || "Error desconocido"));
          return;
        }
        
        console.log("Perfil actualizado en el servidor:", data);
      }
      
      // También actualizar localStorage para mantener sincronizado
      const toSave = { ...existing, ...form, imagen: avatar, avatar: avatar };
      localStorage.setItem("session_user", JSON.stringify(toSave));
      
      // notificar otros listeners (Navbar, etc.)
      window.dispatchEvent(new Event("storage"));
      setSaved(true);
    } catch (err) {
      console.error("Error guardando perfil:", err);
      alert("Error al guardar el perfil: " + err.message);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result is a data URL, store and display it
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = async () => {
    if (!window.confirm('¿Eliminar foto de perfil?')) return;
    setAvatar(null);
    try {
      const raw = localStorage.getItem('session_user');
      const existing = raw ? JSON.parse(raw) : {};
      
      // Obtener el token JWT
      const token = existing.token || localStorage.getItem('jwt_token');
      
      if (token) {
        // Llamar al API para eliminar la imagen en la base de datos
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8094';
        await fetch(`${API_BASE}/api/v2/perfil`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ imagen: null })
        });
      }
      
      // Actualizar localStorage
      delete existing.avatar;
      delete existing.imagen;
      delete existing.image;
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
                <div className="profile-avatar mx-auto mb-3" style={{width:140,height:140}} aria-hidden={!avatar}>
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
                  <button className="btn btn-outline-danger btn-sm me-2" onClick={logout}>Cerrar sesión</button>
                  <button className="btn btn-outline-secondary btn-sm" onClick={removeAvatar} type="button">Eliminar foto</button>
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

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">Guardar cambios</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => { setSaved(false); }}>Cancelar</button>
                  </div>
                
                </form>
              </div>

              <div className="mt-4">
                <h5 className="mb-3">Mis órdenes</h5>
                {misPedidos.length === 0 ? (
                  <div className="alert alert-info">No tienes órdenes registradas.</div>
                ) : (
                  <div className="list-group">
                    {misPedidos.map((o) => (
                      <div key={o.id} className="list-group-item list-group-item-action flex-column align-items-start">
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">Orden #{o.id}</h6>
                          <small className="text-muted">{o.fecha || o.createdAt || ''}</small>
                        </div>
                        <p className="mb-1 small text-muted">Estado: <strong>{o.estado || o.status || '—'}</strong></p>
                        {o.total !== undefined && <div className="small">Total: ${Number(o.total).toLocaleString('es-CL')}</div>}
                        {o.items && Array.isArray(o.items) && (
                          <div className="mt-2 small text-muted">Productos: {o.items.length}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
