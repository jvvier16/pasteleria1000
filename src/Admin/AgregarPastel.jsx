/**
 * @component AgregarPastel
 * @description Componente que proporciona un formulario para agregar nuevos pasteles al sistema.
 * Envía los datos al backend mediante POST /api/v2/productos
 * 
 * Permite a los administradores crear nuevos productos con detalles como:
 * - Nombre y descripción
 * - Precio y stock
 * - Categoría
 * - URL de imagen
 *
 * Solo accesible para usuarios con rol de administrador/vendedor.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { crearProducto, obtenerCategorias } from "../utils/apiHelper";

const AgregarPastel = () => {
  const navigate = useNavigate();

  /**
   * @state {Object} formData - Datos del formulario para crear un nuevo pastel
   */
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "",
    stock: "",
    imagen: "",
  });

  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Validar si el usuario logueado es admin y cargar categorías
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
        return;
      }
    } catch {
      navigate("/login");
      return;
    }

    // Cargar categorías desde el backend
    const cargarCategorias = async () => {
      try {
        const response = await obtenerCategorias();
        const categoriasData = (response.data || []).map((c) => ({
          id: c.categoriaId || c.id,
          nombre: c.nombre,
        }));
        setCategorias(categoriasData);
      } catch (err) {
        console.error("Error cargando categorías:", err);
        // Usar categorías por defecto si falla
        setCategorias([
          { id: 1, nombre: "Tortas" },
          { id: 2, nombre: "Postres" },
          { id: 3, nombre: "Sin Azúcar" },
          { id: 4, nombre: "Sin Gluten" },
          { id: 5, nombre: "Veganas" },
          { id: 6, nombre: "Especiales" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    cargarCategorias();
  }, [navigate]);

  /**
   * @function handleChange
   * @description Maneja los cambios en los campos del formulario
   */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * @function handleSubmit
   * @description Maneja el envío del formulario al backend
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!formData.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!formData.precio || Number(formData.precio) < 0) {
      setError("El precio debe ser un número válido");
      return;
    }

    setSaving(true);

    try {
      // Preparar datos para el backend
      const nuevoProducto = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || "",
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock) || 0,
        imagen: formData.imagen?.trim() || null,
      };

      // Si hay categoría seleccionada, incluir solo el ID
      if (formData.categoria) {
        const categoriaSeleccionada = categorias.find(
          (c) => c.nombre === formData.categoria
        );
        if (categoriaSeleccionada) {
          nuevoProducto.categoriaId = categoriaSeleccionada.id;
        }
      }

      // Enviar al backend
      await crearProducto(nuevoProducto);

      alert(`Pastel "${formData.nombre}" agregado correctamente`);
      navigate("/admin/pasteles");

    } catch (err) {
      console.error("Error creando producto:", err);
      setError(err.message || "Error al crear el producto. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "40vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted">Cargando formulario...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="mb-0">Agregar nuevo pastel</h2>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate("/admin/pasteles")}
        >
          ← Volver
        </button>
      </div>

      <div className="card p-4 shadow-sm mx-auto card-max-500">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nombre *</label>
            <input
              type="text"
              name="nombre"
              className="form-control"
              value={formData.nombre}
              onChange={handleChange}
              required
              disabled={saving}
              placeholder="Ej: Torta de Chocolate"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea
              name="descripcion"
              className="form-control"
              value={formData.descripcion}
              onChange={handleChange}
              disabled={saving}
              rows="3"
              placeholder="Describe el producto..."
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Precio *</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  name="precio"
                  className="form-control"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1"
                  disabled={saving}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Stock inicial</label>
              <input
                type="number"
                name="stock"
                className="form-control"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                step="1"
                disabled={saving}
                placeholder="0"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Categoría</label>
            <select
              name="categoria"
              className="form-select"
              value={formData.categoria}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="">Sin categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.nombre}>
                  {cat.nombre}
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

          <div className="mb-3">
            <label className="form-label">URL de imagen</label>
            <input
              type="url"
              name="imagen"
              className="form-control"
              value={formData.imagen}
              onChange={handleChange}
              disabled={saving}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            <small className="form-text text-muted">
              URL de una imagen pública. Dejar vacío para usar placeholder.
            </small>
          </div>

          {/* Vista previa de imagen */}
          {formData.imagen && (
            <div className="mb-3 text-center">
              <label className="form-label d-block">Vista previa</label>
              <img
                src={formData.imagen}
                alt="Vista previa"
                style={{ maxWidth: "200px", maxHeight: "150px", objectFit: "cover" }}
                className="rounded border"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Guardando...
                </>
              ) : (
                "Guardar pastel"
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/admin/pasteles")}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarPastel;
