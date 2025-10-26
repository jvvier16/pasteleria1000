import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
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
    return (pastelesLocal || []).map((p) => ({
      ...p,
      // locales pueden venir con imagen "", Card muestra placeholder
      _origen: "local",
    }));
  }, [pastelesLocal]);

  // 🔗 Mostrar solo los pasteles locales en el panel admin (son los editables)
  // - El resto (JSON) se muestra en la tienda pública, pero en admin sólo
  //   queremos permitir editar/Eliminar los que fueron creados localmente.
  const todos = useMemo(() => localesMarcados || [], [localesMarcados]);

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
    } catch (e) {
      console.error(
        "Bootstrap Modal no disponible. Asegúrate de incluir el JS de Bootstrap por CDN."
      );
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
