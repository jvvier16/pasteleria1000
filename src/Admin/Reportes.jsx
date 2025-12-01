/**
 * AdminReportes
 * Dashboard de estadísticas y reportes del negocio.
 * - Carga estadísticas desde GET /api/v1/estadisticas
 * - Carga reportes de ventas desde GET /api/v1/reportes/ventas
 * - Requiere JWT (admin/tester)
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerEstadisticas, obtenerReporteVentas } from "../utils/apiHelper";

export default function AdminReportes() {
  const navigate = useNavigate();

  // Estados principales
  const [estadisticas, setEstadisticas] = useState(null);
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros de fecha para reporte
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // 🔐 Proteger ruta - solo admin/tester
  useEffect(() => {
    const sessionRaw = localStorage.getItem("session_user");
    const token = localStorage.getItem("token");

    if (!sessionRaw || !token) {
      navigate("/login");
      return;
    }

    try {
      const session = JSON.parse(sessionRaw);
      const role = (session?.role || "").toLowerCase();
      if (!["admin", "tester"].includes(role)) {
        navigate("/");
        return;
      }
    } catch {
      navigate("/login");
      return;
    }

    cargarDatos();
  }, [navigate]);

  // Cargar estadísticas y reporte
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar estadísticas generales
      const statsResponse = await obtenerEstadisticas();
      // El backend devuelve: { status: 200, mensaje: "...", data: {...} }
      // Verificar que haya data (status 200 o que simplemente exista data)
      if (statsResponse && statsResponse.data) {
        setEstadisticas(statsResponse.data);
      } else if (statsResponse && !statsResponse.data && (statsResponse.status >= 400 || statsResponse.mensaje)) {
        throw new Error(statsResponse.mensaje || statsResponse.message || "Error al cargar estadísticas");
      }

      // Cargar reporte de ventas
      const reporteResponse = await obtenerReporteVentas(fechaInicio || null, fechaFin || null);
      if (reporteResponse && reporteResponse.data) {
        setReporte(reporteResponse.data);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      // Verificar tipo de error
      const errorStatus = err.status || err.statusCode;
      const errorMessage = err.message || err.mensaje || err.error;
      
      if (errorStatus === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
      } else if (errorStatus === 403) {
        setError("No tienes permisos para acceder a esta información. Necesitas ser Admin o Tester.");
      } else if (errorStatus === 404) {
        setError("Endpoint no encontrado. Verifica que el backend esté actualizado.");
      } else if (errorMessage) {
        setError(`Error: ${errorMessage}`);
      } else {
        setError("Error al cargar los datos. Verifica la consola del navegador para más detalles.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrar reporte por fechas
  const handleFiltrarReporte = async (e) => {
    e.preventDefault();
    try {
      const reporteResponse = await obtenerReporteVentas(fechaInicio || null, fechaFin || null);
      if (reporteResponse && reporteResponse.data) {
        setReporte(reporteResponse.data);
      }
    } catch (err) {
      console.error("Error filtrando reporte:", err);
      alert(err.message || err.mensaje || "Error al filtrar el reporte");
    }
  };

  // Formatear moneda
  const formatCurrency = (value) => {
    const num = typeof value === "number" ? value : parseFloat(value) || 0;
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-CL");
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="container py-4">
        <h3 className="mb-4">Reportes y Estadísticas</h3>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "40vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="container py-4">
        <h3 className="mb-4">Reportes y Estadísticas</h3>
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Error</h5>
          <p>{error}</p>
          <hr />
          <button className="btn btn-outline-danger me-2" onClick={cargarDatos}>
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Reportes y Estadísticas</h3>
        <button className="btn btn-outline-primary btn-sm" onClick={cargarDatos}>
          ↻ Actualizar
        </button>
      </div>

      {/* Tarjetas de estadísticas principales */}
      {estadisticas && (
        <>
          <div className="row g-3 mb-4">
            {/* Ventas Totales */}
            <div className="col-6 col-md-3">
              <div className="card bg-success text-white h-100">
                <div className="card-body">
                  <h6 className="card-subtitle mb-1 opacity-75">Ventas Totales</h6>
                  <h4 className="card-title mb-0">{formatCurrency(estadisticas.ventasTotales)}</h4>
                </div>
              </div>
            </div>

            {/* Total Pedidos */}
            <div className="col-6 col-md-3">
              <div className="card bg-primary text-white h-100">
                <div className="card-body">
                  <h6 className="card-subtitle mb-1 opacity-75">Total Pedidos</h6>
                  <h4 className="card-title mb-0">{estadisticas.totalBoletas || 0}</h4>
                </div>
              </div>
            </div>

            {/* Total Productos */}
            <div className="col-6 col-md-3">
              <div className="card bg-info text-white h-100">
                <div className="card-body">
                  <h6 className="card-subtitle mb-1 opacity-75">Productos</h6>
                  <h4 className="card-title mb-0">{estadisticas.totalProductos || 0}</h4>
                </div>
              </div>
            </div>

            {/* Total Usuarios */}
            <div className="col-6 col-md-3">
              <div className="card bg-secondary text-white h-100">
                <div className="card-body">
                  <h6 className="card-subtitle mb-1 opacity-75">Usuarios</h6>
                  <h4 className="card-title mb-0">{estadisticas.totalUsuarios || 0}</h4>
                </div>
              </div>
            </div>
          </div>

          {/* Segunda fila de estadísticas */}
          <div className="row g-3 mb-4">
            {/* Pedidos Pendientes */}
            <div className="col-6 col-md-3">
              <div className="card border-warning h-100">
                <div className="card-body">
                  <h6 className="card-subtitle mb-1 text-muted">Pendientes</h6>
                  <h4 className="card-title mb-0 text-warning">{estadisticas.boletasPendientes || 0}</h4>
                </div>
              </div>
            </div>

            {/* Pedidos Procesados */}
            <div className="col-6 col-md-3">
              <div className="card border-info h-100">
                <div className="card-body">
                  <h6 className="card-subtitle mb-1 text-muted">Procesados</h6>
                  <h4 className="card-title mb-0 text-info">{estadisticas.boletasProcesadas || 0}</h4>
                </div>
              </div>
            </div>

            {/* Pedidos Enviados */}
            <div className="col-6 col-md-3">
              <div className="card border-success h-100">
                <div className="card-body">
                  <h6 className="card-subtitle mb-1 text-muted">Enviados</h6>
                  <h4 className="card-title mb-0 text-success">{estadisticas.boletasEnviadas || 0}</h4>
                </div>
              </div>
            </div>

            {/* Stock Crítico */}
            <div className="col-6 col-md-3">
              <div className={`card h-100 ${estadisticas.productosStockCritico > 0 ? 'border-danger' : 'border-secondary'}`}>
                <div className="card-body">
                  <h6 className="card-subtitle mb-1 text-muted">Stock Crítico</h6>
                  <h4 className={`card-title mb-0 ${estadisticas.productosStockCritico > 0 ? 'text-danger' : 'text-secondary'}`}>
                    {estadisticas.productosStockCritico || 0}
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* Inventario y Categorías */}
          <div className="row g-3 mb-4">
            <div className="col-6">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h6 className="text-muted">Inventario Total</h6>
                  <h3>{estadisticas.inventarioTotal || 0} unidades</h3>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h6 className="text-muted">Categorías</h6>
                  <h3>{estadisticas.totalCategorias || 0}</h3>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sección de Reporte de Ventas */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Reporte de Ventas</h5>
        </div>
        <div className="card-body">
          {/* Filtros de fecha */}
          <form onSubmit={handleFiltrarReporte} className="row g-2 mb-4">
            <div className="col-auto">
              <label className="visually-hidden">Fecha inicio</label>
              <input
                type="date"
                className="form-control"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                placeholder="Fecha inicio"
              />
            </div>
            <div className="col-auto">
              <label className="visually-hidden">Fecha fin</label>
              <input
                type="date"
                className="form-control"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                placeholder="Fecha fin"
              />
            </div>
            <div className="col-auto">
              <button type="submit" className="btn btn-primary">
                Filtrar
              </button>
            </div>
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFechaInicio("");
                  setFechaFin("");
                  cargarDatos();
                }}
              >
                Limpiar
              </button>
            </div>
          </form>

          {reporte && (
            <>
              {/* Resumen del período */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="p-3 bg-light rounded">
                    <small className="text-muted">Período</small>
                    <p className="mb-0 fw-bold">
                      {formatDate(reporte.fechaInicio)} - {formatDate(reporte.fechaFin)}
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 bg-light rounded">
                    <small className="text-muted">Órdenes en período</small>
                    <p className="mb-0 fw-bold">{reporte.totalOrdenes || 0}</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 bg-light rounded">
                    <small className="text-muted">Promedio por venta</small>
                    <p className="mb-0 fw-bold">{formatCurrency(reporte.promedioVenta)}</p>
                  </div>
                </div>
              </div>

              {/* Productos más vendidos */}
              {reporte.productosMasVendidos && reporte.productosMasVendidos.length > 0 && (
                <div className="mb-4">
                  <h6 className="mb-3">🏆 Productos más vendidos</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-striped">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Producto</th>
                          <th className="text-end">Cantidad</th>
                          <th className="text-end">Total Ventas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporte.productosMasVendidos.map((prod, index) => (
                          <tr key={prod.productoId}>
                            <td>{index + 1}</td>
                            <td>{prod.nombreProducto}</td>
                            <td className="text-end">{prod.cantidadVendida}</td>
                            <td className="text-end">{formatCurrency(prod.totalVentas)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ventas por día */}
              {reporte.ventasPorDia && reporte.ventasPorDia.length > 0 && (
                <div>
                  <h6 className="mb-3">📅 Ventas por día</h6>
                  <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <table className="table table-sm">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th>Fecha</th>
                          <th className="text-end">Órdenes</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporte.ventasPorDia.map((dia) => (
                          <tr key={dia.fecha}>
                            <td>{formatDate(dia.fecha)}</td>
                            <td className="text-end">{dia.totalOrdenes}</td>
                            <td className="text-end">{formatCurrency(dia.totalVentas)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mensaje si no hay datos */}
              {(!reporte.ventasPorDia || reporte.ventasPorDia.length === 0) &&
                (!reporte.productosMasVendidos || reporte.productosMasVendidos.length === 0) && (
                  <div className="alert alert-info">
                    No hay datos de ventas para el período seleccionado.
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* Notas */}
      <div className="alert alert-light border">
        <h6>ℹ️ Información</h6>
        <ul className="mb-0 small">
          <li>Las estadísticas se actualizan en tiempo real desde el servidor</li>
          <li>El reporte de ventas muestra los últimos 30 días por defecto</li>
          <li>Los productos en stock crítico tienen menos de 5 unidades</li>
        </ul>
      </div>
    </div>
  );
}
