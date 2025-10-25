import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import pastelesData from "../data/Pasteles.json"; // Ajusta la ruta si es distinta

const AgregarPastel = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "",
    stock: "",
    stockCritico: "",
    imagen: "",
  });

  // Lista de categorías disponibles
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState("");

  // Validar si el usuario logueado es admin
  useEffect(() => {
    // Validar admin
    const sessionRaw = localStorage.getItem("session_user");
    if (!sessionRaw) {
      navigate("/"); // no logueado
      return;
    }

    try {
      const session = JSON.parse(sessionRaw);
      if (session.role !== "admin") {
        navigate("/"); // no admin
        return;
      }

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
    } catch {
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.nombre ||
      !formData.descripcion ||
      !formData.precio ||
      !formData.categoria ||
      !formData.stock
    ) {
      setError("Todos los campos son obligatorios");
      return;
    }

    // Leer los pasteles locales
    const localRaw = localStorage.getItem("pasteles_local");
    let locales = [];
    try {
      locales = localRaw ? JSON.parse(localRaw) : [];
    } catch {
      locales = [];
    }

    // Calcular nuevo ID
    const idsJson = pastelesData.map((p) => p.id || 0);
    const idsLocal = locales.map((p) => p.id || 0);
    const nuevoId = Math.max(0, ...idsJson, ...idsLocal) + 1;

    // Crear nuevo pastel con estructura idéntica al JSON
    const nuevoPastel = {
      id: nuevoId,
      nombre: formData.nombre,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock),
      imagen: formData.imagen || "", // URL de la imagen o vacío
      categoria: formData.categoria,
      descripcion: formData.descripcion,
    };

    // Guardar en localStorage
    locales.push(nuevoPastel);
    localStorage.setItem("pasteles_local", JSON.stringify(locales));

    alert(`Pastel "${formData.nombre}" agregado correctamente`);
    navigate("/productos/pasteles");
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Agregar nuevo pastel</h2>
      <div className="card p-4 shadow-sm mx-auto card-max-500">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              name="nombre"
              className="form-control"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea
              name="descripcion"
              className="form-control"
              value={formData.descripcion}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <div className="mb-3">
            <label className="form-label">Precio</label>
            <input
              type="number"
              name="precio"
              className="form-control"
              value={formData.precio}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Stock</label>
            <input
              type="number"
              name="stock"
              className="form-control"
              value={formData.stock}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Stock Crítico</label>
            <input
              type="number"
              name="stockCritico"
              className="form-control"
              value={formData.stockCritico}
              onChange={handleChange}
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
              name="categoria"
              className="form-select"
              value={formData.categoria}
              onChange={handleChange}
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

          <div className="mb-3">
            <label className="form-label">Imagen URL</label>
            <input
              type="url"
              name="imagen"
              className="form-control"
              value={formData.imagen}
              onChange={handleChange}
              placeholder="http://... o https://... (opcional)"
            />
            <small className="form-text text-muted">
              URL de una imagen pública. Dejar vacío para usar placeholder.
            </small>
          </div>

          {error && <p className="text-danger text-center">{error}</p>}

          <button type="submit" className="btn btn-primary w-100">
            Guardar pastel
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgregarPastel;
