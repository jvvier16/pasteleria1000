/**
 * Productos: lista filtrable de pasteles desde el backend.
 * - Lee la query string `search` para filtrar por nombre/descripcion.
 * - Consume GET /api/v2/productos del backend.
 * - Maneja estados de carga y errores.
 */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Card from "../components/Card";
import { CarritoService } from "../services/dataService";
import { obtenerProductos, buscarProductos } from "../utils/apiHelper";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const normalize = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export default function Productos() {
  const query = useQuery();
  const search = query.get("search") || "";
  const searchNormalized = normalize(search);

  // Estados para productos, carga y errores
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar productos del backend
  useEffect(() => {
    const cargarProductos = async () => {
      setLoading(true);
      setError(null);

      try {
        let response;
        
        // Si hay búsqueda, usar el endpoint de búsqueda
        if (search.trim()) {
          response = await buscarProductos(search.trim());
        } else {
          response = await obtenerProductos();
        }

        // El backend devuelve: { status, message, data: [...productos] }
        const productosData = response.data || [];
        
        // Mapear productos con URL de imagen resuelta
        const productosConImagen = productosData.map((p) => ({
          ...p,
          // Usar productoId del backend o id como fallback
          id: p.productoId || p.id,
          imageUrl: resolveImageUrl(p.imagen),
        }));

        setProductos(productosConImagen);
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setError(err.message || "Error al cargar los productos");
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, [search]);

  // Resolver imagen para cada producto
  const resolveImageUrl = (imagen) => {
    if (!imagen) return "";
    if (imagen.startsWith("data:") || imagen.startsWith("http")) return imagen;
    const filename = imagen.split("/").pop();
    return filename
      ? new URL(`../assets/img/${filename}`, import.meta.url).href
      : "";
  };

  // Filtro adicional local (por si el backend no filtra exactamente)
  const productosFiltrados = searchNormalized
    ? productos.filter((p) => {
        const nombre = normalize(p.nombre);
        const descripcion = normalize(p.descripcion);
        return nombre.includes(searchNormalized) || descripcion.includes(searchNormalized);
      })
    : productos;

  // Estado de carga
  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error al cargar productos</h4>
          <p>{error}</p>
          <hr />
          <button 
            className="btn btn-outline-danger"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4 reveal slide-up">
        <h2>Productos</h2>
        {search && (
          <div className="d-flex align-items-center">
            <span className="me-2">
              Resultados para: <strong>{search}</strong>
              {productosFiltrados.length > 0 && (
                <span className="text-muted ms-2">
                  ({productosFiltrados.length} encontrados)
                </span>
              )}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => (window.location.href = "/productos")}
            >
              ✕ Limpiar búsqueda
            </button>
          </div>
        )}
      </div>

      {productosFiltrados.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted fs-5">
            {search 
              ? `No se encontraron productos para "${search}"` 
              : "No hay productos disponibles"}
          </p>
          {search && (
            <button
              className="btn btn-primary mt-3"
              onClick={() => (window.location.href = "/productos")}
            >
              Ver todos los productos
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid mt-3">
          {productosFiltrados.map((prod) => (
            <Card
              key={prod.id}
              id={prod.id}
              nombre={prod.nombre}
              imagen={prod.imageUrl}
              hideDescription={true}
              descripcion={prod.descripcion || `Stock: ${prod.stock ?? "N/A"}`}
              stock={prod.stock ?? 0}
              stockCritico={prod.stockCritico}
              showStockCritical={false}
              precio={Number(prod.precio)}
              onAgregar={() =>
                CarritoService.addItem({
                  id: prod.id,
                  nombre: prod.nombre,
                  precio: Number(prod.precio),
                  imagen: prod.imageUrl,
                  cantidad: 1,
                  stock: prod.stock,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
