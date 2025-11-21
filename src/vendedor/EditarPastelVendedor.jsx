import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import pastelesJson from "../data/Pasteles.json";

function loadLocalPasteles() {
  try {
    const raw = localStorage.getItem("pasteles_local");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function EditarPastelVendedor() {
  const { id } = useParams();
  const pid = Number(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "", categoria: "", stock: "", imagen: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const local = loadLocalPasteles();
    let producto = local.find((p) => Number(p.id) === pid);
    if (!producto) {
      producto = pastelesJson.find((p) => Number(p.id) === pid);
    }
    if (!producto) {
      setError("Producto no encontrado");
      return;
    }
    setForm({
      nombre: producto.nombre || "",
      descripcion: producto.descripcion || "",
      precio: producto.precio != null ? String(producto.precio) : "",
      categoria: producto.categoria || "",
      stock: producto.stock != null ? String(producto.stock) : "",
      imagen: producto.imagen || "",
    });
  }, [pid]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre || !form.precio) {
      setError("Nombre y precio son obligatorios");
      return;
    }

    // Merge with local storage
    const local = loadLocalPasteles();
    const idx = local.findIndex((p) => Number(p.id) === pid);
    const updated = {
      id: pid,
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: parseFloat(form.precio) || 0,
      categoria: form.categoria,
      stock: parseInt(form.stock || "0", 10) || 0,
      imagen: form.imagen || "",
    };

    if (idx >= 0) {
      local[idx] = updated;
    } else {
      // If not present locally, add it (this allows editing JSON items by creating a local override)
      local.push(updated);
    }

    try {
      localStorage.setItem("pasteles_local", JSON.stringify(local));
      // notify other components
      window.dispatchEvent(new Event("storage"));
      alert(`Producto "${updated.nombre}" actualizado`);
      navigate("/vendedor/productos");
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setError("No se pudo guardar el producto");
    }
  };

  return (
    <div className="container py-4">
      <h3>Editar producto</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card p-3 card-max-500">
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input name="nombre" className="form-control" value={form.nombre} onChange={onChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea name="descripcion" className="form-control" value={form.descripcion} onChange={onChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Precio</label>
            <input name="precio" type="number" step="0.01" className="form-control" value={form.precio} onChange={onChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Stock</label>
            <input name="stock" type="number" className="form-control" value={form.stock} onChange={onChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Categoría</label>
            <input name="categoria" className="form-control" value={form.categoria} onChange={onChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Imagen (ruta o URL)</label>
            <input name="imagen" className="form-control" value={form.imagen} onChange={onChange} />
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit">Guardar cambios</button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => navigate(-1)}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
