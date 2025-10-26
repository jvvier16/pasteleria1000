/**
 * Componente: Pago
 *
 * Este componente maneja el proceso de pago con tarjeta de crédito.
 * Características principales:
 * - Validación de tarjetas de crédito (Visa, Mastercard, Amex)
 * - Visualización interactiva de la tarjeta
 * - Validaciones en tiempo real
 * - Generación de órdenes
 * - Manejo de errores
 * - Redirección a boleta
 *
 * Funcionalidades:
 * - Detección automática del tipo de tarjeta
 * - Formateo de número de tarjeta según tipo
 * - Validación de fecha de expiración
 * - Validación de CVV según tipo de tarjeta
 * - Generación de boleta electrónica
 * - Almacenamiento de pedido en localStorage
 *
 * Flujo de pago:
 * 1. Usuario ingresa datos de tarjeta
 * 2. Se validan todos los campos
 * 3. Se procesa el pago (simulado)
 * 4. Se genera la orden
 * 5. Se limpia el carrito
 * 6. Se muestra confirmación
 * 7. Se abre la boleta en nueva ventana
 * 8. Se redirige al inicio
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/img/logo.png";

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
      // Si hay errores de validación, redirigir a boleta de error
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

      // Guardar en sessionStorage y abrir boleta de error
      sessionStorage.setItem("ultima_orden", JSON.stringify(errorOrden));
      window.open(
        `/boleta?orden=${errorOrden.id}&error=true&timestamp=${Date.now()}`,
        "_blank"
      );
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

      // construir items básicos desde el carrito (id, cantidad, precio)
      const items = (Array.isArray(cart) ? cart : []).map((c) => ({
        id: c.id,
        cantidad: c.cantidad || 1,
        precio: Number(c.precio || 0),
      }));

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
      };

      const rawPedidos = localStorage.getItem("pedidos_local");
      const pedidos = rawPedidos ? JSON.parse(rawPedidos) : [];
      pedidos.push(orden);
      localStorage.setItem("pedidos_local", JSON.stringify(pedidos));

      // limpiar carrito
      localStorage.removeItem("pasteleria_cart");
      window.dispatchEvent(new Event("storage"));

      // Mostrar confirmación y abrir boleta en nueva ventana
      setShowConfirmation(true);

      // Guardar la orden en sessionStorage para que esté disponible en la nueva ventana
      sessionStorage.setItem("ultima_orden", JSON.stringify(orden));

      // Abrir boleta en nueva ventana
      const boletaUrl = `/boleta?orden=${orden.id}&timestamp=${Date.now()}`;
      window.open(boletaUrl, "_blank");

      // Mostrar toast y redireccionar a la página principal después de un breve delay
      setTimeout(() => {
        setShowConfirmation(false);
        setTimeout(() => {
          navigate("/", {
            state: {
              message:
                "¡Pago exitoso! La boleta se ha abierto en una nueva ventana.",
            },
          });
        }, 180);
      }, 800);
    } catch (err) {
      console.error("Error guardando boleta", err);
      alert(
        "Pago procesado, pero hubo un error guardando la boleta localmente."
      );
    }
  };

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
                        <div className="small">Redirigiendo a boleta…</div>
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

          <div>
            <div className="card-preview">
              <div className="d-flex justify-content-between align-items-start">
                <img src={logo} alt="logo" className="logo-small" />
                <span className="text-capitalize">{cardType}</span>
              </div>
              <div className="number">
                {formattedNumber || "#### #### #### ####"}
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <div className="name">{name || "NOMBRE APELLIDO"}</div>
                <div className="exp">{expiry || "MM/AA"}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
