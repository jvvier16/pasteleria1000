import React from "react";
import { useParams, Link } from "react-router-dom";
import boletas from "../data/Boleta.json";

export default function OrdenDetalleVendedor() {
  const { id } = useParams();
  const orden = boletas.find((b) => String(b.id) === String(id));

  if (!orden)
    return (
      <div>
        <h4>Orden no encontrada</h4>
        <Link to="..">Volver</Link>
      </div>
    );

  return (
    <div>
      <h4>Orden {orden.id}</h4>
      <p>Fecha: {new Date(orden.fecha).toLocaleString()}</p>
      <p>Cliente: {orden.cliente?.nombre} ({orden.cliente?.correo})</p>
      <h5>Items</h5>
      <ul>
        {orden.items.map((it, i) => (
          <li key={i}>
            {it.nombre} — {it.cantidad} x ${it.precio}
          </li>
        ))}
      </ul>
      <p className="fw-bold">Total: ${orden.total}</p>
      <p>Estado: <span className="text-capitalize">{orden.estado}</span></p>
      <Link to=".." className="btn btn-outline-secondary mt-2">Volver a órdenes</Link>
    </div>
  );
}
