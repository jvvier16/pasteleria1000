import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/img/logo.png";
import { crearPedido } from "../utils/apiHelper";

/**
 * Utilidades para el manejo de tarjetas de crédito
 */

/**
 * Limpia un string dejando solo dígitos
 * @param {string} s - String a limpiar
 * @returns {string} String con solo dígitos
 */
const onlyDigits = (s = "") => (s || "").replace(/\D/g, "");

/**
 * Formatea el número de tarjeta según su tipo
 * - AMEX: XXXX XXXXXX XXXXX
 * - Otros: XXXX XXXX XXXX XXXX
 * @param {string} num - Número de tarjeta sin formato
 * @returns {string} Número formateado
 */
const formatCardNumber = (num = "") => {
  const d = onlyDigits(num);
  if (/^3[47]/.test(d))
    return d.replace(/(\d{1,4})(\d{1,6})?(\d{1,5})?/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" ")
    );
  return d.replace(/(\d{1,4})/g, "$1 ").trim();
};

// Luhn
const luhnCheck = (num = "") => {
  const digits = onlyDigits(num).split("").reverse().map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i];
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
};

// tipo simple
const detectCardType = (num = "") => {
  const d = onlyDigits(num);
  if (/^4/.test(d)) return "visa";
  if (/^5[1-5]/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  return "unknown";
};

export default function Pago() {
  const [name, setName] = useState("");
  const [number, setNumber] = useState(""); // raw digits
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const cardType = detectCardType(number);
  const formattedNumber = formatCardNumber(number);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [inlineOrden, setInlineOrden] = useState(null);
  const paypalRef = useRef(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  // Por defecto usar 'sb' (sandbox) para que el botón aparezca en modo demo
  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb";
  const PAYPAL_CURRENCY = import.meta.env.VITE_PAYPAL_CURRENCY || "USD";
  // Tipo de cambio CLP -> USD (valor: cuántos CLP = 1 USD). Configurable vía .env: VITE_CLP_USD_RATE
  const CLP_USD_RATE = Number(import.meta.env.VITE_CLP_USD_RATE) || 800;

  const clpToUsd = (clp) => {
    const n = Number(clp) || 0;
    return n / (CLP_USD_RATE || 1);
  };

  const getMaxDigitsFor = (type) => {
    if (type === "amex") return 15;
    if (type === "visa" || type === "mastercard") return 16;
    return 19; // fallback
  };

  const handleNumberChange = (e) => {
    const raw = onlyDigits(e.target.value);
    // detectar tipo provisional desde los dígitos introducidos
    const type = detectCardType(raw);
    const max = getMaxDigitsFor(type);
    setNumber(raw.slice(0, max));
  };

  const formatExpiryInput = (val) => {
    const d = onlyDigits(val).slice(0, 4); // MMYY
    if (d.length <= 2) return d;
    return d.slice(0, 2) + "/" + d.slice(2);
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryInput(e.target.value);
    setExpiry(formatted);
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Ingresa el nombre que aparece en la tarjeta";

    const digits = onlyDigits(number);
    // No validar Luhn aquí (proyecto educativo): solo comprobar longitud razonable
    if (digits.length < 13 || digits.length > 19)
      e.number = "Número de tarjeta inválido";

    if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry)) e.expiry = "Formato MM/AA";
    else {
      const [mm, yy] = expiry.split("/");
      const exp = new Date(Number("20" + yy), Number(mm) - 1, 1);
      const end = new Date(exp.getFullYear(), exp.getMonth() + 1, 0);
      const now = new Date();
      if (end < now) e.expiry = "Tarjeta expirada";
    }

    const cvvDigits = onlyDigits(cvv);
    const cvvLen = cardType === "amex" ? 4 : 3;
    if (cvvDigits.length !== cvvLen) e.cvv = `CVV debe tener ${cvvLen} dígitos`;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Obtener datos del cliente desde session_user
  const getClienteData = () => {
    try {
      const rawSession = localStorage.getItem("session_user");
      if (rawSession) {
        const s = JSON.parse(rawSession);
        return {
          nombre: s.nombre || "Cliente",
          correo: s.correo || s.email || "",
          direccion: s.direccion || "",
          telefono: s.telefono || "",
        };
      }
    } catch {}
    return { nombre: "Cliente", correo: "", direccion: "", telefono: "" };
  };

  // Helper: calcular totales y items desde el carrito local
  const computeCartTotals = () => {
    const rawCart = localStorage.getItem("pasteleria_cart");
    const cart = rawCart ? JSON.parse(rawCart) : [];

    const items = (Array.isArray(cart) ? cart : []).map((c) => ({
      productoId: c.id,
      cantidad: c.cantidad || 1,
      precio: Number(c.precio || 0),
      nombre: c.nombre || `ID ${c.id}`,
    }));

    const subtotal = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
    const impuestos = Number((subtotal * 0.19).toFixed(2));
    const total = Number((subtotal + impuestos).toFixed(2));
    return { items, subtotal, impuestos, total };
  };

  /**
   * Envía el pedido al backend
   * @param {Object} options - Opciones adicionales (paypalOrderId, etc.)
   * @returns {Object} - Orden creada o null si falla
   */
  const enviarPedidoAlBackend = async (options = {}) => {
    const { items } = computeCartTotals();
    const cliente = getClienteData();

    // Preparar datos para el backend según CrearBoletaRequest
    const pedidoData = {
      items: items.map((it) => ({
        productoId: it.productoId,
        cantidad: it.cantidad,
      })),
      nombreCliente: cliente.nombre,
      emailCliente: cliente.correo,
      telefonoCliente: cliente.telefono,
      direccionEntrega: cliente.direccion,
      notas: options.paypalOrderId 
        ? `Pago PayPal - Order ID: ${options.paypalOrderId}` 
        : "Pago con tarjeta simulada",
    };

    try {
      const response = await crearPedido(pedidoData);
      
      // El backend devuelve: { status, message, data: {...boleta} }
      const boletaCreada = response.data;
      
      return {
        id: boletaCreada.boletaId || boletaCreada.id || `ORD-${Date.now()}`,
        fecha: boletaCreada.fecha || new Date().toISOString(),
        cliente: {
          nombre: cliente.nombre,
          correo: cliente.correo,
        },
        items: boletaCreada.items || items,
        subtotal: boletaCreada.subtotal || boletaCreada.subTotal,
        impuestos: boletaCreada.iva || boletaCreada.impuestos,
        total: boletaCreada.total,
        estado: boletaCreada.estado || "pendiente",
        paypalOrderId: options.paypalOrderId || null,
      };
    } catch (error) {
      console.error("Error enviando pedido al backend:", error);
      throw error;
    }
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      // Si hay errores de validación, mostrar boleta de error inline
      const errorOrden = {
        id: `ERR-${Date.now()}`,
        fecha: new Date().toISOString(),
        error: true,
        mensajeError: "Error en la validación del formulario de pago",
        errores: Object.values(errors),
        cliente: getClienteData(),
      };

      sessionStorage.setItem("ultima_orden", JSON.stringify(errorOrden));
      setInlineOrden(errorOrden);
      setShowConfirmation(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Enviar pedido al backend
      const orden = await enviarPedidoAlBackend();

      // Limpiar carrito
      localStorage.removeItem("pasteleria_cart");
      try {
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}

      // Guardar la orden en sessionStorage para referencia
      sessionStorage.setItem("ultima_orden", JSON.stringify(orden));

      // Mostrar boleta inline
      setInlineOrden(orden);
      setShowConfirmation(true);

    } catch (err) {
      console.error("Error procesando pago", err);
      
      // Mostrar error
      const errorOrden = {
        id: `ERR-${Date.now()}`,
        fecha: new Date().toISOString(),
        error: true,
        mensajeError: err.message || "Error al procesar el pago. Intenta nuevamente.",
        errores: [err.message || "Error de conexión con el servidor"],
        cliente: getClienteData(),
      };
      
      sessionStorage.setItem("ultima_orden", JSON.stringify(errorOrden));
      setInlineOrden(errorOrden);
      setShowConfirmation(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cargar SDK de PayPal y renderizar botones (sandbox/production según client id)
  useEffect(() => {
    // Cargar SDK solo si hay un total mayor que 0
    const { total } = computeCartTotals();
    if (!total || Number(total) <= 0) return;

    if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === "YOUR_PAYPAL_CLIENT_ID") return;

    const existing = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
    if (existing) {
      setPaypalLoaded(true);
      if (window.paypal && paypalRef.current) {
        try {
          window.paypal.Buttons && window.paypal.Buttons(paypalButtonsConfig()).render(paypalRef.current);
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${PAYPAL_CURRENCY}`;
    script.async = true;
    script.onload = () => {
      setPaypalLoaded(true);
      if (paypalRef.current && window.paypal) {
        try {
          window.paypal.Buttons && window.paypal.Buttons(paypalButtonsConfig()).render(paypalRef.current);
        } catch (e) {
          console.error("Error rendering PayPal Buttons", e);
        }
      }
    };
    script.onerror = (err) => {
      console.error("Error loading PayPal SDK", err);
    };
    document.body.appendChild(script);

    return () => {
      // No remover el script para no romper otras páginas
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PAYPAL_CLIENT_ID, PAYPAL_CURRENCY]);

  const paypalButtonsConfig = () => ({
    createOrder: async (data, actions) => {
      const { items, subtotal, impuestos, total } = computeCartTotals();
      // convertir montos CLP -> USD para PayPal
      const usdSubtotal = clpToUsd(subtotal);
      const usdImpuestos = clpToUsd(impuestos);
      const usdTotal = clpToUsd(total);

      // Crear orden en el cliente usando USD convertidos
      return actions.order.create({
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: usdTotal.toFixed(2),
              breakdown: {
                item_total: { currency_code: 'USD', value: usdSubtotal.toFixed(2) },
                tax_total: { currency_code: 'USD', value: usdImpuestos.toFixed(2) },
              },
            },
            items: items.map((it) => ({
              name: it.nombre,
              unit_amount: { currency_code: 'USD', value: clpToUsd(it.precio).toFixed(2) },
              quantity: String(it.cantidad || 1),
            })),
          },
        ],
      });
    },
    onApprove: async (data, actions) => {
      const paypalOrderId = data.orderID || null;
      
      try {
        // Capturar pago en PayPal
        const capture = await actions.order.capture();
        
        // Enviar pedido al backend con paypalOrderId
        const orden = await enviarPedidoAlBackend({ 
          paypalOrderId,
          paypalCapture: capture 
        });

        // Limpiar carrito
        localStorage.removeItem('pasteleria_cart');
        try { window.dispatchEvent(new Event('storage')); } catch (e) {}

        // Mostrar boleta
        sessionStorage.setItem('ultima_orden', JSON.stringify(orden));
        setInlineOrden(orden);
        setShowConfirmation(true);

      } catch (err) {
        console.error('Error procesando pago PayPal:', err);
        
        const errorOrden = {
          id: `ERR-${Date.now()}`,
          fecha: new Date().toISOString(),
          error: true,
          mensajeError: err.message || "Error al procesar el pago con PayPal",
          errores: [err.message || "Error de conexión con el servidor"],
          cliente: getClienteData(),
        };
        
        sessionStorage.setItem('ultima_orden', JSON.stringify(errorOrden));
        setInlineOrden(errorOrden);
        setShowConfirmation(true);
      }
    },
    onError: (err) => {
      console.error("PayPal Buttons error", err);
      alert("Error al procesar PayPal. Reintente más tarde.");
    },
  });

  return (
    <>
      <main className="container my-5">
        <h2 className="mb-4 text-center w-100">Pago</h2>

        <div className="payment-container">
          <div className="payment-card">
            <form onSubmit={onSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="nombre" className="form-label">
                  Nombre en la tarjeta
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isProcessing}
                />
                {errors.name && (
                  <div className="field-error">{errors.name}</div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="numero" className="form-label">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="numero"
                  value={formattedNumber}
                  onChange={handleNumberChange}
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  disabled={isProcessing}
                />
                {errors.number && (
                  <div className="field-error">{errors.number}</div>
                )}
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label htmlFor="expira" className="form-label">
                    Expira
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="expira"
                    placeholder="MM/AA"
                    value={expiry}
                    onChange={handleExpiryChange}
                    maxLength={5}
                    disabled={isProcessing}
                  />
                  {errors.expiry && (
                    <div className="field-error">{errors.expiry}</div>
                  )}
                </div>
                <div className="col">
                  <label htmlFor="cvv" className="form-label">
                    CVV
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="cvv"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(onlyDigits(e.target.value))}
                    onFocus={() => setFlipped(true)}
                    onBlur={() => setFlipped(false)}
                    disabled={isProcessing}
                  />
                  {errors.cvv && (
                    <div className="field-error">{errors.cvv}</div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-success w-100"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Procesando...
                  </>
                ) : (
                  "Pagar"
                )}
              </button>

              {/* Toast fijo en la esquina superior derecha */}
              {showConfirmation && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    position: "fixed",
                    top: 20,
                    right: 20,
                    zIndex: 2000,
                    minWidth: 240,
                  }}
                >
                  <div className="toast show bg-success text-white p-2 shadow">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <strong>Pago procesado</strong>
                        <div className="small">
                          Boleta disponible en esta pantalla
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        aria-label="Cerrar"
                        onClick={() => setShowConfirmation(false)}
                      ></button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Sección PayPal: si se configuró VITE_PAYPAL_CLIENT_ID se renderiza el botón */}
          {(() => {
            const { total } = computeCartTotals();
            return (
              <div className="paypal-box">
                <div className="paypal-title">PayPal</div>
                <div className="paypal-amount">
                  {(() => {
                    const usdTotal = clpToUsd(total || 0);
                    return `Total (USD): $${Number(usdTotal || 0).toFixed(2)} USD`;
                  })()}
                </div>
                {Number(total || 0) > 0 ? (
                  <>
                    <div className="paypal-button-container">
                      <div ref={paypalRef} />
                    </div>
                    {!paypalLoaded && (
                      <div className="paypal-note small mt-2">Cargando PayPal...</div>
                    )}
                  </>
                ) : (
                  <div className="paypal-note small mt-2">Añade productos al carrito para pagar con PayPal</div>
                )}
              </div>
            );
          })()}

          <div>
            <div className={`credit-card ${flipped ? "flipped" : ""}`}>
              <div className="card-inner">
                <div className="card-face front">
                  <div className="d-flex justify-content-between align-items-start">
                    <img src={logo} alt="logo" className="card-logo" data-testid="logo-preview" />
                    <span className="text-capitalize">{cardType}</span>
                  </div>
                  <div className="number">{formattedNumber || "#### #### #### ####"}</div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="name">{name || "NOMBRE APELLIDO"}</div>
                    <div className="exp">{expiry || "MM/AA"}</div>
                  </div>
                </div>

                <div className="card-face back">
                  <div style={{ height: 40, background: "#000", borderRadius: 6 }}></div>
                  <div className="mt-3 d-flex justify-content-end">
                    <div className="card-cvv-box" data-testid="card-cvv">
                      {cvv || (cardType === "amex" ? "****" : "***")}
                    </div>
                  </div>
                  <div className="mt-auto small text-muted">Pastelería 1000 Sabores</div>
                </div>
              </div>
            </div>
          </div>
          {/* Boleta mostrada en un modal Bootstrap "fake" (sin requerir JS) */}
          {inlineOrden && (
            <div
              className="modal fade show"
              tabIndex={-1}
              role="dialog"
              style={{ display: "block", backgroundColor: "rgba(0,0,0,0.45)" }}
              data-testid="inline-boleta"
              aria-modal="true"
            >
              <div
                className="modal-dialog modal-lg modal-dialog-centered"
                role="document"
              >
                <div
                  className="modal-content"
                  style={{ borderRadius: 12, overflow: "hidden" }}
                >
                  <div
                    className="modal-header"
                    style={{
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      background: inlineOrden.error 
                        ? "linear-gradient(90deg, #f8d7da 0%, rgba(255,245,225,0.6) 100%)"
                        : "linear-gradient(90deg, var(--accent-pink) 0%, rgba(255,245,225,0.6) 100%)",
                      color: "var(--accent-choco)",
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <img
                        src={logo}
                        alt="logo"
                        data-testid="boleta-logo"
                        className="rounded-circle"
                        style={{
                          height: 42,
                          width: 42,
                          objectFit: "cover",
                          marginRight: 12,
                        }}
                      />
                      <div>
                        <h6
                          className="mb-0"
                          style={{ color: inlineOrden.error ? "#721c24" : "var(--accent-choco)" }}
                        >
                          {inlineOrden.error ? "Error en el pago" : "Pastelería 1000"}
                        </h6>
                        <small className="text-muted">
                          {inlineOrden.error ? "No se pudo procesar" : "Boleta electrónica"}
                        </small>
                      </div>
                    </div>
                    <div
                      className="ms-auto text-end"
                      style={{ color: "var(--text-main)" }}
                    >
                      <div className="fw-semibold">{inlineOrden.id}</div>
                      <small className="text-muted">
                        {new Date(inlineOrden.fecha).toLocaleString()}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Cerrar"
                      onClick={() => setInlineOrden(null)}
                    ></button>
                  </div>

                  <div className="modal-body p-4">
                    {inlineOrden.error ? (
                      <div className="alert alert-danger">
                        <h5>{inlineOrden.mensajeError}</h5>
                        {inlineOrden.errores && inlineOrden.errores.length > 0 && (
                          <ul className="mb-0 mt-2">
                            {inlineOrden.errores.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <h6 className="mb-1">Cliente</h6>
                            <div className="text-muted">
                              {inlineOrden.cliente?.nombre || "--"}
                            </div>
                            {inlineOrden.cliente?.correo && (
                              <div className="text-muted small">
                                {inlineOrden.cliente.correo}
                              </div>
                            )}
                          </div>
                          <div className="col-md-6 mb-3 text-md-end">
                            <h6 className="mb-1">Resumen</h6>
                            <div className="small text-muted">
                              Items:{" "}
                              {Array.isArray(inlineOrden.items)
                                ? inlineOrden.items.length
                                : 0}
                            </div>
                            <div className="small text-muted">IVA incluido</div>
                          </div>
                        </div>

                        <div className="table-responsive mt-2">
                          <table className="table table-borderless">
                            <thead>
                              <tr className="border-bottom">
                                <th>Producto</th>
                                <th className="text-center">Cant.</th>
                                <th className="text-end">Precio</th>
                                <th className="text-end">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(inlineOrden.items) &&
                              inlineOrden.items.length > 0 ? (
                                inlineOrden.items.map((it, idx) => (
                                  <tr key={it.productoId || it.id || idx}>
                                    <td style={{ maxWidth: 280 }}>
                                      {it.nombreProducto || it.nombre || `ID ${it.productoId || it.id}`}
                                    </td>
                                    <td className="text-center">
                                      {it.cantidad || 1}
                                    </td>
                                    <td className="text-end">
                                      $
                                      {Number(it.precioUnitario || it.precio || 0).toLocaleString(
                                        "es-CL"
                                      )}
                                    </td>
                                    <td className="text-end">
                                      $
                                      {Number(
                                        it.subtotal || (it.precioUnitario || it.precio || 0) * (it.cantidad || 1)
                                      ).toLocaleString("es-CL")}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="text-center text-muted py-4"
                                  >
                                    No hay productos en la boleta
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div className="d-flex justify-content-end mt-3">
                          <div style={{ minWidth: 260 }}>
                            {(() => {
                              const safeSubtotal = Number(
                                inlineOrden.subtotal || inlineOrden.subTotal || 0
                              );
                              const safeImpuestos = Number(
                                inlineOrden.impuestos || inlineOrden.iva || 0
                              );
                              const safeTotal = Number(
                                inlineOrden.total || safeSubtotal + safeImpuestos
                              );
                              return (
                                <>
                                  <div className="d-flex justify-content-between small text-muted">
                                    <div>Subtotal</div>
                                    <div>
                                      ${safeSubtotal.toLocaleString("es-CL")}
                                    </div>
                                  </div>
                                  <div className="d-flex justify-content-between small text-muted">
                                    <div>IVA (19%)</div>
                                    <div>
                                      ${safeImpuestos.toLocaleString("es-CL")}
                                    </div>
                                  </div>
                                  <div
                                    className="d-flex justify-content-between align-items-center mt-2"
                                    style={{ fontSize: 18 }}
                                  >
                                    <strong>Total</strong>
                                    <strong
                                      style={{ color: "var(--accent-choco)" }}
                                    >
                                      ${safeTotal.toLocaleString("es-CL")}
                                    </strong>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    className="modal-footer border-top p-3"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,245,225,0.4), transparent)",
                    }}
                  >
                    <div className="me-auto small text-muted d-flex align-items-center">
                      <img
                        src={logo}
                        alt="icono"
                        data-testid="boleta-footer-logo"
                        style={{
                          height: 20,
                          width: 20,
                          objectFit: "cover",
                          marginRight: 8,
                        }}
                      />
                      <span>
                        {inlineOrden.error 
                          ? "Por favor, intenta nuevamente" 
                          : "Gracias por comprar en Pastelería 1000"}
                      </span>
                    </div>
                    {!inlineOrden.error && (
                      <button
                        className="btn btn-secondary me-2"
                        onClick={() => window.print()}
                      >
                        <i className="bi bi-printer"></i> Imprimir
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setInlineOrden(null);
                        if (inlineOrden.error) {
                          // Quedarse en la página de pago para reintentar
                        } else {
                          navigate("/");
                        }
                      }}
                    >
                      {inlineOrden.error ? "Cerrar" : "Volver al inicio"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
