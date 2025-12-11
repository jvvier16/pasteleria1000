/**
 * @component AdminPasteles
 * @description Panel de administración de pasteles conectado al backend.
 * Permite:
 * - Visualizar todos los productos desde GET /api/v2/productos
 * - Crear productos con POST /api/v2/productos
 * - Editar productos con PUT /api/v2/productos/{id}
 * - Eliminar productos con DELETE /api/v2/productos/{id}
 *
 * Solo accesible para usuarios con rol de administrador
 */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import { addToCart } from "../utils/cart.js";
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerCategorias,
} from "../utils/apiHelper";

export default function AdminPasteles() {
  const navigate = useNavigate();

  // Estados principales
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Estados para edición
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    stockCritico: "",
    categoria: "",
    imagen: "",
  });

  // Estados para agregar
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "0",
    categoria: "",
    imagen: "",
  });

  // Refs para modal
  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);
  const [showInlineEditor, setShowInlineEditor] = useState(false);

  // 🔐 Proteger ruta (solo admin/vendedor)
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
      if (!["admin", "tester", "vendedor"].includes(role)) {
        navigate("/");
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  // 📥 Cargar productos y categorías del backend
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError(null);

      try {
        // Cargar productos y categorías en paralelo
        const [productosRes, categoriasRes] = await Promise.all([
          obtenerProductos(),
          obtenerCategorias().catch(() => ({ data: [] })),
        ]);

        // Procesar productos
        const productosData = (productosRes.data || []).map((p) => ({
          ...p,
          id: p.productoId || p.id,
          imagen: resolveImageUrl(p.imagen),
        }));
        setProductos(productosData);

        // Procesar categorías
        const categoriasData = (categoriasRes.data || []).map((c) => ({
          id: c.categoriaId || c.id,
          nombre: c.nombre,
        }));
        setCategorias(categoriasData);

      } catch (err) {
        console.error("Error cargando datos:", err);
        setError(err.message || "Error al cargar los productos");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Resolver URL de imagen
  const resolveImageUrl = (imagen) => {
    if (!imagen) return "";
    if (imagen.startsWith("data:") || imagen.startsWith("http")) return imagen;
    const filename = (imagen || "").split("/").pop();
    return filename
      ? new URL(`../assets/img/${filename}`, import.meta.url).href
      : "";
  };

  // Recargar productos
  const recargarProductos = async () => {
    try {
      const response = await obtenerProductos();
      const productosData = (response.data || []).map((p) => ({
        ...p,
        id: p.productoId || p.id,
        imagen: resolveImageUrl(p.imagen),
      }));
      setProductos(productosData);
    } catch (err) {
      console.error("Error recargando productos:", err);
    }
  };

  /**
   * Eliminar producto
   */
  const handleEliminar = async (id) => {
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;

    if (!window.confirm(`¿Eliminar "${producto.nombre}"?`)) return;

    setSaving(true);
    try {
      await eliminarProducto(id);
      
      // Actualizar lista local
      setProductos((prev) => prev.filter((p) => p.id !== id));
      
      alert("Producto eliminado exitosamente");
    } catch (err) {
      console.error("Error eliminando producto:", err);
      alert(err.message || "Error al eliminar el producto");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Agregar al carrito
   */
  const handleAgregar = (product) => {
    try {
      const qty = Number(product.cantidad) || 1;
      addToCart(product, qty);
      window.dispatchEvent(new Event("cart:updated"));
      alert(`${product.nombre || "Producto"} agregado al carrito`);
      return true;
    } catch (err) {
      console.error("Error agregando al carrito:", err);
      return false;
    }
  };

  /**
   * Abrir editor para editar producto
   */
  const handleEditar = (id) => {
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;

    setEditId(id);
    setEditForm({
      nombre: producto.nombre || "",
      descripcion: producto.descripcion || "",
      precio: producto.precio ?? "",
      stock: producto.stock ?? "",
      stockCritico: producto.stockCritico ?? "",
      categoria: producto.categoria?.nombre || producto.categoria || "",
      imagen: producto.imagen || "",
    });

    // Intentar mostrar modal Bootstrap
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

  /**
   * Guardar cambios de edición
   */
  const handleGuardar = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!editForm.nombre.trim()) return alert("El nombre es obligatorio");
    const precioNum = Number(editForm.precio);
    const stockNum = Number(editForm.stock);
    if (Number.isNaN(precioNum) || precioNum < 0) return alert("Precio inválido");
    if (Number.isNaN(stockNum) || stockNum < 0) return alert("Stock inválido");

    setSaving(true);
    try {
      // Preparar datos para el backend
      const datosActualizados = {
        nombre: editForm.nombre.trim(),
        descripcion: editForm.descripcion.trim(),
        precio: precioNum,
        stock: stockNum,
        imagen: editForm.imagen || null,
      };

      // Si hay categoría, buscar su ID y enviarlo directamente
      if (editForm.categoria) {
        const cat = categorias.find((c) => c.nombre === editForm.categoria);
        if (cat) {
          datosActualizados.categoriaId = cat.id;
        }
      } else {
        // Si no hay categoría seleccionada, enviar null para quitarla
        datosActualizados.categoriaId = null;
      }

      await actualizarProducto(editId, datosActualizados);

      // Cerrar modal
      try {
        modalInstanceRef.current?.hide();
      } catch {}
      setShowInlineEditor(false);

      // Recargar productos
      await recargarProductos();
      
      alert("Producto actualizado exitosamente");
    } catch (err) {
      console.error("Error actualizando producto:", err);
      alert(err.message || "Error al actualizar el producto");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Crear nuevo producto
   */
  const handleCrear = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!addForm.nombre.trim()) return alert("El nombre es obligatorio");
    const precioNum = Number(addForm.precio);
    if (Number.isNaN(precioNum) || precioNum < 0) return alert("Precio inválido");

    setSaving(true);
    try {
      // Preparar datos para el backend
      const nuevoProducto = {
        nombre: addForm.nombre.trim(),
        descripcion: addForm.descripcion?.trim() || "",
        precio: precioNum,
        stock: Number(addForm.stock) || 0,
        imagen: addForm.imagen || null,
      };

      // Si hay categoría, buscar su ID y enviarlo directamente
      if (addForm.categoria) {
        const cat = categorias.find((c) => c.nombre === addForm.categoria);
        if (cat) {
          nuevoProducto.categoriaId = cat.id;
        }
      }

      await crearProducto(nuevoProducto);

      // Limpiar formulario
      setAddForm({
        nombre: "",
        descripcion: "",
        precio: "",
        stock: "0",
        categoria: "",
        imagen: "",
      });
      setShowAddForm(false);

      // Recargar productos
      await recargarProductos();
      
      alert("Producto creado exitosamente");
    } catch (err) {
      console.error("Error creando producto:", err);
      alert(err.message || "Error al crear el producto");
    } finally {
      setSaving(false);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="container py-4">
        <h2 className="mb-4">Administrar Pasteles</h2>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "40vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="container py-4">
        <h2 className="mb-4">Administrar Pasteles</h2>
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Error</h5>
          <p>{error}</p>
          <hr />
          <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2>Administrar Pasteles</h2>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-success"
            data-testid="card-add-pastel"
            onClick={() => setShowAddForm((s) => !s)}
            disabled={saving}
          >
            {showAddForm ? "Cerrar" : "+ Agregar pastel"}
          </button>
        </div>
      </div>

      {/* Formulario para agregar */}
      {showAddForm && (
        <form onSubmit={handleCrear} className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Nuevo Producto</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="add-nombre" className="form-label">Nombre *</label>
                <input
                  id="add-nombre"
                  className="form-control"
                  value={addForm.nombre}
                  onChange={(e) => setAddForm((f) => ({ ...f, nombre: e.target.value }))}
                  required
                  disabled={saving}
                />
              </div>
              <div className="col-md-3 mb-3">
                <label htmlFor="add-precio" className="form-label">Precio *</label>
                <input
                  id="add-precio"
                  type="number"
                  className="form-control"
                  value={addForm.precio}
                  onChange={(e) => setAddForm((f) => ({ ...f, precio: e.target.value }))}
                  required
                  min="0"
                  disabled={saving}
                />
              </div>
              <div className="col-md-3 mb-3">
                <label htmlFor="add-stock" className="form-label">Stock</label>
                <input
                  id="add-stock"
                  type="number"
                  className="form-control"
                  value={addForm.stock}
                  onChange={(e) => setAddForm((f) => ({ ...f, stock: e.target.value }))}
                  min="0"
                  disabled={saving}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="add-categoria" className="form-label">Categoría</label>
                <select
                  id="add-categoria"
                  className="form-select"
                  value={addForm.categoria}
                  onChange={(e) => setAddForm((f) => ({ ...f, categoria: e.target.value }))}
                  disabled={saving}
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="add-imagen" className="form-label">URL de imagen</label>
                <input
                  id="add-imagen"
                  type="text"
                  className="form-control"
                  value={addForm.imagen}
                  onChange={(e) => setAddForm((f) => ({ ...f, imagen: e.target.value }))}
                  placeholder="https://..."
                  disabled={saving}
                />
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="add-descripcion" className="form-label">Descripción</label>
              <textarea
                id="add-descripcion"
                className="form-control"
                value={addForm.descripcion}
                onChange={(e) => setAddForm((f) => ({ ...f, descripcion: e.target.value }))}
                rows="2"
                disabled={saving}
              />
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Guardando..." : "Crear producto"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Editor inline (fallback cuando no hay Bootstrap Modal) */}
      {showInlineEditor && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Editar producto</h5>
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
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
                    value={editForm.categoria}
                    onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
                    disabled={saving}
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Precio *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editForm.precio}
                    onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })}
                    required
                    min="0"
                    disabled={saving}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    min="0"
                    disabled={saving}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">URL Imagen</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.imagen}
                    onChange={(e) => setEditForm({ ...editForm, imagen: e.target.value })}
                    disabled={saving}
                  />
                </div>
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

      {/* Grid de productos */}
      {productos.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted fs-5">No hay productos registrados</p>
          <button className="btn btn-primary mt-2" onClick={() => setShowAddForm(true)}>
            Crear primer producto
          </button>
        </div>
      ) : (
        <div className="cards-grid mt-3">
          {productos.map((p) => (
            <Card
              key={p.id}
              id={p.id}
              nombre={p.nombre}
              descripcion={p.descripcion}
              precio={Number(p.precio)}
              imagen={p.imagen}
              stock={p.stock}
              origen="backend"
              onEditar={handleEditar}
              onEliminar={handleEliminar}
              onAgregar={handleAgregar}
            />
          ))}
        </div>
      )}

      {/* Modal Bootstrap para edición */}
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
              <h5 className="modal-title">Editar producto</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => modalInstanceRef.current?.hide()}
                aria-label="Close"
                disabled={saving}
              />
            </div>

            <div className="modal-body">
              <div className="mb-3">
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

              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Precio *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editForm.precio}
                    onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })}
                    required
                    min="0"
                    disabled={saving}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    min="0"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={editForm.categoria}
                  onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
                  disabled={saving}
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">URL de imagen</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.imagen}
                  onChange={(e) => setEditForm({ ...editForm, imagen: e.target.value })}
                  placeholder="https://..."
                  disabled={saving}
                />
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
