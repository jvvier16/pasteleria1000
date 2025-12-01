/**
 * Componente: Administración de Usuarios
 *
 * Este componente permite gestionar todos los usuarios del sistema desde el backend.
 * - Carga usuarios desde GET /api/v1/usuarios
 * - Edición con PUT /api/v1/usuarios
 * - Eliminación con DELETE /api/v1/usuarios/{id}
 *
 * Características:
 * - Vista protegida solo para administradores
 * - CRUD completo de usuarios
 * - Validaciones en tiempo real
 * - Interfaz responsive con Bootstrap 5
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerTodosLosUsuarios,
  actualizarUsuario,
  eliminarUsuario,
} from "../utils/apiHelper";

export default function AdminUsuarios() {
  const navigate = useNavigate();

  // Estados principales
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal edición (Bootstrap 5)
  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    fechaNacimiento: "",
    direccion: "",
    telefono: "",
    role: "",
    activo: true,
  });
  const [showInlineEditor, setShowInlineEditor] = useState(false);

  // 🔐 Proteger ruta — solo admin
  useEffect(() => {
    const sessionRaw = localStorage.getItem("session_user");
    const token = localStorage.getItem("token");

    if (!sessionRaw || !token) {
      navigate("/login");
      return;
    }

    try {
      const session = JSON.parse(sessionRaw);
      const role = (session?.role || "").toLowerCase();
      if (!["admin", "tester"].includes(role)) {
        navigate("/");
        return;
      }
    } catch {
      navigate("/login");
      return;
    }

    cargarUsuarios();
  }, [navigate]);

  // Cargar usuarios del backend
  const cargarUsuarios = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await obtenerTodosLosUsuarios();
      const usuariosData = (response.data || response || []).map((u) => ({
        id: u.userId || u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        correo: u.correo,
        role: u.role,
        fechaNacimiento: u.fechaNacimiento,
        direccion: u.direccion,
        telefono: u.telefono,
        activo: u.activo !== false,
        imagen: u.imagen,
      }));

      setUsuarios(usuariosData);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      if (err.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
      } else if (err.status === 403) {
        setError("No tienes permisos para ver los usuarios.");
      } else {
        setError(err.message || "Error al cargar los usuarios");
      }
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Eliminar usuario
  const handleEliminar = async (id) => {
    const u = usuarios.find((x) => x.id === id);
    if (!u) return;

    // Proteger al admin principal
    if (u.role?.toLowerCase() === "admin") {
      const admins = usuarios.filter((x) => x.role?.toLowerCase() === "admin");
      if (admins.length <= 1) {
        alert("No se puede eliminar el único administrador del sistema");
        return;
      }
    }

    if (!window.confirm(`¿Seguro que deseas eliminar a ${u.nombre} ${u.apellido || ""}?`)) {
      return;
    }

    setSaving(true);
    try {
      await eliminarUsuario(id);
      setUsuarios((prev) => prev.filter((x) => x.id !== id));
      alert(`Usuario ${u.nombre} eliminado correctamente`);
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      alert(err.message || "Error al eliminar el usuario");
    } finally {
      setSaving(false);
    }
  };

  // ✏️ Abrir modal para editar usuario
  const handleEditar = (id) => {
    const u = usuarios.find((x) => x.id === id);
    if (!u) return;

    setEditId(id);
    setEditForm({
      nombre: u.nombre || "",
      apellido: u.apellido || "",
      correo: u.correo || "",
      fechaNacimiento: u.fechaNacimiento || "",
      direccion: u.direccion || "",
      telefono: u.telefono || "",
      role: u.role || "user",
      activo: u.activo !== false,
    });

    try {
      if (!modalInstanceRef.current && modalRef.current) {
        modalInstanceRef.current = new window.bootstrap.Modal(modalRef.current, {
          backdrop: "static",
        });
      }
      modalInstanceRef.current?.show();
      setShowInlineEditor(false);
    } catch {
      setShowInlineEditor(true);
    }
  };

  // 💾 Guardar cambios del usuario
  const handleGuardar = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!editForm.nombre.trim()) return alert("El nombre es obligatorio");
    if (!editForm.correo.trim()) return alert("El correo es obligatorio");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.correo)) {
      return alert("Correo inválido");
    }

    // Verificar duplicados de correo
    const correoLower = editForm.correo.toLowerCase();
    const existeOtro = usuarios.some(
      (u) => u.id !== editId && (u.correo || "").toLowerCase() === correoLower
    );
    if (existeOtro) {
      return alert("Ese correo ya está registrado en el sistema");
    }

    setSaving(true);
    try {
      const usuarioActualizado = {
        userId: editId,
        nombre: editForm.nombre.trim(),
        apellido: (editForm.apellido || "").trim(),
        correo: editForm.correo.trim(),
        fechaNacimiento: editForm.fechaNacimiento || null,
        direccion: (editForm.direccion || "").trim(),
        telefono: (editForm.telefono || "").trim(),
        role: editForm.role || "user",
        activo: editForm.activo,
      };

      await actualizarUsuario(usuarioActualizado);

      // Cerrar modal
      try {
        modalInstanceRef.current?.hide();
      } catch {}
      setShowInlineEditor(false);

      // Recargar usuarios
      await cargarUsuarios();
      alert("Usuario actualizado correctamente");
    } catch (err) {
      console.error("Error actualizando usuario:", err);
      alert(err.message || "Error al actualizar el usuario");
    } finally {
      setSaving(false);
    }
  };

  // Badge de rol
  const getRoleBadge = (role) => {
    const r = (role || "user").toLowerCase();
    switch (r) {
      case "admin":
        return "bg-danger";
      case "vendedor":
        return "bg-primary";
      case "tester":
        return "bg-warning text-dark";
      default:
        return "bg-secondary";
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="container py-4">
        <h2 className="mb-4">Usuarios registrados</h2>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "40vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="container py-4">
        <h2 className="mb-4">Usuarios registrados</h2>
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Error</h5>
          <p>{error}</p>
          <hr />
          <button className="btn btn-outline-danger me-2" onClick={cargarUsuarios}>
            Reintentar
          </button>
          {error.includes("sesión") && (
            <button className="btn btn-danger" onClick={() => navigate("/login")}>
              Ir a iniciar sesión
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          Usuarios registrados <small className="text-muted">({usuarios.length})</small>
        </h2>
        <button className="btn btn-outline-primary btn-sm" onClick={cargarUsuarios} disabled={saving}>
          ↻ Actualizar
        </button>
      </div>

      {/* Editor inline (fallback) */}
      {showInlineEditor && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Editar usuario</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleGuardar}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.nombre}
                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Apellido</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.apellido}
                    onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Correo *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editForm.correo}
                    onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.telefono}
                    onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Rol</label>
                  <select
                    className="form-select"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    disabled={saving}
                  >
                    <option value="user">Usuario</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-select"
                    value={editForm.activo ? "true" : "false"}
                    onChange={(e) => setEditForm({ ...editForm, activo: e.target.value === "true" })}
                    disabled={saving}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Fecha nacimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editForm.fechaNacimiento}
                    onChange={(e) => setEditForm({ ...editForm, fechaNacimiento: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowInlineEditor(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      {usuarios.length === 0 ? (
        <div className="alert alert-info">No hay usuarios registrados.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className={!u.activo ? "table-secondary" : ""}>
                  <td>{u.id}</td>
                  <td>
                    {u.nombre} {u.apellido || ""}
                  </td>
                  <td>{u.correo}</td>
                  <td>
                    <span className={`badge ${getRoleBadge(u.role)}`}>
                      {(u.role || "user").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {u.activo ? (
                      <span className="badge bg-success">Activo</span>
                    ) : (
                      <span className="badge bg-secondary">Inactivo</span>
                    )}
                  </td>
                  <td>{u.telefono || "-"}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEditar(u.id)}
                        disabled={saving}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleEliminar(u.id)}
                        disabled={saving}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de edición (Bootstrap 5) */}
      <div
        className="modal fade"
        id="modalEditarUsuario"
        tabIndex="-1"
        aria-hidden="true"
        ref={modalRef}
      >
        <div className="modal-dialog modal-lg">
          <form className="modal-content" onSubmit={handleGuardar}>
            <div className="modal-header">
              <h5 className="modal-title">Editar usuario</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => modalInstanceRef.current?.hide()}
                aria-label="Close"
                disabled={saving}
              />
            </div>

            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.nombre}
                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Apellido</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.apellido}
                    onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Correo *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editForm.correo}
                    onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.telefono}
                    onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Rol</label>
                  <select
                    className="form-select"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    disabled={saving}
                  >
                    <option value="user">Usuario</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-select"
                    value={editForm.activo ? "true" : "false"}
                    onChange={(e) => setEditForm({ ...editForm, activo: e.target.value === "true" })}
                    disabled={saving}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Fecha nacimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editForm.fechaNacimiento}
                    onChange={(e) => setEditForm({ ...editForm, fechaNacimiento: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Av. Ejemplo 1234, Comuna"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="alert alert-info py-2 mb-0">
                <small>
                  Nota: La <strong>contraseña</strong> no se puede editar desde esta vista.
                  El usuario debe cambiarla desde su perfil.
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => modalInstanceRef.current?.hide()}
                disabled={saving}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
