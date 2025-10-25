// Card: componente de presentación de producto reutilizable.
// Props principales: id, nombre/titulo, descripcion/contenido, precio, imagen.
// Soporta `onAgregar` o `comprar` para manejar la acción de añadir al carrito.
// 🔧 ADMIN: ahora soporta props extra:
//   - origen: "json" | "local"  (controla si es editable)
//   - onEditar(id) y onEliminar(id) (solo se muestran si origen === "local")
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Card({
  id,
  titulo,
  nombre,
  contenido,
  descripcion,
  precio,
  imagen,
  comprar,
  onAgregar,
  // --- NUEVAS PROPS ---
  hideDescription = false,
  stock,
  origen, // "json" | "local"
  onEditar, // function(id)
  onEliminar, // function(id)
}) {
  // compatibilidad: permitir usar tanto `titulo` como `nombre`, `contenido` o `descripcion`
  const title = titulo || nombre || "Producto";
  const desc = contenido || descripcion || "";
  // hideDescription: si es true, no mostrar el párrafo de descripción
  // Esto permite reutilizar la tarjeta en listados sin descripción.
  const price = typeof precio === "number" ? precio : precio || "";
  const imgSrc = imagen || "";
  const [showAdded, setShowAdded] = useState(false);

  const handleAgregar = (e) => {
    if (onAgregar) {
      // Llamar onAgregar y mostrar confirmación
      try {
        const res = onAgregar({
          id,
          nombre: title,
          precio: price,
          imagen: imgSrc,
          stock,
        });
        // soportar promesas
        if (res && typeof res.then === "function") {
          res.then(() => setShowAdded(true));
        } else {
          setShowAdded(true);
        }
        window.dispatchEvent(new Event("storage"));
        return res;
      } catch (err) {
        console.error("Error agregando al carrito desde Card:", err);
      }
    }
    if (comprar) return comprar(e);
  };

  useEffect(() => {
    if (!showAdded) return;
    const t = setTimeout(() => setShowAdded(false), 2000);
    return () => clearTimeout(t);
  }, [showAdded]);

  return (
    <div className="card h-100">
      {/* Imagen o placeholder de texto si no hay imagen */}
      {imgSrc ? (
        <img src={imgSrc} className="card-img-top" alt={title} />
      ) : (
        <div className="d-flex align-items-center justify-content-center bg-light card-fixed-height-180">
          <span className="text-muted">Sin imagen disponible</span>
        </div>
      )}

      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{title}</h5>
        {!hideDescription && <p className="card-text flex-grow-1">{desc}</p>}

        {/* Mostrar stock si se pasó como prop */}
        {typeof stock !== "undefined" && (
          <p
            className={`small mb-2 ${
              Number(stock) === 0 ? "text-danger" : "text-muted"
            }`}
          >
            Stock: {stock}
          </p>
        )}

        {/* Mensaje temporal al agregar */}
        {showAdded && (
          <div className="alert alert-success py-1 mb-2">
            Agregado al carrito
          </div>
        )}

        <p className="card-text fw-bold text-success mb-2">
          {typeof price === "number"
            ? `$${price.toLocaleString("es-CL")}`
            : price}
        </p>

        {/* Botón público: Agregar a carrito (se mantiene siempre visible) */}
        <button
          type="button"
          className="btn btn-primary mt-auto btn-agregar-carrito"
          data-id={id}
          data-nombre={title}
          data-precio={price}
          data-imagen={imgSrc}
          onClick={handleAgregar}
          disabled={Number(stock) === 0}
        >
          Agregar a carrito
        </button>

        {/* Ver detalle: lleva a la página de detalle del producto */}
        <Link
          to={`/productos/${id}`}
          className="btn btn-outline-secondary mt-2"
        >
          Ver detalle
        </Link>

        {/* Sección de administración */}
        <div className="mt-2">
          {origen === "json" && (
            <small className="text-muted">(No editable)</small>
          )}

          {origen === "local" && (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => onEditar && onEditar(id)}
              >
                Editar
              </button>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => onEliminar && onEliminar(id)}
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Card;
