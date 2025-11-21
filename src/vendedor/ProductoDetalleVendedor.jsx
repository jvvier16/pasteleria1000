import React from "react";
import { useParams, Link } from "react-router-dom";
import pasteles from "../data/Pasteles.json";

export default function ProductoDetalleVendedor() {
  const { id } = useParams();
  const pid = Number(id);
  const producto = pasteles.find((p) => Number(p.id) === pid);

  if (!producto)
    return (
      <div>
        <h4>Producto no encontrado</h4>
        <Link to="..">Volver</Link>
      </div>
    );

  return (
    <div className="card mb-3">
      <div className="row g-0">
        <div className="col-md-4">
          <img
            src={new URL(`../assets/img/${producto.imagen.split("/").pop()}`, import.meta.url).href}
            className="img-fluid rounded-start"
            alt={producto.nombre}
          />
        </div>
        <div className="col-md-8">
          <div className="card-body">
            <h5 className="card-title">{producto.nombre}</h5>
            <p className="card-text">{producto.descripcion}</p>
            <p className="card-text">Categoría: {producto.categoria}</p>
            <p className="card-text fw-bold">Precio: ${producto.precio}</p>
            <p className="card-text">Stock: {producto.stock}</p>
            <Link to=".." className="btn btn-outline-secondary mt-2">
              Volver a productos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
