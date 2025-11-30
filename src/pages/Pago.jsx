import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/img/logo.png";
import pastelesData from "../data/Pasteles.json";

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

  const onSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) {
      // Si hay errores de validación, mostrar boleta de error inline (no abrir nueva pestaña)
      const errorOrden = {
        id: `ERR-${Date.now()}`,
        fecha: new Date().toISOString(),
        error: true,
        mensajeError: "Error en la validación del formulario de pago",
        errores: Object.values(errors),
        cliente: (() => {
          try {
            const rawSession = localStorage.getItem("session_user");
            if (rawSession) {
              const s = JSON.parse(rawSession);
              return {
                nombre: s.nombre || "Cliente",
                correo: s.correo || s.email || "",
              };
            }
          } catch {}
          return { nombre: "Cliente", correo: "" };
        })(),
      };

      // Guardar en sessionStorage y mostrar boleta inline (sin abrir nueva pestaña)
      sessionStorage.setItem("ultima_orden", JSON.stringify(errorOrden));
      setInlineOrden(errorOrden);
      setShowConfirmation(true);
      return;
    }
    // Simular pago exitoso: crear boleta/orden y guardarla en localStorage
    try {
      // leer carrito
      const rawCart = localStorage.getItem("pasteleria_cart");
      const cart = rawCart ? JSON.parse(rawCart) : [];

      // intentar obtener datos del cliente desde session_user
      let cliente = { nombre: "Cliente", correo: "" };
      try {
        const rawSession = localStorage.getItem("session_user");
        if (rawSession) {
          const s = JSON.parse(rawSession);
          cliente = {
            nombre: s.nombre || "Cliente",
            correo: s.correo || s.email || "",
          };
        }
      } catch (err) {
        /* ignore */
      }

      // Validar stock y construir/actualizar el inventario local
      const cartArr = Array.isArray(cart) ? cart : [];

      // Cargar pasteles locales y crear una lista combinada con datos base
      const rawPastelesLocal = localStorage.getItem("pasteles_local");
      let pastelesLocal = rawPastelesLocal ? JSON.parse(rawPastelesLocal) : [];

      // merged: copia de locales + los que vienen del JSON base si faltan
      const merged = [...pastelesLocal];
      pastelesData.forEach((base) => {
        if (!merged.find((p) => String(p.id) === String(base.id))) {
          // clonar el base para poder persistir cambios locales
          merged.push({ ...base });
        }
      });

      // Verificar stock disponible para cada item del carrito
      const insufficient = [];
      cartArr.forEach((c) => {
        const prod = merged.find((p) => String(p.id) === String(c.id));
        const qty = Number(c.cantidad || 1);
        if (prod) {
          const available = Number(prod.stock || 0);
          if (qty > available) {
            insufficient.push({
              id: c.id,
              nombre: prod.nombre || `ID ${c.id}`,
              available,
              qty,
            });
          }
        }
      });

      if (insufficient.length > 0) {
        // Construir orden de error por stock insuficiente y mostrar inline
        const msg = insufficient
          .map((x) => `${x.nombre}: stock ${x.available}, solicitado ${x.qty}`)
          .join("; ");
        const errorOrden = {
          id: `ERR-${Date.now()}`,
          fecha: new Date().toISOString(),
          error: true,
          mensajeError: "Stock insuficiente para algunos productos",
          errores: [msg],
          cliente,
        };
        sessionStorage.setItem("ultima_orden", JSON.stringify(errorOrden));
        setInlineOrden(errorOrden);
        setShowConfirmation(true);
        return;
      }

      // Si todo ok, decrementar stock en merged y persistir en pasteles_local
      cartArr.forEach((c) => {
        const prod = merged.find((p) => String(p.id) === String(c.id));
        const qty = Number(c.cantidad || 1);
        if (prod) {
          prod.stock = Math.max(0, Number(prod.stock || 0) - qty);
          // Si stock cae a nivel crítico (<=3), asegurar que exista stockCritico <= 3
          if (prod.stock <= 3) {
            if (!prod.stockCritico || Number(prod.stockCritico) > 3) {
              prod.stockCritico = 3;
            }
          }
        }
      });

      // Guardar merged como pasteles_local (persistir cambios de stock)
      try {
        localStorage.setItem("pasteles_local", JSON.stringify(merged));
      } catch (err) {
        console.error("Error actualizando pasteles_local:", err);
      }

      // construir items básicos desde el carrito (id, cantidad, precio, nombre)
      const items = cartArr.map((c) => {
        const prod = merged.find((p) => String(p.id) === String(c.id));
        return {
          id: c.id,
          cantidad: c.cantidad || 1,
          precio: Number((prod && prod.precio) || c.precio || 0),
          nombre: (prod && prod.nombre) || c.nombre || `ID ${c.id}`,
        };
      });

      const subtotal = items.reduce(
        (acc, it) => acc + it.precio * it.cantidad,
        0
      );
      const impuestos = Number((subtotal * 0.19).toFixed(2));
      const total = subtotal + impuestos;

      const orden = {
        id: `ORD-${Date.now()}`,
        fecha: new Date().toISOString(),
        cliente,
        userId: (() => {
          try {
            const rawSession = localStorage.getItem("session_user");
            if (rawSession) return JSON.parse(rawSession).id;
          } catch {}
          return null;
        })(),
        items,
        subtotal,
        impuestos,
        total,
        estado: "pendiente",
      };

      const rawPedidos = localStorage.getItem("pedidos_local");
      const pedidos = rawPedidos ? JSON.parse(rawPedidos) : [];
      pedidos.push(orden);
      localStorage.setItem("pedidos_local", JSON.stringify(pedidos));

      // limpiar carrito
      localStorage.removeItem("pasteleria_cart");
      // Notificar tanto storage como un evento personalizado para actualizar la UI en la misma pestaña
      try {
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}
      try {
        window.dispatchEvent(new Event("pedidos:updated"));
      } catch (e) {}

      // Mostrar confirmación y abrir boleta en nueva ventana
      setShowConfirmation(true);

      // Guardar la orden en sessionStorage para que esté disponible en la nueva ventana
      sessionStorage.setItem("ultima_orden", JSON.stringify(orden));

      // Mostrar boleta inline temporalmente (sin eliminar el comportamiento existente
      // que abre una nueva ventana). Esto permite al usuario ver la boleta en la
      // misma pestaña antes de la redirección y no afecta a los tests.
      setInlineOrden(orden);

      // No abrir nueva ventana: la boleta se muestra inline en esta misma página

      // Mostrar toast — la boleta inline permanece visible hasta que el usuario
      // la cierre manualmente; además abrimos la boleta en nueva ventana.
      // Esto facilita al usuario ver la boleta sin redirecciones automáticas.
      setShowConfirmation(true);
    } catch (err) {
      console.error("Error guardando boleta", err);
      alert(
        "Pago procesado, pero hubo un error guardando la boleta localmente."
      );
    }
  };

  // Helper: calcular totales y items desde el carrito local
  const computeCartTotals = () => {
    const rawCart = localStorage.getItem("pasteleria_cart");
    const cart = rawCart ? JSON.parse(rawCart) : [];

    const rawPastelesLocal = localStorage.getItem("pasteles_local");
    let pastelesLocal = rawPastelesLocal ? JSON.parse(rawPastelesLocal) : [];
    const merged = [...pastelesLocal];
    pastelesData.forEach((base) => {
      if (!merged.find((p) => String(p.id) === String(base.id))) merged.push({ ...base });
    });

    const items = (Array.isArray(cart) ? cart : []).map((c) => {
      const prod = merged.find((p) => String(p.id) === String(c.id));
      return {
        id: c.id,
        cantidad: c.cantidad || 1,
        precio: Number((prod && prod.precio) || c.precio || 0),
        nombre: (prod && prod.nombre) || c.nombre || `ID ${c.id}`,
      };
    });

    const subtotal = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
    const impuestos = Number((subtotal * 0.19).toFixed(2));
    const total = Number((subtotal + impuestos).toFixed(2));
    return { items, subtotal, impuestos, total, merged };
  };

  // Procesar captura exitosa (común para server/client/simulación)
  const processCapture = (capture) => {
    try {
      const { items, subtotal, impuestos, total, merged } = computeCartTotals();

      // actualizar stock en merged
      items.forEach((c) => {
        const prod = merged.find((p) => String(p.id) === String(c.id));
        const qty = Number(c.cantidad || 1);
        if (prod) prod.stock = Math.max(0, Number(prod.stock || 0) - qty);
      });
      try { localStorage.setItem('pasteles_local', JSON.stringify(merged)); } catch (e) { console.error(e); }

      let cliente = { nombre: 'Cliente', correo: '' };
      try {
        const rawSession = localStorage.getItem('session_user');
        if (rawSession) { const s = JSON.parse(rawSession); cliente = { nombre: s.nombre || 'Cliente', correo: s.correo || s.email || '' }; }
      } catch (err) {}

      const orden = {
        id: `PAYPAL-${Date.now()}`,
        fecha: new Date().toISOString(),
        cliente,
        items,
        subtotal,
        impuestos,
        total,
        estado: 'pagado',
        paypalCapture: capture,
      };

      const rawPedidos = localStorage.getItem('pedidos_local');
      const pedidos = rawPedidos ? JSON.parse(rawPedidos) : [];
      pedidos.push(orden);
      localStorage.setItem('pedidos_local', JSON.stringify(pedidos));

      // limpiar carrito
      localStorage.removeItem('pasteleria_cart');
      try { window.dispatchEvent(new Event('storage')); } catch (e) {}

      sessionStorage.setItem('ultima_orden', JSON.stringify(orden));
      setInlineOrden(orden);
      setShowConfirmation(true);
    } catch (err) {
      console.error('Error procesando captura localmente', err);
    }
  };

  // (Simulación removida) use `processCapture(capture)` cuando necesites procesar capturas manualmente

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
      // No remover el script para no romper otras páginas, pero cleanup si fuera necesario
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
      // Intentar crear la orden en el servidor si el endpoint existe
      try {
        const resp = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            total: Number(usdTotal).toFixed(2),
            currency: 'USD',
            items: items.map((it) => ({ name: it.nombre, unit_amount: Number(clpToUsd(it.precio)).toFixed(2), quantity: Number(it.cantidad || 1) }))
          })
        });
        const json = await resp.json().catch(() => null);
        if (resp.ok && json && (json.id || json.orderID)) {
          return json.id || json.orderID;
        }
        // si el servidor responde con error, hacemos fallback a create en cliente
      } catch (err) {
        console.warn('Fallo create-order server, usando createOrder cliente', err);
      }

      // Fallback: crear orden en el cliente (como antes) usando USD convertidos
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
      // data.orderID viene de PayPal
      const orderID = data.orderID || (data && data.orderID) || null;
      // Intentar capturar en el servidor
      try {
        if (orderID) {
          const resp = await fetch('/api/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID })
          });
          const json = await resp.json().catch(() => null);
          if (resp.ok && json) {
            // usar la respuesta del servidor como detalle de captura
            const capture = json;
            const { items, subtotal, impuestos, total, merged } = computeCartTotals();
            // actualizar stock local
            items.forEach((c) => {
              const prod = merged.find((p) => String(p.id) === String(c.id));
              const qty = Number(c.cantidad || 1);
              if (prod) prod.stock = Math.max(0, Number(prod.stock || 0) - qty);
            });
            try { localStorage.setItem('pasteles_local', JSON.stringify(merged)); } catch (e) { console.error(e); }

            let cliente = { nombre: 'Cliente', correo: '' };
            try {
              const rawSession = localStorage.getItem('session_user');
              if (rawSession) { const s = JSON.parse(rawSession); cliente = { nombre: s.nombre || 'Cliente', correo: s.correo || s.email || '' }; }
            } catch (err) {}

            const orden = {
              id: `PAYPAL-${Date.now()}`,
              fecha: new Date().toISOString(),
              cliente,
              items,
              subtotal,
              impuestos,
              total,
              estado: 'pagado',
              paypalCapture: capture,
            };

            const rawPedidos = localStorage.getItem('pedidos_local');
            const pedidos = rawPedidos ? JSON.parse(rawPedidos) : [];
            pedidos.push(orden);
            localStorage.setItem('pedidos_local', JSON.stringify(pedidos));
            localStorage.removeItem('pasteleria_cart');
            try { window.dispatchEvent(new Event('storage')); } catch (e) {}
            sessionStorage.setItem('ultima_orden', JSON.stringify(orden));
            setInlineOrden(orden);
            setShowConfirmation(true);
            return;
          }
        }
      } catch (err) {
        console.warn('Error capture-order server, cayendo al capture cliente', err);
      }

      // Fallback: captura en el cliente
      try {
        const capture = await actions.order.capture();
        const { items, subtotal, impuestos, total, merged } = computeCartTotals();
        items.forEach((c) => {
          const prod = merged.find((p) => String(p.id) === String(c.id));
          const qty = Number(c.cantidad || 1);
          if (prod) prod.stock = Math.max(0, Number(prod.stock || 0) - qty);
        });
        try { localStorage.setItem('pasteles_local', JSON.stringify(merged)); } catch (e) { console.error(e); }

        let cliente = { nombre: 'Cliente', correo: '' };
        try {
          const rawSession = localStorage.getItem('session_user');
          if (rawSession) { const s = JSON.parse(rawSession); cliente = { nombre: s.nombre || 'Cliente', correo: s.correo || s.email || '' }; }
        } catch (err) {}

        const orden = {
          id: `PAYPAL-${Date.now()}`,
          fecha: new Date().toISOString(),
          cliente,
          items,
          subtotal,
          impuestos,
          total,
          estado: 'pagado',
          paypalCapture: capture,
        };

        const rawPedidos = localStorage.getItem('pedidos_local');
        const pedidos = rawPedidos ? JSON.parse(rawPedidos) : [];
        pedidos.push(orden);
        localStorage.setItem('pedidos_local', JSON.stringify(pedidos));
        localStorage.removeItem('pasteleria_cart');
        try { window.dispatchEvent(new Event('storage')); } catch (e) {}
        sessionStorage.setItem('ultima_orden', JSON.stringify(orden));
        setInlineOrden(orden);
        setShowConfirmation(true);
      } catch (err) {
        console.error('Error en captura PayPal (cliente)', err);
        alert('Hubo un error procesando el pago con PayPal.');
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
                  />
                  {errors.cvv && (
                    <div className="field-error">{errors.cvv}</div>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-success w-100">
                Pagar
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
                      background:
                        "linear-gradient(90deg, var(--accent-pink) 0%, rgba(255,245,225,0.6) 100%)",
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
                          style={{ color: "var(--accent-choco)" }}
                        >
                          Pastelería 1000
                        </h6>
                        <small className="text-muted">Boleta electrónica</small>
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
                            inlineOrden.items.map((it) => (
                              <tr key={it.id}>
                                <td style={{ maxWidth: 280 }}>
                                  {it.nombre || `ID ${it.id}`}
                                </td>
                                <td className="text-center">
                                  {it.cantidad || 1}
                                </td>
                                <td className="text-end">
                                  $
                                  {Number(it.precio || 0).toLocaleString(
                                    "es-CL"
                                  )}
                                </td>
                                <td className="text-end">
                                  $
                                  {Number(
                                    (it.precio || 0) * (it.cantidad || 1)
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
                        {/* Usar valores por defecto si la orden no incluye montos */}
                        {(() => {
                          const safeSubtotal = Number(
                            inlineOrden.subtotal || 0
                          );
                          const safeImpuestos = Number(
                            inlineOrden.impuestos || 0
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
                      <span>Gracias por comprar en Pastelería 1000</span>
                    </div>
                    <button
                      className="btn btn-secondary me-2"
                      onClick={() => window.print()}
                    >
                      <i className="bi bi-printer"></i> Imprimir
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setInlineOrden(null);
                        navigate("/pedidos");
                      }}
                    >
                      Ver mis pedidos
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