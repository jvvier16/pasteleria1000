// Productos: lista filtrable de pasteles.
// - Lee la query string `search` para filtrar por nombre/descripcion (normalizado sin tildes).
// - Resuelve la URL de la imagen basada en el campo `imagen` del JSON.
import Card from "../components/Card";
import { CarritoService } from "../services/dataService";
import { usePasteles } from "../hooks/usePasteles";
import { useLocation } from "react-router-dom";

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
  const search = normalize(query.get("search") || "");

  // Usar hook para obtener pasteles
  const { pasteles } = usePasteles(search || "")

  // Resolver imagen para cada pastel
  const resolveImageUrl = (imagen) => {
    if (!imagen) return ""
    if (imagen.startsWith("data:") || imagen.startsWith("http")) return imagen
    const filename = imagen.split("/").pop()
    return filename ? new URL(`../assets/img/${filename}`, import.meta.url).href : ""
  }

  // Mapear pasteles con URL de imagen resuelta
  const productos = pasteles.map((p) => ({
    ...p,
    imageUrl: resolveImageUrl(p.imagen),
  }))

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4 reveal slide-up">
        <h2>Productos</h2>
        {search && (
          <div className="d-flex align-items-center">
            <span className="me-2">
              Resultados para: <strong>{query.get("search")}</strong>
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
      <div className="cards-grid mt-3">
        {productos.map((prod, i) => (
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
            onAgregar={(p) =>
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
    </div>
  );
}
