import React, { useEffect, useState } from "react";
import pastelesJson from "../data/Pasteles.json";
import { useNavigate } from "react-router-dom";
import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../utils/apiHelper";

function loadLocalPasteles() {
  try {
    const raw = localStorage.getItem("pasteles_local");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadLocalCategorias() {
  try {
    const raw = localStorage.getItem("categorias_local");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalCategorias(list) {
  localStorage.setItem("categorias_local", JSON.stringify(list));
}

function saveLocalPasteles(list) {
  localStorage.setItem("pasteles_local", JSON.stringify(list));
  // trigger storage listeners
  window.dispatchEvent(new Event("storage"));
}

// Build initial categories from JSON products
function deriveCategoriasFromJson() {
  const set = new Set();
  pastelesJson.forEach((p) => {
    if (p.categoria) set.add(p.categoria);
  });
  const arr = Array.from(set).map((name, idx) => ({ id: 1000 + idx, nombre: name, descripcion: "" }));
  return arr;
}

export default function CategoriasVendedor() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [useBackend, setUseBackend] = useState(false);
  const [nueva, setNueva] = useState("");
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: "", descripcion: "" });

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = () => {
    setLoading(true);
    setError(null);

    // Primero intentamos cargar desde backend (si el usuario tiene token/permiso)
    obtenerCategorias()
      .then((resp) => {
        const list = (resp?.data || resp || []).map((c) => ({
          id: c.categoriaId || c.id,
          nombre: c.nombre,
          descripcion: c.descripcion || "",
        }));
        setCategorias(list);
        setUseBackend(true);
        setLoading(false);
      })
      .catch(() => {
        // Fallback local
        const local = loadLocalCategorias();
        if (Array.isArray(local)) {
          setCategorias(local);
        } else {
          const derived = deriveCategoriasFromJson();
          setCategorias(derived);
          saveLocalCategorias(derived);
        }
        setUseBackend(false);
        setLoading(false);
      });
  };

  const handleAgregar = (e) => {
    e.preventDefault();
    if (!nueva.trim()) return;
    const exists = categorias.some((c) => c.nombre.toLowerCase() === nueva.trim().toLowerCase());
    if (exists) {
      alert("Ya existe esa categoría");
      return;
    }

    if (useBackend) {
      setSaving(true);
      crearCategoria({ nombre: nueva.trim(), descripcion: "" })
        .then(() => cargarCategorias())
        .catch((err) => {
          console.error(err);
          alert(err?.message || "Error creando categoría en servidor");
        })
        .finally(() => setSaving(false));
    } else {
      const item = { id: Date.now(), nombre: nueva.trim(), descripcion: "" };
      const next = [...categorias, item];
      setCategorias(next);
      saveLocalCategorias(next);
      setNueva("");
    }
  };

  const handleEditar = (c) => {
    setEditando(c.id);
    setEditForm({ nombre: c.nombre, descripcion: c.descripcion || "" });
  };

  const handleGuardarEdicion = () => {
    if (!editForm.nombre.trim()) return;
    const exists = categorias.some((c) => c.id !== editando && c.nombre.toLowerCase() === editForm.nombre.trim().toLowerCase());
    if (exists) {
      alert("Otra categoría ya usa ese nombre");
      return;
    }

    setSaving(true);
    const old = categorias.find((c) => c.id === editando);

    if (useBackend) {
      // backend expects { categoriaId, nombre, descripcion }
      actualizarCategoria({ categoriaId: editando, nombre: editForm.nombre.trim(), descripcion: editForm.descripcion.trim() })
        .then(() => {
          setEditando(null);
          cargarCategorias();
        })
        .catch((err) => {
          console.error(err);
          alert(err?.message || "Error actualizando categoría en servidor");
        })
        .finally(() => setSaving(false));
    } else {
      try {
        const next = categorias.map((c) => (c.id === editando ? { ...c, nombre: editForm.nombre.trim(), descripcion: editForm.descripcion.trim() } : c));
        setCategorias(next);
        saveLocalCategorias(next);

        // If name changed, update products that use old category
        if (old && old.nombre !== editForm.nombre.trim()) {
          const allProducts = [...pastelesJson];
          const local = loadLocalPasteles();
          const localMap = new Map(local.map((p) => [Number(p.id), p]));

          const toUpdate = [];
          allProducts.forEach((p) => {
            const lp = localMap.get(Number(p.id)) || p;
            if ((lp.categoria || "") === old.nombre) {
              const updated = { ...lp, categoria: editForm.nombre.trim() };
              localMap.set(Number(p.id), updated);
              toUpdate.push(updated);
            }
          });

          if (toUpdate.length > 0) {
            const merged = Array.from(localMap.values());
            saveLocalPasteles(merged);
          }
        }

        setEditando(null);
      } catch (err) {
        console.error(err);
        alert("Error actualizando categoría");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleEliminar = (c) => {
    if (!window.confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    // Verify there are no products using it (in local or base JSON)
    const local = loadLocalPasteles();
    const all = [...pastelesJson, ...local];
    const used = all.some((p) => (p.categoria || "") === c.nombre);
    if (used) {
      alert("No se puede eliminar: hay productos que usan esta categoría. Cambia sus categorías antes.");
      return;
    }
    if (useBackend) {
      setSaving(true);
      eliminarCategoria(c.id)
        .then(() => cargarCategorias())
        .catch((err) => {
          console.error(err);
          alert(err?.message || "Error eliminando categoría en servidor");
        })
        .finally(() => setSaving(false));
    } else {
      const next = categorias.filter((x) => x.id !== c.id);
      setCategorias(next);
      saveLocalCategorias(next);
    }
  };

  if (loading) return <div className="container py-4">Cargando categorías...</div>;

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12 col-md-8 mx-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Mis Categorías</h4>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => cargarCategorias()} disabled={saving}>↻</button>
          </div>

          <form onSubmit={handleAgregar} className="mb-3">
            <div className="input-group">
              <input value={nueva} onChange={(e) => setNueva(e.target.value)} className="form-control" placeholder="Nueva categoría..." />
              <button className="btn btn-primary" type="submit">Agregar</button>
            </div>
          </form>

          {categorias.length === 0 ? (
            <div className="alert alert-info">No hay categorías</div>
          ) : (
            <div className="list-group">
              {categorias.map((cat) => (
                <div key={cat.id} className="list-group-item d-flex justify-content-between align-items-center">
                  {editando === cat.id ? (
                    <div className="flex-grow-1 d-flex gap-2">
                      <input className="form-control" value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} />
                      <input className="form-control" value={editForm.descripcion} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} />
                      <div className="btn-group">
                        <button className="btn btn-success btn-sm" onClick={handleGuardarEdicion} disabled={saving}>Guardar</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditando(null)} disabled={saving}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-grow-1">
                        <strong>{cat.nombre}</strong>
                        {cat.descripcion && <div className="small text-muted">{cat.descripcion}</div>}
                      </div>
                      <div className="btn-group">
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => handleEditar(cat)}>Editar</button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleEliminar(cat)}>Eliminar</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="alert alert-info mt-3">
            Las categorías aquí sólo afectan a tu vista de vendedor (se almacenan en el navegador). Al editar un nombre se actualizarán tus productos locales.
          </div>
        </div>
      </div>
    </div>
  );
}
