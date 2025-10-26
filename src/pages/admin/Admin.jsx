/**
 * Componente: Panel de Administración
 *
 * Este componente implementa el panel de administración principal de la pastelería.
 * Proporciona funcionalidades para:
 * - Gestión de productos (CRUD)
 * - Persistencia de datos en localStorage
 * - Manejo de autenticación y autorización
 * - Interfaz de usuario intuitiva
 */

import React, { useState, useEffect } from "react";

export default function Admin() {
  /**
   * Estados del componente:
   * - showProductForm: Controla la visibilidad del formulario de productos
   * - productos: Lista de productos cargados desde localStorage
   * - formData: Datos del formulario de creación/edición
   */
  const [showProductForm, setShowProductForm] = useState(false);
  const [productos, setProductos] = useState([]);
  const [formData, setFormData] = useState({ nombre: "", precio: "" });

  /**
   * Verificación de autorización
   * Comprueba si el usuario actual tiene permisos de administrador
  const checkAdmin = () => {
    try {
      const sessionRaw = localStorage.getItem("session_user");
      if (!sessionRaw) return false;

      const session = JSON.parse(sessionRaw);
      return session.role === "admin";
    } catch {
      return false;
    }
  };

  /**
   * Efecto de carga inicial
   * - Carga los productos desde localStorage al montar el componente
   * - Maneja errores de datos corruptos
   * - Asegura que productos siempre sea un array
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pasteles_local");
      if (saved) {
        const parsed = JSON.parse(saved);
        setProductos(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setProductos([]);
    }
  }, []);

  // Si no es admin, mostrar mensaje de no autorizado
  if (!checkAdmin()) {
    return <div className="container py-4">No autorizado</div>;
  }

  /**
   * Manejador de guardado de productos
   * @param {Event} e - Evento del formulario
   *
   * Flujo:
   * 1. Previene el envío del formulario
   * 2. Recupera productos existentes
   * 3. Crea nuevo producto con ID único
   * 4. Actualiza localStorage y estado
   * 5. Limpia y cierra el formulario
   */
  const handleSaveProduct = (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem("pasteles_local");
      const existing = saved ? JSON.parse(saved) : [];
      const newProduct = {
        ...formData,
        id: Date.now(),
        precio: Number(formData.precio),
        categoria: "Tortas",
      };
      const updated = [...existing, newProduct];
      localStorage.setItem("pasteles_local", JSON.stringify(updated));
      setProductos(updated);
      setShowProductForm(false);
      setFormData({ nombre: "", precio: "" });
    } catch (err) {
      console.error("Error al guardar:", err);
    }
  };

  /**
   * Manejador de eliminación de productos
   * @param {number} id - ID del producto a eliminar
   *
   * Flujo:
   * 1. Filtra el producto seleccionado
   * 2. Actualiza localStorage
   * 3. Actualiza el estado local
   * 4. Maneja errores si ocurren
   */
  const handleDeleteProduct = (id) => {
    try {
      const updated = productos.filter((p) => p.id !== id);
      localStorage.setItem("pasteles_local", JSON.stringify(updated));
      setProductos(updated);
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  };

  // Si es admin, mostrar el dashboard
  return (
    <div className="container py-4">
      <h2>Panel de Administración</h2>
      <div className="row mt-4">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-body">
              <h3>Gestión de productos</h3>
              {!showProductForm ? (
                <>
                  <button
                    className="btn btn-primary mb-3"
                    onClick={() => setShowProductForm(true)}
                  >
                    Nuevo producto
                  </button>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Precio</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productos.map((p) => (
                          <tr key={p.id}>
                            <td>{p.nombre}</td>
                            <td>${p.precio}</td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteProduct(p.id)}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveProduct}>
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      className="form-control"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, nombre: e.target.value }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Precio</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.precio}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, precio: e.target.value }))
                      }
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowProductForm(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
