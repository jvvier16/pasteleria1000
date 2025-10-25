// src/pages/AdminUsuarios.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import usuariosData from "../data/Usuarios.json";

/**
 * /admin/usuarios
 * - Ruta protegida: solo admin
 * - Muestra usuarios del JSON + LocalStorage
 * - Solo los del LocalStorage se pueden EDITAR / ELIMINAR
 * - Modal Bootstrap 5 para edición (sin contraseña ni role)
 * - Eliminación con confirm() y actualización en vivo
 * - NO cierra sesión si se elimina al usuario actualmente logueado
 * - Muestra etiqueta de origen (Base / Local)
 */
export default function AdminUsuarios() {
  const navigate = useNavigate();

  // Usuarios locales (los únicos editables/eliminables)
  const [usuariosLocal, setUsuariosLocal] = useState([]);

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
  });

  // 🔐 Proteger ruta — solo admin
  useEffect(() => {
    const sessionRaw = localStorage.getItem("session_user");
    if (!sessionRaw) {
      navigate("/"); // no logueado
      return;
    }
    try {
      const session = JSON.parse(sessionRaw);
      if (session.role !== "admin") {
        navigate("/"); // no admin
      }
    } catch {
      navigate("/");
    }
  }, [navigate]);

  // 📥 Cargar usuarios locales del storage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuarios_local");
      if (!raw) {
        localStorage.setItem("usuarios_local", JSON.stringify([]));
        setUsuariosLocal([]);
      } else {
        const arr = JSON.parse(raw);
        setUsuariosLocal(Array.isArray(arr) ? arr : []);
      }
    } catch {
      setUsuariosLocal([]);
    }
  }, []);

  // 🔗 Combinar JSON + Local, marcando origen para la UI
  const usuariosJsonMarcados = useMemo(
    () => (usuariosData || []).map((u) => ({ ...u, _origen: "json" })),
    []
  );
  const usuariosLocalMarcados = useMemo(
    () => (usuariosLocal || []).map((u) => ({ ...u, _origen: "local" })),
    [usuariosLocal]
  );
  const usuariosTodos = useMemo(
    () => [...usuariosJsonMarcados, ...usuariosLocalMarcados],
    [usuariosJsonMarcados, usuariosLocalMarcados]
  );

  // 🗑️ Eliminar usuario LOCAL (confirm + actualización en vivo)
  const handleEliminar = (id) => {
    const u = usuariosLocal.find((x) => x.id === id);
    if (!u) return; // no es local o no existe
    if (!window.confirm(`¿Eliminar a ${u.nombre} ${u.apellido || ""}?`)) return;

    const next = usuariosLocal.filter((x) => x.id !== id);
    setUsuariosLocal(next);
    localStorage.setItem("usuarios_local", JSON.stringify(next));
    // NO cerrar sesión aunque se borre al usuario logueado
  };

  // ✏️ Abrir modal para editar usuario LOCAL
  const handleEditar = (id) => {
    const u = usuariosLocal.find((x) => x.id === id);
    if (!u) return;

    setEditId(id);
    setEditForm({
      nombre: u.nombre || "",
      apellido: u.apellido || "",
      correo: u.correo || "",
      fechaNacimiento: u.fechaNacimiento || "",
      direccion: u.direccion || "",
    });

    try {
      if (!modalInstanceRef.current) {
        // Bootstrap 5 Modal (NECESITA el bundle JS cargado)
        modalInstanceRef.current = new window.bootstrap.Modal(
          modalRef.current,
          {
            backdrop: "static",
          }
        );
      }
      modalInstanceRef.current.show();
    } catch (e) {
      console.error(
        "Bootstrap 5 Modal no disponible. Asegúrate de cargar el JS (bundle) de Bootstrap."
      );
    }
  };

  // 🔎 Validar formato de fecha sencillo (YYYY-MM-DD)
  const validarFecha = (s) => {
    if (!s) return true; // permitir vacío
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(s)) return false;
    const d = new Date(s);
    return !isNaN(d.getTime());
  };

  // 💾 Guardar cambios del usuario LOCAL (sin contraseña ni role)
  const handleGuardar = (e) => {
    e.preventDefault();
    // Validaciones mínimas
    if (!editForm.nombre.trim()) return alert("El nombre es obligatorio");
    if (!editForm.correo.trim()) return alert("El correo es obligatorio");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.correo)) {
      return alert("Correo inválido");
    }
    if (editForm.fechaNacimiento && !validarFecha(editForm.fechaNacimiento)) {
      return alert("Fecha de nacimiento inválida (usa YYYY-MM-DD)");
    }

    // Evitar duplicados de correo (contra JSON + locales, ignorando el propio)
    const correoLower = editForm.correo.toLowerCase();
    const existeOtro = usuariosTodos.some(
      (u) => u.id !== editId && (u.correo || "").toLowerCase() === correoLower
    );
    if (existeOtro) {
      return alert("Ese correo ya está registrado en el sistema");
    }

    // Actualizar y persistir
    const next = usuariosLocal.map((u) =>
      u.id === editId
        ? {
            ...u,
            nombre: editForm.nombre.trim(),
            apellido: (editForm.apellido || "").trim(),
            correo: editForm.correo.trim(),
            fechaNacimiento: editForm.fechaNacimiento || "",
            direccion: (editForm.direccion || "").trim(),
            // role NO se edita — se mantiene
          }
        : u
    );

    setUsuariosLocal(next);
    localStorage.setItem("usuarios_local", JSON.stringify(next));

    // Cerrar modal
    try {
      if (modalInstanceRef.current) modalInstanceRef.current.hide();
    } catch {}
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Usuarios registrados</h2>

      {/* Tabla responsive */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered align-middle">
          <thead className="table-dark">
            <tr>
              <th className="nowrap">ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Role</th>
              <th>Dirección</th>
              <th>Fecha nacimiento</th>
              <th className="th-width-160">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosTodos.map((u) => {
              const esLocal = u._origen === "local";
              return (
                <tr key={`${u._origen}-${u.id}`}>
                  <td>{u.id}</td>
                  <td>
                    {u.nombre} {u.apellido || ""}
                    {u._origen === "json" && (
                      <small className="text-muted ms-2">(Base)</small>
                    )}
                    {u._origen === "local" && (
                      <small className="text-success ms-2">(Local)</small>
                    )}
                  </td>
                  <td>{u.correo}</td>
                  <td>{u.role}</td>
                  <td>{u.direccion || "-"}</td>
                  <td>{u.fechaNacimiento || "-"}</td>
                  <td>
                    {/* Solo locales tienen acciones */}
                    {esLocal ? (
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleEditar(u.id)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleEliminar(u.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <small className="text-muted">(No editable)</small>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de edición (Bootstrap 5) */}
      <div
        className="modal fade"
        id="modalEditarUsuario"
        tabIndex="-1"
        aria-hidden="true"
        ref={modalRef}
      >
        <div className="modal-dialog">
          <form className="modal-content" onSubmit={handleGuardar}>
            <div className="modal-header">
              <h5 className="modal-title">Editar usuario</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() =>
                  modalInstanceRef.current && modalInstanceRef.current.hide()
                }
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              {/* nombre */}
              <div className="mb-3">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.nombre}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nombre: e.target.value })
                  }
                  required
                />
              </div>

              {/* apellido */}
              <div className="mb-3">
                <label className="form-label">Apellido</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.apellido}
                  onChange={(e) =>
                    setEditForm({ ...editForm, apellido: e.target.value })
                  }
                />
              </div>

              {/* correo */}
              <div className="mb-3">
                <label className="form-label">Correo</label>
                <input
                  type="email"
                  className="form-control"
                  value={editForm.correo}
                  onChange={(e) =>
                    setEditForm({ ...editForm, correo: e.target.value })
                  }
                  required
                />
              </div>

              {/* fechaNacimiento */}
              <div className="mb-3">
                <label className="form-label">
                  Fecha de nacimiento (YYYY-MM-DD)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="1990-05-14"
                  value={editForm.fechaNacimiento}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      fechaNacimiento: e.target.value,
                    })
                  }
                />
              </div>

              {/* direccion */}
              <div className="mb-3">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Av. Ejemplo 1234, Comuna"
                  value={editForm.direccion}
                  onChange={(e) =>
                    setEditForm({ ...editForm, direccion: e.target.value })
                  }
                />
              </div>

              {/* role y contraseña NO se editan */}
              <div className="alert alert-info py-2">
                <small>
                  Nota: <strong>role</strong> y <strong>contraseña</strong> no
                  se pueden editar en esta vista.
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  modalInstanceRef.current && modalInstanceRef.current.hide()
                }
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
