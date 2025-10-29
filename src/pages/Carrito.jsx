/**
 * Componente: Carrito de Compras
 *
 * Este componente maneja la visualización y gestión del carrito de compras.
 * Características principales:
 * - Listado de productos agregados al carrito
 * - Actualización de cantidades en tiempo real
 * - Cálculo automático de subtotales y total
 * - Persistencia en localStorage
 * - Sincronización entre pestañas
 * - Redirección al flujo de pago
 *
 * Funcionalidades:
 * - Eliminar productos individuales
 * - Actualizar cantidades
 * - Limpiar carrito completo
 * - Calcular totales
 * - Proceder al pago
 *
 * Integración:
 * - Usa localstorageHelper para operaciones del carrito
 * - Se conecta con el flujo de pago
 * - Maneja formato de moneda en CLP
 */
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  getCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  getTotal,
} from "../utils/localstorageHelper";
import { useNavigate } from "react-router-dom";

const Carrito = () => {
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    setCarrito(getCart());

    // opcional: sincronizar cambios de localStorage entre pestañas
    const onStorage = (e) => {
      if (e.key === null || e.key === "pasteleria_cart") {
        setCarrito(getCart());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const eliminarDelCarrito = (id) => {
    const nuevo = removeFromCart(id);
    setCarrito(nuevo);
  };

  const actualizarCantidad = (id, cantidad) => {
    const nuevo = updateQuantity(id, cantidad);
    setCarrito(nuevo);
  };

  const limpiarCarrito = () => {
    clearCart();
    setCarrito([]);
  };

  const navigate = useNavigate();

  const comprarAhora = () => {
    // En lugar de crear la orden aquí, redirigimos al flujo de pago
    // para pedir los datos de la tarjeta y procesar el pago en `/pago`.
    const items = getCart();
    if (!items || items.length === 0) return alert("Tu carrito está vacío");

    // navegar a pago; la página `Pago.jsx` leerá el carrito y procesará la orden
    navigate("/pago");
  };

  const total = getTotal();

  return (
    <div className="container py-4">
      <div className="alert alert-primary text-center">
        <strong>¡Carrito de la Pastelería!</strong> Aquí puedes revisar los
        pasteles que agregaste y el total se actualizará automáticamente.
      </div>

      <div className="row">
        <div className="col-12">
          <h4 className="mb-3">Carrito de Compras</h4>
          {carrito.length === 0 ? (
            <p className="text-muted">Tu carrito está vacío</p>
          ) : (
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td>${Number(item.precio).toLocaleString("es-CL")}</td>
                    <td className="td-qty">
                      <input
                        type="number"
                        min="1"
                        className="form-control form-control-sm"
                        value={item.cantidad}
                        onChange={(e) =>
                          actualizarCantidad(item.id, e.target.value)
                        }
                      />
                    </td>
                    <td>
                      $
                      {Number(item.precio * item.cantidad).toLocaleString(
                        "es-CL"
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => eliminarDelCarrito(item.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-end fw-bold">
                    Total:
                  </td>
                  <td className="fw-bold">
                    ${Number(total).toLocaleString("es-CL")}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}

          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-secondary" onClick={limpiarCarrito}>
              Limpiar
            </button>
            <button className="btn btn-success" onClick={comprarAhora}>
              Comprar ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carrito;
