import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import { addToCart } from "../utils/cart.js";
import pastelesData from "../data/Pasteles.json";

/**
 * @component AdminPasteles
 * @description Panel de administración de pasteles que permite:
 * - Visualizar todos los pasteles (tanto de JSON como LocalStorage)
 * - Editar o eliminar pasteles almacenados en LocalStorage
 * - Gestionar pasteles mediante un modal de Bootstrap
 * - Controlar stock y categorías
 *
 * Solo accesible para usuarios con rol de administrador
 * @returns {JSX.Element} Panel de administración de pasteles
 */
export default function AdminPasteles() {
  const navigate = useNavigate();

  /** @state {Array} pastelesLocal - Lista de pasteles creados por el admin en localStorage */
  const [pastelesLocal, setPastelesLocal] = useState([]);

  /** @state {string|null} editId - ID del pastel que se está editando actualmente */
  const [editId, setEditId] = useState(null);

  /**
   * @state {Object} editForm - Formulario para edición de pasteles
   * @property {string} nombre - Nombre del pastel
   * @property {string} descripcion - Descripción del pastel
   * @property {string} precio - Precio del pastel
   * @property {string} stock - Cantidad disponible
   * @property {string} stockCritico - Nivel de stock para alertas
   * @property {string} categoria - Categoría del pastel
   */
  const [editForm, setEditForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    stockCritico: "",
    categoria: "",
  });

  // Lista de categorías disponibles
  const [categorias, setCategorias] = useState([]);

  // Ref al modal y a la instancia de Bootstrap
  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);
  const [showInlineEditor, setShowInlineEditor] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ nombre: "", precio: "" });

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

  // 📥 Cargar pasteles y categorías al montar
  useEffect(() => {
    try {
      // Cargar pasteles
      const rawPasteles = localStorage.getItem("pasteles_local");
      const arrPasteles = rawPasteles ? JSON.parse(rawPasteles) : [];
      setPastelesLocal(Array.isArray(arrPasteles) ? arrPasteles : []);

      // Cargar categorías
      const rawCategorias = localStorage.getItem("categorias_local");
      if (rawCategorias) {
        setCategorias(JSON.parse(rawCategorias));
      } else {
        // Categorías por defecto si no existen
        const categoriasDefault = [
          "Tortas",
          "Postres",
          "Sin Azúcar",
          "Sin Gluten",
          "Veganas",
          "Especiales",
        ];
        localStorage.setItem(
          "categorias_local",
          JSON.stringify(categoriasDefault)
        );
        setCategorias(categoriasDefault);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      setPastelesLocal([]);
      setCategorias([]);
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

  /**
   * @function localesMarcados
   * @description Marca los pasteles del localStorage con origen "local"
   * @returns {Array} Lista de pasteles con origen marcado
   */
  const localesMarcados = useMemo(() => {
    return (pastelesLocal || []).map((p) => {
      // resolver imagen local si viene como filename relativo
      const filename = (p.imagen || "").split("/").pop();
      const imageUrl = filename
        ? new URL(`../assets/img/${filename}`, import.meta.url).href
        : p.imagen || "";
      return {
        ...p,
        imagen: imageUrl,
        // locales pueden venir con imagen "", Card muestra placeholder
        _origen: "local",
      };
    });
  }, [pastelesLocal]);

  // 🔗 Mostrar solo los pasteles locales en el panel admin (son los editables)
  // - El resto (JSON) se muestra en la tienda pública, pero en admin sólo
  //   queremos permitir editar/Eliminar los que fueron creados localmente.
  // Cambiamos para mostrar también las imágenes de los pasteles JSON en el
  // panel admin: combinamos los locales (editables) y los del JSON (solo lectura)
  const todos = useMemo(() => {
    const locals = localesMarcados || [];
    // incluir JSON solo si no está ya en locales (evitar duplicados)
    const jsonOnly = baseJsonResuelto.filter(
      (b) => !locals.find((l) => String(l.id) === String(b.id))
    );
    return [...locals, ...jsonOnly];
  }, [localesMarcados, baseJsonResuelto]);

  /**
   * @function handleEliminar
   * @description Elimina un pastel del localStorage después de confirmar
   * @param {string} id - ID del pastel a eliminar
   */
  const handleEliminar = (id) => {
    const pastel = pastelesLocal.find((p) => p.id === id);
    if (!pastel) return; // no es local o no existe

    if (!window.confirm(`¿Eliminar "${pastel.nombre}"?`)) return;

    const next = pastelesLocal.filter((p) => p.id !== id);
    setPastelesLocal(next);
    localStorage.setItem("pasteles_local", JSON.stringify(next));
  };

  // Permitir agregar al carrito desde el panel admin
  const handleAgregar = (product) => {
    try {
      // product puede venir con cantidad, fallback a 1
      const qty = Number(product.cantidad) || 1;
      addToCart(product, qty);
      // avisar a listeners (cart UI) que hubo un cambio
      try {
        window.dispatchEvent(new Event("cart:updated"));
      } catch (e) {}
      // feedback inmediato
      try {
        // si hay alguna interfaz de notificaciones, mejor usarla; por ahora alert
        alert(`${product.nombre || product.titulo || 'Producto'} agregado al carrito`);
      } catch (e) {}
      return true;
    } catch (err) {
      console.error("Error agregando al carrito desde AdminPastel:", err);
      return false;
    }
  };

  /**
   * @function handleEditar
   * @description Abre el modal de edición para un pastel específico
   * Carga los datos del pastel en el formulario de edición
   * @param {string} id - ID del pastel a editar
   */
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
      setShowInlineEditor(false);
    } catch (e) {
      console.error(
        "Bootstrap Modal no disponible. Asegúrate de incluir el JS de Bootstrap por CDN."
      );
      // Mostrar formulario inline como fallback
      setShowInlineEditor(true);
    }
  };

  /**
   * @function handleGuardar
   * @description Guarda los cambios del formulario de edición
   * Valida los datos antes de guardar y actualiza tanto el estado como localStorage
   * @param {Event} e - Evento del formulario
   */
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
      setShowInlineEditor(false);
    } catch {}
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2>Administrar Pasteles</h2>
        <div className="d-flex gap-2">
          <a
            href="/admin/pasteles/agregar"
            className="btn btn-success"
            data-testid="admin-add-pastel-link"
          >
            + Agregar pastel
          </a>
          <button
            type="button"
            className="btn btn-outline-primary"
            data-testid="card-add-pastel"
            onClick={() => setShowAddForm((s) => !s)}
          >
            {showAddForm ? "Cerrar" : "+ Agregar pastel"}
          </button>
        </div>
      </div>
      {showAddForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const saved = localStorage.getItem("pasteles_local");
              const existing = saved ? JSON.parse(saved) : [];
              const newProduct = {
                id: Date.now(),
                nombre: (addForm.nombre || "").trim(),
                descripcion: "",
                precio: Number(addForm.precio) || 0,
                stock: 0,
                categoria: "Tortas",
                imagen: "",
              };
              const updated = Array.isArray(existing) ? [...existing, newProduct] : [newProduct];
              localStorage.setItem("pasteles_local", JSON.stringify(updated));
              setPastelesLocal(updated);
              setAddForm({ nombre: "", precio: "" });
              setShowAddForm(false);
            } catch (err) {
              console.error("Error al crear producto:", err);
            }
          }}
          className="card mb-3"
        >
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="add-nombre" className="form-label">Nombre</label>
                <input
                  id="add-nombre"
                  name="nombre"
                  className="form-control"
                  value={addForm.nombre}
                  onChange={(e) => setAddForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </div>
              <div className="col-md-3 mb-3">
                <label htmlFor="add-precio" className="form-label">Precio</label>
                <input
                  id="add-precio"
                  name="precio"
                  type="number"
                  className="form-control"
                  value={addForm.precio}
                  onChange={(e) => setAddForm((f) => ({ ...f, precio: e.target.value }))}
                />
              </div>
              <div className="col-md-3 d-flex align-items-end mb-3">
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">Guardar</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
      {/* Inline editor fallback (cuando el modal de Bootstrap no esté disponible) */}
      {showInlineEditor && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Editar pastel (inline)</h5>
            <form onSubmit={handleGuardar}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Nombre</label>
                  <input type="text" className="form-control" value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Categoría</label>
                  <select className="form-select" value={editForm.categoria} onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })} required>
                    <option value="">Selecciona una categoría...</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea className="form-control" value={editForm.descripcion} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} required />
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Precio</label>
                  <input type="number" className="form-control" value={editForm.precio} onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })} required min="0" step="1" />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Stock</label>
                  <input type="number" className="form-control" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} required min="0" step="1" />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Stock Crítico</label>
                  <input type="number" className="form-control" value={editForm.stockCritico} onChange={(e) => setEditForm({ ...editForm, stockCritico: e.target.value })} min="0" step="1" />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">Guardar cambios</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowInlineEditor(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            onAgregar={handleAgregar}
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
                <label className="form-label">Stock Crítico</label>
                <input
                  type="number"
                  className="form-control"
                  value={editForm.stockCritico}
                  onChange={(e) =>
                    setEditForm({ ...editForm, stockCritico: e.target.value })
                  }
                  min="0"
                  step="1"
                  placeholder="Nivel de stock para alertas"
                />
                <small className="form-text text-muted">
                  Cuando el stock baje de este número, se mostrará una alerta
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={editForm.categoria}
                  onChange={(e) =>
                    setEditForm({ ...editForm, categoria: e.target.value })
                  }
                  required
                >
                  <option value="">Selecciona una categoría...</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <small className="form-text text-muted">
                  <a
                    href="/admin/categorias"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Administrar categorías
                  </a>
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
