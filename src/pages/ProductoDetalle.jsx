/**
 * ProductoDetalle: Muestra el detalle de un producto específico.
 * - Carga el producto desde GET /api/v2/productos/{id}
 * - Permite agregar al carrito
 * - Maneja estados de carga y errores
 */
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenerProductoPorId } from "../utils/apiHelper";
import { addToCart as addToCartHelper } from "../utils/localstorageHelper";

const ProductoDetalle = () => {
  const { id } = useParams();

  // Estados para producto, carga y errores
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // Cargar producto del backend
  useEffect(() => {
    const cargarProducto = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await obtenerProductoPorId(id);
        
        // El backend devuelve: { status, message, data: {...producto} }
        const prod = response.data;
        
        if (!prod) {
          throw new Error("Producto no encontrado");
        }

        // Normalizar ID (backend usa productoId)
        const productoNormalizado = {
          ...prod,
          id: prod.productoId || prod.id,
        };

        setProducto(productoNormalizado);

        // Resolver imagen
        const imgUrl = resolveImageUrl(prod.imagen);
        setImageUrl(imgUrl);

      } catch (err) {
        console.error("Error al cargar producto:", err);
        if (err.status === 404) {
          setError("Producto no encontrado");
        } else {
          setError(err.message || "Error al cargar el producto");
        }
        setProducto(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarProducto();
    }
  }, [id]);

  // Resolver imagen: soportar data:, http: o filename relativo en assets
  const resolveImageUrl = (imagen) => {
    if (!imagen) return "";
    if (imagen.startsWith("data:") || imagen.startsWith("http")) {
      return imagen;
    }
    const filename = (imagen || "").split("/").pop();
    return filename
      ? new URL(`../assets/img/${filename}`, import.meta.url).href
      : "";
  };

  const handleAdd = async () => {
    if (!producto) return;

    try {
      await addToCartHelper({
        id: producto.id,
        nombre: producto.nombre,
        precio: Number(producto.precio),
        imagen: imageUrl,
        cantidad: 1,
        stock: producto.stock,
      });
      window.dispatchEvent(new Event("storage"));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Error agregando al carrito desde detalle:", err);
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
            <p className="text-muted">Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error o producto no encontrado
  if (error || !producto) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <h2 className="text-muted mb-3">
            {error || "Producto no encontrado"}
          </h2>
          <Link to="/productos" className="btn btn-primary">
            Ver todos los productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 reveal slide-up">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/productos">Productos</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {producto.nombre}
          </li>
        </ol>
      </nav>

      <div className="row g-4 align-items-start">
        <div className="col-12 col-md-6 reveal fade-delay-1">
          {imageUrl ? (
            <img
              src={imageUrl}
              className="img-fluid rounded shadow-sm hover-zoom"
              alt={producto.nombre}
            />
          ) : (
            <div className="bg-light p-5 text-center rounded">
              <span className="text-muted">Sin imagen</span>
            </div>
          )}
        </div>
        <div className="col-12 col-md-6">
          <h1 className="h3 fw-bold mb-3 reveal fade-delay-2">{producto.nombre}</h1>
          
          {producto.descripcion && (
            <p className="text-muted mb-2">{producto.descripcion}</p>
          )}
          
          {producto.categoria && (
            <p className="mb-2">
              <span className="badge bg-secondary">{producto.categoria.nombre || producto.categoria}</span>
            </p>
          )}
          
          {typeof producto.stock !== "undefined" && (
            <p
              className={`mb-2 ${
                Number(producto.stock) === 0 ? "text-danger fw-bold" : "text-muted"
              }`}
            >
              {Number(producto.stock) === 0 ? "Sin stock" : `Stock disponible: ${producto.stock}`}
            </p>
          )}
          
          <p className="h4 fw-semibold mb-4">
            ${Number(producto.precio).toLocaleString("es-CL")}
          </p>

          {added && (
            <div className="alert alert-success py-2 mb-3">
              ✓ Agregado al carrito
            </div>
          )}

          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-dark"
              onClick={handleAdd}
              disabled={Number(producto.stock) === 0}
            >
              {Number(producto.stock) === 0 ? "Sin stock" : "Agregar al carrito"}
            </button>
            <Link to="/productos" className="btn btn-outline-secondary">
              Volver
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductoDetalle;
