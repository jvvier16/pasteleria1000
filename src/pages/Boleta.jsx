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

  // Cargar la orden desde URL params, sessionStorage o navigation state
  useEffect(() => {
    try {
      // 1. Intentar obtener desde URL params
      const params = new URLSearchParams(location.search);
      const ordenId = params.get('orden');
      const isError = params.get('error') === 'true';
      
      if (ordenId) {
        // Buscar la orden en sessionStorage primero
        const storedOrder = sessionStorage.getItem('ultima_orden');
        if (storedOrder) {
          const orden = JSON.parse(storedOrder);
          if (orden.id === ordenId) {
            setDisplayedOrder(orden);
            setPagoExitoso(!isError && !orden.error);
            return;
          }
        }
        
        // Si no está en sessionStorage, buscar en pedidos_local
        const pedidosRaw = localStorage.getItem('pedidos_local');
        if (pedidosRaw) {
          const pedidos = JSON.parse(pedidosRaw);
          const orden = pedidos.find(p => p.id === ordenId);
          if (orden) {
            setDisplayedOrder(orden);
            setPagoExitoso(!isError && !orden.error);
            return;
          }
        }
      }

      // 2. Intentar obtener desde navigation state
      const state = location.state || {};
      if (state && state.orden) {
        setDisplayedOrder(state.orden);
        setPagoExitoso(!state.orden.error);
      }
    } catch (err) {
      console.error('Error cargando orden:', err);
      setPagoExitoso(false);
    }
  }, [location.search, location.state]);

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
      <div className="card p-4 mx-auto" style={{ maxWidth: "800px" }}>
        <div className="text-center mb-4">
          <img
            src="/src/assets/img/logo.png"
            alt="Logo"
            style={{ width: "100px" }}
            className="mb-2"
          />
          <h2 className="mb-0">Pastelería 1000 Sabores</h2>
          <p className="text-muted small mb-0">RUT: 76.XXX.XXX-X</p>
          <p className="text-muted small">
            Dirección: Av. Example 123, Santiago
          </p>
        </div>
        <hr className="my-4" />
        {pagoExitoso ? (
          <div className="mb-3">
            <h4 className="text-success">✅ Compra realizada</h4>
            <small>
              Código orden:{" "}
              {displayedOrder ? displayedOrder.id : `ORDER-${Date.now()}`}
            </small>
          </div>
        ) : (
          <div className="mb-4">
            <div className="alert alert-danger">
              <h4 className="alert-heading">❌ Error en el pago</h4>
              <p className="mb-1">
                {displayedOrder?.mensajeError || "No se pudo completar el pago"}
              </p>
              {displayedOrder?.errores && displayedOrder.errores.length > 0 && (
                <ul className="mb-1 small">
                  {displayedOrder.errores.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
              <hr />
              <div className="d-flex gap-2">
                <button
                  className="btn btn-danger"
                  onClick={() => window.close()}
                >
                  Cerrar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    window.opener?.location.href = '/pago';
                    window.close();
                  }}
                >
                  Volver al pago
                </button>
              </div>
            </div>
          </div>
        )}
        <section className="mb-4">
          <h5 className="border-bottom pb-2">Información del Cliente</h5>
          <div className="row">
            <div className="col-md-6">
              <p className="mb-2">
                <strong>Nombre:</strong> {cliente.nombre}
              </p>
              {cliente.correo && (
                <p className="mb-2">
                  <strong>Email:</strong> {cliente.correo}
                </p>
              )}
            </div>
            <div className="col-md-6">
              <p className="mb-2">
                <strong>Fecha:</strong>{" "}
                {displayedOrder
                  ? new Date(displayedOrder.fecha).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : new Date().toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
              </p>
              <p className="mb-2">
                <strong>Nº Boleta:</strong>{" "}
                {displayedOrder ? displayedOrder.id : `ORDER-${Date.now()}`}
              </p>
            </div>
          </div>
        </section>{" "}
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
        <section className="mb-4">
          <div className="card bg-light">
            <div className="card-body">
              <div className="row text-end">
                <div className="col-7 col-md-9 text-end">
                  <p className="mb-2">Subtotal:</p>
                  <p className="mb-2">IVA (19%):</p>
                  <h5 className="mb-0 fw-bold">Total:</h5>
                </div>
                <div className="col-5 col-md-3 text-end">
                  <p className="mb-2">
                    ${Number(subtotal).toLocaleString("es-CL")}
                  </p>
                  <p className="mb-2">
                    ${Number(impuestos).toLocaleString("es-CL")}
                  </p>
                  <h5 className="mb-0 fw-bold text-success">
                    ${Number(total).toLocaleString("es-CL")}
                  </h5>
                </div>
              </div>
            </div>
          </div>
        </section>{" "}
        <div className="border-top pt-3 mt-4">
          <div className="row">
            <div className="col-12 col-md-6">
              <div className="d-flex flex-column gap-2">
                <button
                  className="btn btn-secondary d-flex align-items-center justify-content-center gap-2"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer"></i>
                  Imprimir boleta
                </button>
                <button
                  className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                  onClick={() => navigate("/pedidos")}
                >
                  <i className="bi bi-box"></i>
                  Ver mis pedidos
                </button>
              </div>
            </div>
            <div className="col-12 col-md-6 mt-3 mt-md-0">
              <div className="card bg-light">
                <div className="card-body">
                  <h6 className="card-title">Información importante:</h6>
                  <ul className="small mb-0">
                    <li>
                      Guarda esta boleta para cualquier cambio o devolución
                    </li>
                    <li>Plazo máximo para cambios: 10 días hábiles</li>
                    <li>Para consultas: contacto@pasteleria1000.cl</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <h5 className="text-success mb-2">¡Gracias por tu compra!</h5>
            <p className="text-muted small mb-0">
              Tu pedido ha sido registrado con éxito.
              <br />
              Recibirás un correo con los detalles de tu compra.
            </p>
          </div>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style type="text/css" media="print">
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .card, .card * {
              visibility: visible;
            }
            .card {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .btn, .no-print {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
