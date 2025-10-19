import React, { useState } from "react";

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
}) {
  // compatibilidad: permitir usar tanto `titulo` como `nombre`, `contenido` o `descripcion`
  const title = titulo || nombre || "Producto";
  const desc = contenido || descripcion || "";
  const price = typeof precio === "number" ? precio : precio || "";
  const imgSrc = imagen || "";
  const [cantidad, setCantidad] = useState(1);

  const handleAgregar = (e) => {
    if (onAgregar)
      return onAgregar({
        id,
        nombre: title,
        precio: price,
        imagen: imgSrc,
        cantidad: Number(cantidad) || 1,
      });
    if (comprar) return comprar(e);
  };

  return (
    <div className="card h-100">
      {imgSrc && <img src={imgSrc} className="card-img-top" alt={title} />}
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{title}</h5>
        <p className="card-text flex-grow-1">{desc}</p>
        <p className="card-text fw-bold text-success mb-2">
          {typeof price === "number"
            ? `$${price.toLocaleString("es-CL")}`
            : price}
        </p>
        <div className="d-flex gap-2 align-items-center mt-auto">
          <input
            type="number"
            min={1}
            className="form-control form-control-sm"
            style={{ width: 90 }}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary btn-agregar-carrito"
            data-id={id}
            data-nombre={title}
            data-precio={price}
            data-imagen={imgSrc}
            onClick={handleAgregar}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Card;
