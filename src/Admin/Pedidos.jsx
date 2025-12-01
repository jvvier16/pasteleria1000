/**
 * Pedidos: muestra las órdenes del usuario autenticado desde el backend.
 * - Carga pedidos desde GET /api/v2/boletas/mis-pedidos
 * - Requiere autenticación (token JWT)
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerMisPedidos } from "../utils/apiHelper";

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay usuario autenticado
    try {
      const rawUser = localStorage.getItem("session_user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      setUser(u);

      if (!u || !localStorage.getItem("token")) {
        setLoading(false);
        return;
      }
    } catch (err) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Cargar pedidos del backend
    const cargarPedidos = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await obtenerMisPedidos();
        
        // El backend devuelve: { status, message, data: [...pedidos] }
        const pedidosData = response.data || [];
        
        // Normalizar datos de los pedidos
        const pedidosNormalizados = pedidosData.map((p) => ({
          id: p.boletaId || p.id,
          fecha: p.fecha,
          estado: p.estado,
          subtotal: p.subTotal || p.subtotal,
          iva: p.iva || p.impuestos,
          total: p.total,
          items: (p.items || []).map((it) => ({
            id: it.detalleId || it.id,
            productoId: it.productoId,
            nombre: it.nombreProducto || it.nombre,
            cantidad: it.cantidad,
            precio: it.precioUnitario || it.precio,
            subtotal: it.subtotal,
          })),
          cliente: p.cliente,
        }));

        setPedidos(pedidosNormalizados);
      } catch (err) {
        console.error("Error al cargar pedidos:", err);
        
        if (err.status === 401) {
          setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        } else {
          setError(err.message || "Error al cargar los pedidos");
        }
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarPedidos();
  }, []);

  // Estado: Usuario no autenticado
  if (!user || !localStorage.getItem("token")) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          <h5 className="alert-heading">Acceso requerido</h5>
          <p className="mb-0">Necesitas iniciar sesión para ver tus pedidos.</p>
          <hr />
          <button 
            className="btn btn-warning"
            onClick={() => navigate("/login")}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // Estado: Cargando
  if (loading) {
    return (
      <div className="container py-5">
        <h3 className="mb-4">Mis Pedidos</h3>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "30vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted">Cargando tus pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Error
  if (error) {
    return (
      <div className="container py-5">
        <h3 className="mb-4">Mis Pedidos</h3>
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Error</h5>
          <p>{error}</p>
          <hr />
          <button 
            className="btn btn-outline-danger me-2"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
          {error.includes("sesión") && (
            <button 
              className="btn btn-danger"
              onClick={() => navigate("/login")}
            >
              Ir a iniciar sesión
            </button>
          )}
        </div>
      </div>
    );
  }

  // Función para obtener el color del badge según el estado
  const getEstadoBadge = (estado) => {
    const estadoLower = (estado || "").toLowerCase();
    switch (estadoLower) {
      case "pendiente":
        return "bg-warning text-dark";
      case "procesado":
      case "procesando":
        return "bg-info";
      case "enviado":
        return "bg-primary";
      case "entregado":
        return "bg-success";
      case "cancelado":
        return "bg-danger";
      case "pagado":
        return "bg-success";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Mis Pedidos</h3>
        <span className="badge bg-secondary">{pedidos.length} pedido(s)</span>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="bi bi-bag-x" style={{ fontSize: "3rem", color: "#ccc" }}></i>
          </div>
          <p className="text-muted fs-5">No tienes pedidos registrados.</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate("/productos")}
          >
            Ver productos
          </button>
        </div>
      ) : (
        <div className="row">
          {pedidos.map((p) => (
            <div key={p.id} className="col-12 mb-3">
              <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Pedido #{p.id}</strong>
                    <small className="text-muted ms-2">
                      {p.fecha ? new Date(p.fecha).toLocaleString("es-CL") : ""}
                    </small>
                  </div>
                  <span className={`badge ${getEstadoBadge(p.estado)}`}>
                    {p.estado || "Pendiente"}
                  </span>
                </div>
                <div className="card-body">
                  {/* Lista de items */}
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th className="text-center">Cantidad</th>
                          <th className="text-end">Precio</th>
                          <th className="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(p.items || []).map((it, idx) => (
                          <tr key={it.id || idx}>
                            <td>{it.nombre || `Producto #${it.productoId}`}</td>
                            <td className="text-center">{it.cantidad}</td>
                            <td className="text-end">
                              ${Number(it.precio || 0).toLocaleString("es-CL")}
                            </td>
                            <td className="text-end">
                              ${Number(it.subtotal || (it.precio * it.cantidad) || 0).toLocaleString("es-CL")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totales */}
                  <div className="d-flex justify-content-end mt-3">
                    <div style={{ minWidth: 200 }}>
                      <div className="d-flex justify-content-between text-muted small">
                        <span>Subtotal:</span>
                        <span>${Number(p.subtotal || 0).toLocaleString("es-CL")}</span>
                      </div>
                      <div className="d-flex justify-content-between text-muted small">
                        <span>IVA (19%):</span>
                        <span>${Number(p.iva || 0).toLocaleString("es-CL")}</span>
                      </div>
                      <div className="d-flex justify-content-between fw-bold border-top pt-1 mt-1">
                        <span>Total:</span>
                        <span>${Number(p.total || 0).toLocaleString("es-CL")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Pedidos;
