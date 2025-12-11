/**
 * AdminCategoria
 * Gestión de categorías conectada al backend.
 * Soporta autenticación por JWT Token o API Key.
 * 
 * - Carga categorías desde GET /api/v2/categorias
 * - Crear con POST /api/v1/categorias
 * - Editar con PUT /api/v1/categorias
 * - Eliminar con DELETE /api/v1/categorias/{id}
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  hasApiKey,
  hasToken,
  setApiKey,
  getCurrentApiKey,
  clearApiKey,
} from "../utils/apiHelper";

export default function AdminCategoria() {
  const navigate = useNavigate();
  
  // Estados principales
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Estados para formularios
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: "", descripcion: "" });
  
  // Estados para API Key
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [usingApiKey, setUsingApiKey] = useState(false);

  // 🔐 Verificar autenticación (Token o API Key)
  useEffect(() => {
    const sessionRaw = localStorage.getItem("session_user");
    const token = localStorage.getItem("token");
    const apiKey = getCurrentApiKey();

    // Si hay API Key configurada, usarla
    if (apiKey) {
      setUsingApiKey(true);
      cargarCategorias();
      return;
    }

    // Si no hay token ni API Key, mostrar opciones
    if (!token) {
      setShowApiKeyForm(true);
      setLoading(false);
      return;
    }

    // Si hay token, verificar rol
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        const role = (session?.role || "").toLowerCase();
        if (!["admin", "tester"].includes(role)) {
          navigate("/");
          return;
        }
      } catch {
        setShowApiKeyForm(true);
        setLoading(false);
        return;
      }
    }

    cargarCategorias();
  }, [navigate]);

  // Configurar API Key
  const handleSetApiKey = (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    
    setApiKey(apiKeyInput.trim());
    setUsingApiKey(true);
    setShowApiKeyForm(false);
    setApiKeyInput("");
    cargarCategorias();
  };

  // Limpiar API Key
  const handleClearApiKey = () => {
    clearApiKey();
    setUsingApiKey(false);
    setCategorias([]);
    setShowApiKeyForm(true);
  };

  // Cargar categorías del backend
  const cargarCategorias = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await obtenerCategorias();
      const categoriasData = (response.data || []).map((c) => ({
        id: c.categoriaId || c.id,
        nombre: c.nombre,
        descripcion: c.descripcion || "",
      }));

      setCategorias(categoriasData);
    } catch (err) {
      console.error("Error cargando categorías:", err);
      if (err.status === 401) {
        setError("Sesión expirada o API Key inválida. Por favor, autentícate nuevamente.");
      } else if (err.status === 403) {
        setError("No tienes permisos para acceder a este recurso.");
      } else {
        setError(err.message || "Error al cargar las categorías");
      }
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  // Agregar nueva categoría
  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;

    // Validar que no exista
    const existe = categorias.some(
      (c) => c.nombre.toLowerCase() === nuevaCategoria.trim().toLowerCase()
    );
    if (existe) {
      alert("Esta categoría ya existe");
      return;
    }

    setSaving(true);
    try {
      await crearCategoria({
        nombre: nuevaCategoria.trim(),
      });

      setNuevaCategoria("");
      await cargarCategorias();
      
    } catch (err) {
      console.error("Error creando categoría:", err);
      if (err.status === 401 || err.status === 403) {
        alert("No tienes permisos para crear categorías. Verifica tu autenticación.");
      } else {
        alert(err.message || "Error al crear la categoría");
      }
    } finally {
      setSaving(false);
    }
  };

  // Iniciar edición
  const handleEditar = (categoria) => {
    setEditando(categoria.id);
    setEditForm({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
    });
  };

  // Guardar edición
  const handleGuardarEdicion = async () => {
    if (!editForm.nombre.trim()) return;

    // Validar que no exista otro con el mismo nombre
    const existe = categorias.some(
      (c) =>
        c.id !== editando &&
        c.nombre.toLowerCase() === editForm.nombre.trim().toLowerCase()
    );
    if (existe) {
      alert("Ya existe una categoría con ese nombre");
      return;
    }

    setSaving(true);
    try {
      await actualizarCategoria({
        categoriaId: editando,
        nombre: editForm.nombre.trim(),
        descripcion: editForm.descripcion?.trim() || "",
      });

      setEditando(null);
      await cargarCategorias();
      
    } catch (err) {
      console.error("Error actualizando categoría:", err);
      if (err.status === 401 || err.status === 403) {
        alert("No tienes permisos para editar categorías. Verifica tu autenticación.");
      } else {
        alert(err.message || "Error al actualizar la categoría");
      }
    } finally {
      setSaving(false);
    }
  };

  // Eliminar categoría
  const handleEliminar = async (categoria) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }

    setSaving(true);
    try {
      await eliminarCategoria(categoria.id);
      setCategorias((prev) => prev.filter((c) => c.id !== categoria.id));
      
    } catch (err) {
      console.error("Error eliminando categoría:", err);
      
      // El backend puede rechazar si hay productos usando la categoría
      if (err.message?.includes("productos") || err.status === 400) {
        alert("No se puede eliminar esta categoría porque hay productos que la utilizan");
      } else if (err.status === 401 || err.status === 403) {
        alert("No tienes permisos para eliminar categorías. Verifica tu autenticación.");
      } else {
        alert(err.message || "Error al eliminar la categoría");
      }
    } finally {
      setSaving(false);
    }
  };

  // Formulario para ingresar API Key (si no hay autenticación)
  if (showApiKeyForm && !usingApiKey && !hasToken()) {
    return (
      <div className="container py-4">
        <div className="row">
          <div className="col-12 col-md-6 mx-auto">
            <h2 className="mb-4">Administrar Categorías</h2>
            <div className="card">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0">🔐 Autenticación requerida</h5>
              </div>
              <div className="card-body">
                <p>Para administrar categorías necesitas estar autenticado.</p>
                
                <div className="d-grid gap-2 mb-4">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate("/login")}
                  >
                    Iniciar sesión con cuenta
                  </button>
                </div>
                
                <hr />
                
                <p className="text-muted small">
                  <strong>Alternativa:</strong> Si tienes una API Key, puedes usarla aquí:
                </p>
                
                <form onSubmit={handleSetApiKey}>
                  <div className="input-group mb-3">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Ingresa tu API Key..."
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      className="btn btn-outline-secondary"
                      disabled={!apiKeyInput.trim()}
                    >
                      Usar API Key
                    </button>
                  </div>
                </form>
                
                <div className="alert alert-light small mb-0">
                  <strong>API Keys disponibles:</strong>
                  <ul className="mb-0 mt-2">
                    <li><code>CLAVE_SUPER_SECRETA_123</code> (Admin)</li>
                    <li><code>TESTER_KEY_123</code> (Tester)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="container py-4">
        <div className="row">
          <div className="col-12 col-md-8 mx-auto">
            <h2 className="mb-4">Administrar Categorías</h2>
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "30vh" }}>
              <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted">Cargando categorías...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="container py-4">
        <div className="row">
          <div className="col-12 col-md-8 mx-auto">
            <h2 className="mb-4">Administrar Categorías</h2>
            <div className="alert alert-danger" role="alert">
              <h5 className="alert-heading">Error</h5>
              <p>{error}</p>
              <hr />
              <button className="btn btn-outline-danger me-2" onClick={cargarCategorias}>
                Reintentar
              </button>
              {usingApiKey && (
                <button className="btn btn-outline-secondary me-2" onClick={handleClearApiKey}>
                  Cambiar API Key
                </button>
              )}
              <button className="btn btn-danger" onClick={() => navigate("/login")}>
                Ir a iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12 col-md-8 mx-auto">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              Administrar Categorías{" "}
              <small className="text-muted">({categorias.length})</small>
            </h2>
            <div className="d-flex gap-2">
              {usingApiKey && (
                <button
                  className="btn btn-outline-warning btn-sm"
                  onClick={handleClearApiKey}
                  title="Cambiar método de autenticación"
                >
                  🔑 API Key
                </button>
              )}
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={cargarCategorias}
                disabled={saving}
              >
                ↻ Actualizar
              </button>
            </div>
          </div>

          {/* Indicador de API Key */}
          {usingApiKey && (
            <div className="alert alert-info py-2 small mb-3">
              <strong>🔑 Usando API Key</strong> - Autenticado mediante API Key
            </div>
          )}

          {/* Formulario para agregar */}
          <form onSubmit={handleAgregar} className="mb-4">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Nueva categoría..."
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                disabled={saving}
              />
              <button type="submit" className="btn btn-primary" disabled={saving || !nuevaCategoria.trim()}>
                {saving ? "Agregando..." : "Agregar Categoría"}
              </button>
            </div>
          </form>

          {/* Lista de categorías */}
          {categorias.length === 0 ? (
            <div className="alert alert-info">
              No hay categorías registradas. ¡Crea la primera!
            </div>
          ) : (
            <div className="list-group">
              {categorias.map((categoria) => (
                <div
                  key={categoria.id}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                >
                  {editando === categoria.id ? (
                    <div className="d-flex gap-2 flex-grow-1 flex-wrap">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre"
                        value={editForm.nombre}
                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                        autoFocus
                        disabled={saving}
                        style={{ minWidth: 150, flex: 1 }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Descripción (opcional)"
                        value={editForm.descripcion}
                        onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                        disabled={saving}
                        style={{ minWidth: 150, flex: 2 }}
                      />
                      <div className="btn-group">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={handleGuardarEdicion}
                          disabled={saving || !editForm.nombre.trim()}
                        >
                          {saving ? "..." : "Guardar"}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditando(null)}
                          disabled={saving}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-grow-1">
                        <strong>{categoria.nombre}</strong>
                        {categoria.descripcion && (
                          <small className="text-muted d-block">{categoria.descripcion}</small>
                        )}
                      </div>
                      <div className="btn-group">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleEditar(categoria)}
                          disabled={saving}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleEliminar(categoria)}
                          disabled={saving}
                        >
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ayuda */}
          <div className="alert alert-info mt-4">
            <h5>Notas importantes:</h5>
            <ul className="mb-0">
              <li>
                No se pueden eliminar categorías que estén en uso por productos
              </li>
              <li>Los nombres de categorías deben ser únicos</li>
              <li>
                Los cambios afectarán a la navegación y filtros de la tienda
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
