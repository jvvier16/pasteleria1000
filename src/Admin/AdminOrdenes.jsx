/**
 * AdminOrdenes
 * Muestra y administra las órdenes desde el backend.
 * - Carga órdenes desde GET /api/v1/boletas
 * - Actualiza estado con PUT /api/v1/boletas/{id}/estado
 * - Elimina con DELETE /api/v1/boletas/{id}
 */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  obtenerTodasLasBoletas,
  actualizarEstadoBoleta,
  eliminarBoleta,
} from "../utils/apiHelper";

export default function AdminOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null); // ID de orden siendo actualizada
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Cargar órdenes del backend
  useEffect(() => {
    // Proteger ruta: solo admin/tester/vendedor
    const sessionRaw = localStorage.getItem("session_user");
    const token = localStorage.getItem("token");

    if (!sessionRaw || !token) {
      navigate("/login");
      return;
    }

    try {
      const s = JSON.parse(sessionRaw);
      const role = (s?.role || "").toLowerCase();
      if (!["admin", "tester", "vendedor"].includes(role)) {
        navigate("/");
        return;
      }
      setCurrentUser(s);
    } catch {
      navigate("/login");
      return;
    }

    // Si venimos desde Perfil, activar filtro "mis pedidos"
    if (location?.state?.fromPerfil) {
      setShowOnlyMine(true);
    }

    cargarOrdenes();
  }, [navigate, location]);

  const cargarOrdenes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await obtenerTodasLasBoletas();
      const ordenesData = response.data || [];

      // Normalizar y ordenar por fecha descendente
      const ordenesNormalizadas = ordenesData
        .map((o) => ({
          id: o.boletaId || o.id,
          fecha: o.fecha,
          estado: o.estado || "pendiente",
          subtotal: o.subTotal || o.subtotal,
          iva: o.iva || o.impuestos,
          total: o.total,
          cliente: o.cliente
            ? {
                id: o.cliente.userId || o.cliente.id,
                nombre: o.cliente.nombre || o.cliente.nombreCompleto,
                correo: o.cliente.correo || o.cliente.email,
              }
            : null,
          items: (o.items || []).map((it) => ({
            id: it.detalleId || it.id,
            productoId: it.productoId,
            nombre: it.nombreProducto || it.nombre,
            cantidad: it.cantidad,
            precio: it.precioUnitario || it.precio,
            subtotal: it.subtotal,
          })),
        }))
        .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

      setOrdenes(ordenesNormalizadas);
    } catch (err) {
      console.error("Error cargando órdenes:", err);
      if (err.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
      } else if (err.status === 403) {
        setError("No tienes permisos para ver las órdenes.");
      } else {
        setError(err.message || "Error al cargar las órdenes");
      }
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    const orden = ordenes.find((o) => o.id === id);
    if (!orden) return;

    if (!window.confirm(`¿Eliminar orden #${id}?`)) return;

    setUpdating(id);
    try {
      await eliminarBoleta(id);
      setOrdenes((prev) => prev.filter((o) => o.id !== id));
      
      // Notificar actualización
      try {
        window.dispatchEvent(new Event("pedidos:updated"));
      } catch {}
    } catch (err) {
      console.error("Error eliminando orden:", err);
      alert(err.message || "Error al eliminar la orden");
    } finally {
      setUpdating(null);
    }
  };

  const handleChangeEstado = async (id, nuevoEstado) => {
    setUpdating(id);
    try {
      await actualizarEstadoBoleta(id, nuevoEstado);
      
      // Actualizar estado local
      setOrdenes((prev) =>
        prev.map((o) => (o.id === id ? { ...o, estado: nuevoEstado } : o))
      );

      // Notificar actualización
      try {
        window.dispatchEvent(new Event("pedidos:updated"));
      } catch {}
    } catch (err) {
      console.error("Error actualizando estado:", err);
      alert(err.message || "Error al actualizar el estado");
    } finally {
      setUpdating(null);
    }
  };

  // Filtrar órdenes
  let filteredOrdenes = ordenes.filter((o) => {
    if (filtro === "todos") return true;
    return (o.estado || "pendiente").toLowerCase() === filtro;
  });

  // Filtrar solo mis pedidos si está activado
  if (showOnlyMine && currentUser) {
    filteredOrdenes = filteredOrdenes.filter(
      (o) =>
        o.cliente &&
        (String(o.cliente.id) === String(currentUser.id) ||
          o.cliente.correo === currentUser.correo)
    );
  }

  // Obtener badge de estado
  const getEstadoBadge = (estado) => {
    const estadoLower = (estado || "pendiente").toLowerCase();
    switch (estadoLower) {
      case "pendiente":
        return "bg-warning text-dark";
      case "procesado":
      case "procesando":
        return "bg-primary";
      case "enviado":
        return "bg-success";
      case "entregado":
        return "bg-info";
      case "cancelado":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="container py-4">
        <h3 className="mb-4">Órdenes</h3>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "40vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted">Cargando órdenes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="container py-4">
        <h3 className="mb-4">Órdenes</h3>
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Error</h5>
          <p>{error}</p>
          <hr />
          <button className="btn btn-outline-danger me-2" onClick={cargarOrdenes}>
            Reintentar
          </button>
          {error.includes("sesión") && (
            <button className="btn btn-danger" onClick={() => navigate("/login")}>
              Ir a iniciar sesión
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h3 className="mb-0">
          Órdenes <small className="text-muted">({ordenes.length})</small>
        </h3>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <div className="d-flex align-items-center">
            <label className="mb-0 small text-muted me-2">Filtrar:</label>
            <select
              className="form-select form-select-sm"
              style={{ width: 160 }}
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="procesado">Procesados</option>
              <option value="enviado">Enviados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowOnlyMine((s) => !s)}
          >
            {showOnlyMine ? "Ver todos" : "Ver solo mis pedidos"}
          </button>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={cargarOrdenes}
            disabled={loading}
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {filteredOrdenes.length === 0 ? (
        <div className="alert alert-info">
          {filtro !== "todos"
            ? `No hay órdenes con estado "${filtro}"`
            : showOnlyMine
            ? "No tienes órdenes registradas"
            : "No hay órdenes registradas"}
        </div>
      ) : (
        filteredOrdenes.map((o) => (
          <div key={o.id} className="card mb-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <h5 className="mb-1">Pedido #{o.id}</h5>
                  <small className="text-muted">
                    {o.fecha ? new Date(o.fecha).toLocaleString("es-CL") : "Sin fecha"}
                  </small>
                  <div className="mt-1">
                    <strong>Cliente:</strong>{" "}
                    {o.cliente?.nombre || "Anónimo"}
                    {o.cliente?.correo && (
                      <span className="text-muted"> — {o.cliente.correo}</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className={`badge ${getEstadoBadge(o.estado)}`}>
                      {(o.estado || "pendiente").toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-muted small">
                    Subtotal: ${Number(o.subtotal || 0).toLocaleString("es-CL")}
                  </div>
                  <div className="text-muted small">
                    IVA: ${Number(o.iva || 0).toLocaleString("es-CL")}
                  </div>
                  <h5 className="mb-0 mt-1">
                    Total: ${Number(o.total || 0).toLocaleString("es-CL")}
                  </h5>
                </div>
              </div>

              <hr />

              {/* Lista de items */}
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="text-center">Cant.</th>
                      <th className="text-end">Precio</th>
                      <th className="text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(o.items || []).map((it, i) => (
                      <tr key={it.id || i}>
                        <td>{it.nombre || `Producto #${it.productoId}`}</td>
                        <td className="text-center">{it.cantidad}</td>
                        <td className="text-end">
                          ${Number(it.precio || 0).toLocaleString("es-CL")}
                        </td>
                        <td className="text-end">
                          ${Number(it.subtotal || it.precio * it.cantidad || 0).toLocaleString("es-CL")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botones de acciones */}
              <div className="d-flex justify-content-end gap-2 mt-3 flex-wrap">
                <div className="btn-group" role="group">
                  {o.estado?.toLowerCase() !== "procesado" && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleChangeEstado(o.id, "procesado")}
                      disabled={updating === o.id}
                    >
                      {updating === o.id ? "..." : "Marcar procesado"}
                    </button>
                  )}
                  {o.estado?.toLowerCase() !== "enviado" && (
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleChangeEstado(o.id, "enviado")}
                      disabled={updating === o.id}
                    >
                      {updating === o.id ? "..." : "Marcar enviado"}
                    </button>
                  )}
                  {o.estado?.toLowerCase() !== "cancelado" && (
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => handleChangeEstado(o.id, "cancelado")}
                      disabled={updating === o.id}
                    >
                      {updating === o.id ? "..." : "Cancelar"}
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleEliminar(o.id)}
                    disabled={updating === o.id}
                  >
                    {updating === o.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
