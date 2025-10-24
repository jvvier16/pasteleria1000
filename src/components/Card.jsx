// Card: componente de presentación de producto reutilizable.
// Props principales: id, nombre/titulo, descripcion/contenido, precio, imagen.
// Soporta `onAgregar` o `comprar` para manejar la acción de añadir al carrito.
// 🔧 ADMIN: ahora soporta props extra:
//   - origen: "json" | "local"  (controla si es editable)
//   - onEditar(id) y onEliminar(id) (solo se muestran si origen === "local")
import React from "react";

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
  origen, // "json" | "local"
  onEditar, // function(id)
  onEliminar, // function(id)
}) {
  // compatibilidad: permitir usar tanto `titulo` como `nombre`, `contenido` o `descripcion`
  const title = titulo || nombre || "Producto";
  const desc = contenido || descripcion || "";
  const price = typeof precio === "number" ? precio : precio || "";
  const imgSrc = imagen || "";

  const handleAgregar = (e) => {
    if (onAgregar)
      return onAgregar({ id, nombre: title, precio: price, imagen: imgSrc });
    if (comprar) return comprar(e);
  };

  return (
    <div className="card h-100">
      {/* Imagen o placeholder de texto si no hay imagen */}
      {imgSrc ? (
        <img src={imgSrc} className="card-img-top" alt={title} />
      ) : (
        <div
          className="d-flex align-items-center justify-content-center bg-light"
          style={{ height: 180 }}
        >
          <span className="text-muted">Sin imagen disponible</span>
        </div>
      )}

      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{title}</h5>
        <p className="card-text flex-grow-1">{desc}</p>

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
        >
          Agregar a carrito
        </button>

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
