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
    const items = getCart();
    if (!items || items.length === 0) return alert("Tu carrito está vacío");
    const total = items.reduce(
      (acc, it) => acc + (Number(it.precio) || 0) * (it.cantidad || 1),
      0
    );
    // leer pedidos existentes
    let pedidos = [];
    try {
      const raw = localStorage.getItem("pedidos_local");
      pedidos = raw ? JSON.parse(raw) : [];
    } catch (err) {
      pedidos = [];
    }

    // obtener usuario si existe
    let user = null;
    try {
      const rawUser = localStorage.getItem("session_user");
      user = rawUser ? JSON.parse(rawUser) : null;
    } catch (err) {
      user = null;
    }

    const nextId = pedidos.length
      ? Math.max(...pedidos.map((p) => p.id)) + 1
      : 1;
    const nuevoPedido = {
      id: nextId,
      userId: user ? user.id : null,
      items,
      total,
      createdAt: new Date().toISOString(),
    };

    pedidos.push(nuevoPedido);
    try {
      localStorage.setItem("pedidos_local", JSON.stringify(pedidos));
    } catch (err) {
      console.error("No se pudo guardar el pedido", err);
    }

    // limpiar carrito y redirigir
    clearCart();
    window.dispatchEvent(new Event("storage"));
    setCarrito([]);
    navigate("/pedidos");
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
                    <td style={{ width: "90px" }}>
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
