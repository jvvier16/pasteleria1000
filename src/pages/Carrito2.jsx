import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Carrito = () => {
  const productos = [
    {
      id: 1,
      nombre: "Torta de Chocolate",
      precio: 12000,
      cantidad: 1,
      imagen: "https://via.placeholder.com/80",
    },
    {
      id: 2,
      nombre: "Cupcakes Vainilla",
      precio: 4000,
      cantidad: 3,
      imagen: "https://via.placeholder.com/80",
    },
    {
      id: 3,
      nombre: "Galletas Decoradas",
      precio: 2500,
      cantidad: 2,
      imagen: "https://via.placeholder.com/80",
    },
  ];

  const total = productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  return (
    <div className="container py-5">
      <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "900px" }}>
        <h4 className="fw-bold mb-2">Carrito de compra</h4>
        <p className="text-muted mb-4">Completa la siguiente información</p>

        {/* Tabla de productos */}
        <div className="table-responsive mb-4">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      className="rounded"
                      width="60"
                      height="60"
                    />
                  </td>
                  <td>{p.nombre}</td>
                  <td>${p.precio.toLocaleString()}</td>
                  <td>{p.cantidad}</td>
                  <td>${(p.precio * p.cantidad).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="d-flex justify-content-end mb-4">
          <div className="bg-primary text-white rounded px-3 py-2">
            <strong>Total a pagar:</strong> ${total.toLocaleString()}
          </div>
        </div>

        {/* Información del cliente */}
        <h5 className="fw-bold mt-4">Información del cliente</h5>
        <p className="text-muted mb-3">Completa la siguiente información</p>
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label">Nombre*</label>
            <input type="text" className="form-control" placeholder="Nombre" />
          </div>
          <div className="col-md-6">
            <label className="form-label">Apellidos*</label>
            <input
              type="text"
              className="form-control"
              placeholder="Apellidos"
            />
          </div>
          <div className="col-12">
            <label className="form-label">Correo*</label>
            <input
              type="email"
              className="form-control"
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>

        {/* Dirección de entrega */}
        <h5 className="fw-bold mt-4">Dirección de entrega de los productos</h5>
        <p className="text-muted mb-3">Ingrese dirección de forma detallada</p>
        <div className="row g-3 mb-4">
          <div className="col-md-8">
            <label className="form-label">Calle*</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: Av. Principal 1234"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Departamento (opcional)</label>
            <input type="text" className="form-control" placeholder="Ej: 603" />
          </div>
          <div className="col-md-6">
            <label className="form-label">Región*</label>
            <select className="form-select">
              <option>Región Metropolitana de Santiago</option>
              <option>Valparaíso</option>
              <option>Biobío</option>
              <option>La Araucanía</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Comuna*</label>
            <select className="form-select">
              <option>Cerrillos</option>
              <option>Maipú</option>
              <option>Providencia</option>
              <option>Las Condes</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">
              Indicaciones para la entrega (opcional)
            </label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Ej: Entre calles, color del edificio, no tiene timbre..."
            ></textarea>
          </div>
        </div>

        {/* Botón de pago */}
        <div className="text-end">
          <button className="btn btn-success btn-lg">
            Pagar ahora ${total.toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Carrito;
