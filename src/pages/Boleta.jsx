// Boleta: muestra el resumen de la compra y persiste la orden en `pedidos_local` si
// el pago se marca como exitoso en navigation state.
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import pasteles from "../data/Pasteles.json";
export default function Boleta() {
  const [pagoExitoso, setPagoExitoso] = useState(true);
  const [cliente, setCliente] = useState({ nombre: "Cliente", correo: "" });
  const [displayedOrder, setDisplayedOrder] = useState(null);
  const navigate = useNavigate();

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

  let subtotal = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  let impuestos = Number((subtotal * 0.19).toFixed(2));
  let total = subtotal + impuestos;

  // Si se pasó una orden completa por navigation state, usarla para mostrar datos
  useEffect(() => {
    try {
      const state = location.state || {};
      if (state && state.orden) {
        setDisplayedOrder(state.orden);
      }
    } catch (err) {}
  }, [location.state]);

  if (displayedOrder) {
    // sobrescribir los valores por los de la orden recibida
    if (Array.isArray(displayedOrder.items)) {
      // mapear items si vienen con campos mínimos
      const ordItems = displayedOrder.items.map((it) => ({
        id: it.id,
        nombre:
          it.nombre ||
          (pasteles.find((p) => Number(p.id) === Number(it.id)) || {}).nombre ||
          "Producto",
        cantidad: it.cantidad || it.cantidad || 1,
        precio: Number(it.precio || 0),
      }));
      // usar estos items para render
      // re-calcular subtotal/impuestos/total basados en la orden (si vienen, preferirlos)
      subtotal =
        displayedOrder.subtotal ??
        ordItems.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
      impuestos =
        displayedOrder.impuestos ?? Number((subtotal * 0.19).toFixed(2));
      total = displayedOrder.total ?? subtotal + impuestos;
    }
  }

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

  // leer resultado de pago pasado por navigation state
  const location = useLocation();
  useEffect(() => {
    try {
      const state = location.state || {};
      if (typeof state.pagoExitoso === "boolean")
        setPagoExitoso(state.pagoExitoso);

      // Si el pago fue exitoso y el navegador envió la orden en el state, usarla
      // para mostrar la boleta. Esto evita depender del carrito que puede ya
      // haber sido limpiado por el flujo de pago.
      if (state.pagoExitoso === true && state.orden) {
        // Mostrar la orden enviada por Pago
        const o = state.orden;
        // Si items vienen en la orden, sobreescribimos el contenido mostrado
        // (no volveremos a persistirla para evitar duplicados).
        // Reemplazamos los items locales temporalmente para la visualización.
        // Nota: no modificamos pedidos_local aquí porque Pago ya lo guardó.
        // Limpiar carrito local para reflejar que la compra fue completada.
        try {
          localStorage.removeItem("pasteleria_cart");
        } catch {}
        window.dispatchEvent(new Event("storage"));
      } else if (state.pagoExitoso === true && items.length > 0) {
        // Backward-compat: si no recibimos la orden pero el carrito tiene items,
        // persistir la orden aquí.
        const orden = {
          id: `ORD-${Date.now()}`,
          fecha: new Date().toISOString(),
          cliente: cliente,
          userId: (() => {
            try {
              const raw = localStorage.getItem("session_user");
              if (raw) return JSON.parse(raw).id;
            } catch {}
            return null;
          })(),
          items: items,
          subtotal,
          impuestos,
          total,
        };
        try {
          const raw = localStorage.getItem("pedidos_local");
          const arr = raw ? JSON.parse(raw) : [];
          arr.push(orden);
          localStorage.setItem("pedidos_local", JSON.stringify(arr));
        } catch (err) {
          // ignore
        }
        // limpiar carrito
        localStorage.removeItem("pasteleria_cart");
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  return (
    <div className="container py-4">
      <div className="card p-4">
        {pagoExitoso ? (
          <div className="mb-3">
            <h4 className="text-success">✅ Compra realizada</h4>
            <small>
              Código orden:{" "}
              {displayedOrder ? displayedOrder.id : `ORDER-${Date.now()}`}
            </small>
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

          {/* Ver mi pedido: navegar a /pedidos pasando el id de la orden si existe */}
          <button
            className="btn btn-outline-primary"
            onClick={() =>
              navigate("/pedidos", {
                state: { orderId: displayedOrder ? displayedOrder.id : null },
              })
            }
          >
            Ver mi pedido
          </button>
        </div>
      </div>
    </div>
  );
}
