import React, { useEffect, useMemo, useState } from "react";
import pasteles from "../data/Pasteles.json";

// Componente Boleta: muestra los items del carrito (localStorage "pasteleria_cart")
export default function Boleta() {
  const [pagoExitoso, setPagoExitoso] = useState(true);
  const [cliente, setCliente] = useState({ nombre: "Cliente", correo: "" });

  // leer carrito de localStorage
  const cart = useMemo(() => {
    try {
      const raw = localStorage.getItem("pasteleria_cart");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }, []);

  // combinar cart con datos de pasteles para mostrar nombre y precio actual
  const items = useMemo(() => {
    return cart.map((c) => {
      const found = pasteles.find((p) => Number(p.id) === Number(c.id));
      return {
        id: c.id,
        nombre: found ? found.nombre : c.nombre || "Producto",
        cantidad: c.cantidad || 1,
        precio: Number(c.precio ?? (found ? found.precio : 0)),
      };
    });
  }, [cart]);

  const subtotal = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const impuestos = Number((subtotal * 0.19).toFixed(2));
  const total = subtotal + impuestos;

  useEffect(() => {
    // intentar leer datos mínimos del cliente desde session_user
    try {
      const raw = localStorage.getItem("session_user");
      if (raw) {
        const s = JSON.parse(raw);
        setCliente({
          nombre: s.nombre || "Cliente",
          correo: s.correo || s.email || "",
        });
      }
    } catch (err) {
      // ignore
    }
  }, []);

  return (
    <div className="container py-4">
      <div className="card p-4">
        {pagoExitoso ? (
          <div className="mb-3">
            <h4 className="text-success">✅ Compra realizada</h4>
            <small>Código orden: ORDER-{Date.now()}</small>
          </div>
        ) : (
          <div className="mb-3">
            <h4 className="text-danger">❌ Pago fallido</h4>
            <button
              className="btn btn-warning"
              onClick={() => setPagoExitoso(true)}
            >
              Reintentar pago
            </button>
          </div>
        )}

        <section className="mb-3">
          <h5>Cliente</h5>
          <p>
            <strong>{cliente.nombre}</strong>
            {cliente.correo && <span> — {cliente.correo}</span>}
          </p>
        </section>

        <section className="mb-3">
          <h5>Items</h5>
          {items.length === 0 ? (
            <div className="alert alert-info">
              No hay productos en el carrito.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.nombre}</td>
                    <td>{it.cantidad}</td>
                    <td>${Number(it.precio).toLocaleString("es-CL")}</td>
                    <td>
                      ${Number(it.precio * it.cantidad).toLocaleString("es-CL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="text-end">
          <p>Subtotal: ${Number(subtotal).toLocaleString("es-CL")}</p>
          <p>Impuestos (19%): ${Number(impuestos).toLocaleString("es-CL")}</p>
          <h5>Total: ${Number(total).toLocaleString("es-CL")}</h5>
        </section>

        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            Imprimir boleta
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              // ejemplo simple: limpiar carrito y mostrar mensaje
              localStorage.removeItem("pasteleria_cart");
              window.dispatchEvent(new Event("storage"));
              setPagoExitoso(true);
              alert("Gracias por tu compra");
            }}
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
