import React from "react";
import { Link } from "react-router-dom";
import boletas from "../data/Boleta.json";

export default function OrdenesVendedor() {
  return (
    <div>
      <h3>Órdenes</h3>
      <div className="list-group">
        {boletas.map((b) => (
          <Link
            key={b.id}
            to={`${b.id}`}
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
          >
            <div>
              <div className="fw-bold">Orden {b.id}</div>
              <div className="text-muted">Cliente: {b.cliente?.nombre}</div>
            </div>
            <div className="text-end">
              <div>Total: ${b.total}</div>
              <div className="small text-capitalize">{b.estado}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
