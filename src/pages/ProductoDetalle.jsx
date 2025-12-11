/**
 * ProductoDetalle: Muestra el detalle de un producto específico.
 * - Carga el producto desde GET /api/v2/productos/{id}
 * - Permite agregar al carrito
 * - Maneja estados de carga y errores
 */
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenerProductoPorId } from "../utils/apiHelper";
import { addToCart as addToCartHelper } from "../utils/localstorageHelper";

const ProductoDetalle = () => {
  const { id } = useParams();
  const productoCargadoRef = useRef(null);
  const idCargadoRef = useRef(null);

  // Estados para producto, carga y errores
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

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

  // Cargar producto del backend
  useEffect(() => {
    // Normalizar el ID a string para comparación consistente
    const idNormalizado = String(id || "");

    // Si ya tenemos este producto cargado, no volver a cargar
    if (
      idNormalizado &&
      idCargadoRef.current === idNormalizado &&
      productoCargadoRef.current
    ) {
      // Asegurarse de que el producto esté en el estado
      const productoRef = productoCargadoRef.current;
      setProducto(productoRef);
      setImageUrl(resolveImageUrl(productoRef.imagen));
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const cargarProducto = async () => {
      if (!id || !idNormalizado) {
        setLoading(false);
        setError("ID de producto no válido");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Convertir ID a número para la petición
        const idNumero = Number(id);
        if (isNaN(idNumero) || idNumero <= 0) {
          throw new Error("ID de producto inválido");
        }

        const response = await obtenerProductoPorId(idNumero);

        // Verificar si el efecto fue cancelado antes de actualizar el estado
        if (cancelled) return;

        // Validar que la respuesta sea válida
        if (!response || typeof response !== "object") {
          throw new Error("Respuesta inválida del servidor");
        }

        // El backend devuelve: { status, mensaje, data: {...producto} }
        const prod = response.data;

        if (!prod) {
          throw new Error("Producto no encontrado");
        }

        // Verificar nuevamente si fue cancelado antes de actualizar el estado
        if (cancelled) return;

        // Normalizar ID (backend usa productoId)
        const productoNormalizado = {
          ...prod,
          id: prod.productoId || prod.id,
        };

        // Solo actualizar el estado si no fue cancelado
        if (!cancelled) {
          // Guardar en ref para evitar recargas innecesarias
          productoCargadoRef.current = productoNormalizado;
          idCargadoRef.current = idNormalizado;

          setProducto(productoNormalizado);

          // Resolver imagen
          const imgUrl = resolveImageUrl(prod.imagen);
          setImageUrl(imgUrl);

          setError(null);
          setLoading(false);

          // Activar animaciones después de un pequeño delay para asegurar que el DOM esté listo
          setTimeout(() => {
            const reveals = document.querySelectorAll(".reveal");
            reveals.forEach((el) => {
              if (el && !el.classList.contains("in-view")) {
                el.classList.add("in-view");
              }
            });
          }, 50);
        }
      } catch (err) {
        // Solo actualizar el estado si el efecto no fue cancelado
        if (cancelled) return;

        console.error("Error al cargar producto:", err);
        if (err.status === 404) {
          setError("Producto no encontrado");
        } else {
          setError(err.message || "Error al cargar el producto");
        }
        setProducto(null);
        productoCargadoRef.current = null;
        idCargadoRef.current = null;
        setLoading(false);
      }
    };

    cargarProducto();

    // Cleanup function para cancelar la petición si el componente se desmonta o el id cambia
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAdd = async () => {
    const productoActual = producto || productoCargadoRef.current;
    if (!productoActual) return;

    try {
      const productoActual = producto || productoCargadoRef.current;
      await addToCartHelper({
        id: productoActual.id,
        nombre: productoActual.nombre,
        precio: Number(productoActual.precio),
        imagen: imageUrl,
        cantidad: 1,
        stock: productoActual.stock,
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
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "40vh" }}
        >
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
  // Solo mostrar error si no está cargando Y hay un error explícito Y no hay producto
  if (!loading && error && !producto && !productoCargadoRef.current) {
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

  // Si no hay producto pero tampoco hay error y no está cargando, mostrar mensaje
  if (!loading && !error && !producto && !productoCargadoRef.current) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <h2 className="text-muted mb-3">Producto no encontrado</h2>
          <Link to="/productos" className="btn btn-primary">
            Ver todos los productos
          </Link>
        </div>
      </div>
    );
  }

  // Usar el producto del estado o del ref como fallback
  const productoActual = producto || productoCargadoRef.current;

  // Si no hay producto en absoluto, mostrar carga
  if (!productoActual) {
    return (
      <div className="container py-5">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "40vh" }}
        >
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

  return (
    <div className="container py-4 reveal slide-up in-view">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/productos">Productos</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {productoActual.nombre}
          </li>
        </ol>
      </nav>

      <div className="row g-4 align-items-start">
        <div className="col-12 col-md-6 reveal fade-delay-1 in-view">
          {imageUrl ? (
            <img
              src={imageUrl}
              className="img-fluid rounded shadow-sm hover-zoom"
              alt={productoActual.nombre}
            />
          ) : (
            <div className="bg-light p-5 text-center rounded">
              <span className="text-muted">Sin imagen</span>
            </div>
          )}
        </div>
        <div className="col-12 col-md-6">
          <h1 className="h3 fw-bold mb-3 reveal fade-delay-2 in-view">
            {productoActual.nombre}
          </h1>

          {productoActual.descripcion && (
            <p className="text-muted mb-2">{productoActual.descripcion}</p>
          )}

          {(productoActual.categoria || productoActual.categoriaNombre) && (
            <p className="mb-2">
              <span className="badge bg-secondary">
                {productoActual.categoria?.nombre ||
                  productoActual.categoriaNombre ||
                  productoActual.categoria ||
                  "Sin categoría"}
              </span>
            </p>
          )}

          {typeof productoActual.stock !== "undefined" && (
            <p
              className={`mb-2 ${
                Number(productoActual.stock) === 0
                  ? "text-danger fw-bold"
                  : "text-muted"
              }`}
            >
              {Number(productoActual.stock) === 0
                ? "Sin stock"
                : `Stock disponible: ${productoActual.stock}`}
            </p>
          )}

          <p className="h4 fw-semibold mb-4">
            ${Number(productoActual.precio).toLocaleString("es-CL")}
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
              disabled={Number(productoActual.stock) === 0}
            >
              {Number(productoActual.stock) === 0
                ? "Sin stock"
                : "Agregar al carrito"}
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
