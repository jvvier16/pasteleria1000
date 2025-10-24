import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import pastelesData from "../data/Pasteles.json";

// 🧁 Panel Admin de Pasteles
// - Muestra TODOS (JSON + LocalStorage)
// - Solo los del LocalStorage se pueden editar/eliminar
// - Edición en Modal de Bootstrap (nombre, descripcion, precio, stock, categoria)

export default function AdminPasteles() {
  const navigate = useNavigate();

  // LocalStorage: solo los creados por admin
  const [pastelesLocal, setPastelesLocal] = useState([]);

  // Para edición en modal
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    categoria: "",
  });

  // Ref al modal y a la instancia de Bootstrap
  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);

  // 🔐 Proteger ruta (solo admin)
  useEffect(() => {
    const sessionRaw = localStorage.getItem("session_user");
    if (!sessionRaw) {
      navigate("/");
      return;
    }
    try {
      const session = JSON.parse(sessionRaw);
      if (session.role !== "admin") {
        navigate("/");
      }
    } catch {
      navigate("/");
    }
  }, [navigate]);

  // 📥 Cargar pasteles locales al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pasteles_local");
      const arr = raw ? JSON.parse(raw) : [];
      setPastelesLocal(Array.isArray(arr) ? arr : []);
    } catch {
      setPastelesLocal([]);
    }
  }, []);

  // 🖼️ Resolver imágenes de los que vienen del JSON (mantener filename)
  const baseJsonResuelto = useMemo(() => {
    return pastelesData.map((p) => {
      // si tiene imagen relativa, resolver a /assets
      const filename = (p.imagen || "").split("/").pop();
      const imageUrl = filename
        ? new URL(`../assets/img/${filename}`, import.meta.url).href
        : "";
      return { ...p, imagen: imageUrl, _origen: "json" };
    });
  }, []);

  // Marcar origen local
  const localesMarcados = useMemo(() => {
    return (pastelesLocal || []).map((p) => ({
      ...p,
      // locales pueden venir con imagen "", Card muestra placeholder
      _origen: "local",
    }));
  }, [pastelesLocal]);

  // 🔗 Combinar para mostrar (H1: todos)
  const todos = useMemo(
    () => [...baseJsonResuelto, ...localesMarcados],
    [baseJsonResuelto, localesMarcados]
  );

  // 🧹 Eliminar (solo local)
  const handleEliminar = (id) => {
    const pastel = pastelesLocal.find((p) => p.id === id);
    if (!pastel) return; // no es local o no existe

    if (!window.confirm(`¿Eliminar "${pastel.nombre}"?`)) return;

    const next = pastelesLocal.filter((p) => p.id !== id);
    setPastelesLocal(next);
    localStorage.setItem("pasteles_local", JSON.stringify(next));
  };

  // ✏️ Abrir modal para Editar (solo local)
  const handleEditar = (id) => {
    const pastel = pastelesLocal.find((p) => p.id === id);
    if (!pastel) return;

    setEditId(id);
    setEditForm({
      nombre: pastel.nombre || "",
      descripcion: pastel.descripcion || "",
      precio: pastel.precio ?? "",
      stock: pastel.stock ?? "",
      categoria: pastel.categoria || "",
    });

    // Mostrar modal Bootstrap
    try {
      // requiere bootstrap JS vía CDN: window.bootstrap.Modal
      if (!modalInstanceRef.current) {
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
        "Bootstrap Modal no disponible. Asegúrate de incluir el JS de Bootstrap por CDN."
      );
    }
  };

  // 💾 Guardar cambios (localStorage + estado) y cerrar modal
  const handleGuardar = (e) => {
    e.preventDefault();

    // Validaciones mínimas
    if (!editForm.nombre.trim()) return alert("El nombre es obligatorio");
    const precioNum = Number(editForm.precio);
    const stockNum = Number(editForm.stock);
    if (Number.isNaN(precioNum) || precioNum < 0) {
      return alert("Precio inválido");
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      return alert("Stock inválido");
    }

    const next = pastelesLocal.map((p) =>
      p.id === editId
        ? {
            ...p,
            nombre: editForm.nombre.trim(),
            descripcion: editForm.descripcion.trim(),
            precio: precioNum,
            stock: stockNum,
            categoria: (editForm.categoria || "").trim(),
          }
        : p
    );

    setPastelesLocal(next);
    localStorage.setItem("pasteles_local", JSON.stringify(next));

    // Cerrar modal (G1)
    try {
      if (modalInstanceRef.current) {
        modalInstanceRef.current.hide();
      }
    } catch {}
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2>Administrar Pasteles</h2>
        <a href="/admin/pasteles/agregar" className="btn btn-success">
          + Agregar pastel
        </a>
      </div>

      {/* Grid de cards (similar a Productos) */}
      <div className="cards-grid mt-3">
        {todos.map((p) => (
          <Card
            key={`${p._origen}-${p.id}`}
            id={p.id}
            nombre={p.nombre}
            descripcion={p.descripcion}
            precio={Number(p.precio)}
            imagen={p.imagen} // si "" el Card muestra placeholder
            // --- Props admin ---
            origen={p._origen} // "json" o "local"
            onEditar={handleEditar}
            onEliminar={handleEliminar}
          />
        ))}
      </div>

      {/* Modal Bootstrap (único / M1) */}
      <div
        className="modal fade"
        id="modalEditarPastel"
        tabIndex="-1"
        aria-hidden="true"
        ref={modalRef}
      >
        <div className="modal-dialog">
          <form className="modal-content" onSubmit={handleGuardar}>
            <div className="modal-header">
              <h5 className="modal-title">Editar pastel</h5>
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

              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  value={editForm.descripcion}
                  onChange={(e) =>
                    setEditForm({ ...editForm, descripcion: e.target.value })
                  }
                  required
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label">Precio</label>
                <input
                  type="number"
                  className="form-control"
                  value={editForm.precio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, precio: e.target.value })
                  }
                  required
                  min="0"
                  step="1"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Stock</label>
                <input
                  type="number"
                  className="form-control"
                  value={editForm.stock}
                  onChange={(e) =>
                    setEditForm({ ...editForm, stock: e.target.value })
                  }
                  required
                  min="0"
                  step="1"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Categoría</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.categoria}
                  onChange={(e) =>
                    setEditForm({ ...editForm, categoria: e.target.value })
                  }
                  required
                />
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
