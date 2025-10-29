import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminCategoria() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState("");

  //  Proteger ruta - solo admin
  useEffect(() => {
    const sessionRaw = localStorage.getItem("session_user");
    if (!sessionRaw) {
      navigate("/");
      return;
    }
    try {
      const session = JSON.parse(sessionRaw);
      if (session.role !== "admin") {
        navigate("/");
      }
    } catch {
      navigate("/");
    }
  }, [navigate]);

  // Cargar categorías al montar
  useEffect(() => {
    const categoriasGuardadas = localStorage.getItem("categorias_local");
    if (categoriasGuardadas) {
      setCategorias(JSON.parse(categoriasGuardadas));
    } else {
      // Categorías iniciales del sistema
      const categoriasIniciales = [
        "Tortas",
        "Postres",
        "Sin Azúcar",
        "Sin Gluten",
        "Veganas",
        "Especiales",
      ];
      localStorage.setItem(
        "categorias_local",
        JSON.stringify(categoriasIniciales)
      );
      setCategorias(categoriasIniciales);
    }
  }, []);

  // Guardar cambios en localStorage
  const guardarCategorias = (nuevasCategorias) => {
    localStorage.setItem("categorias_local", JSON.stringify(nuevasCategorias));
    setCategorias(nuevasCategorias);
  };

  const handleAgregar = (e) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;

    // Validar que no exista
    if (categorias.includes(nuevaCategoria.trim())) {
      alert("Esta categoría ya existe");
      return;
    }

    const nuevasCategorias = [...categorias, nuevaCategoria.trim()];
    guardarCategorias(nuevasCategorias);
    setNuevaCategoria("");
  };

  const handleEditar = (index) => {
    setEditando(index);
    setEditForm(categorias[index]);
  };

  const handleGuardarEdicion = (index) => {
    if (!editForm.trim()) return;

    // Validar que no exista
    if (
      categorias.includes(editForm.trim()) &&
      editForm.trim() !== categorias[index]
    ) {
      alert("Esta categoría ya existe");
      return;
    }

    const nuevasCategorias = [...categorias];
    nuevasCategorias[index] = editForm.trim();
    guardarCategorias(nuevasCategorias);
    setEditando(null);
  };

  const handleEliminar = (index) => {
    // Verificar si hay productos usando esta categoría
    const pasteleriaProd = JSON.parse(
      localStorage.getItem("pasteles_local") || "[]"
    );
    const categoriaEnUso = pasteleriaProd.some(
      (p) => p.categoria === categorias[index]
    );

    if (categoriaEnUso) {
      alert(
        "No se puede eliminar esta categoría porque hay productos que la utilizan"
      );
      return;
    }

    if (window.confirm("¿Estás seguro de eliminar esta categoría?")) {
      const nuevasCategorias = categorias.filter((_, i) => i !== index);
      guardarCategorias(nuevasCategorias);
    }
  };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12 col-md-8 mx-auto">
          <h2 className="mb-4">Administrar Categorías</h2>

          {/* Formulario para agregar */}
          <form onSubmit={handleAgregar} className="mb-4">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Nueva categoría..."
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Agregar Categoría
              </button>
            </div>
          </form>

          {/* Lista de categorías */}
          <div className="list-group">
            {categorias.map((categoria, index) => (
              <div
                key={index}
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              >
                {editando === index ? (
                  <div className="d-flex gap-2 flex-grow-1">
                    <input
                      type="text"
                      className="form-control"
                      value={editForm}
                      onChange={(e) => setEditForm(e.target.value)}
                      autoFocus
                    />
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleGuardarEdicion(index)}
                    >
                      Guardar
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditando(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-grow-1">{categoria}</span>
                    <div className="btn-group">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => handleEditar(index)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleEliminar(index)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

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
