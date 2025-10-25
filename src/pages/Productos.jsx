// Productos: lista filtrable de pasteles.
// - Lee la query string `search` para filtrar por nombre/descripcion (normalizado sin tildes).
// - Resuelve la URL de la imagen basada en el campo `imagen` del JSON.
import Card from "../components/Card";
import { addToCart as addToCartHelper } from "../utils/localstorageHelper";
import pastelesData from "../data/Pasteles.json";
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

  // 1) Leer pasteles creados en localStorage
  const localRaw = localStorage.getItem("pasteles_local");
  let pastelesLocales = [];
  try {
    pastelesLocales = localRaw ? JSON.parse(localRaw) : [];
  } catch {
    pastelesLocales = [];
  }

  // 2) Combinar JSON + LocalStorage sin duplicados.
  // - Queremos mostrar todos los productos (los 20 del JSON) pero permitir
  //   que los pasteles locales reemplacen/actualicen a los del JSON cuando
  //   compartan el mismo `id` (por ejemplo, tras editar/crear desde Admin).
  // - Evita concatenar indiscriminadamente y producir duplicados con los
  //   mismos ids.
  const mapa = new Map();
  // primero cargar JSON (base)
  for (const p of pastelesData) mapa.set(p.id, p);
  // luego sobreescribir/añadir locales
  for (const p of pastelesLocales || []) mapa.set(p.id, p);
  const todosLosPasteles = Array.from(mapa.values());

  // 3) Resolver imagen y filtrar por search
  const productos = todosLosPasteles
    .map((p) => {
      // Resolver imagen (usando ruta relativa del JSON o ruta completa de local)
      let imageUrl = "";
      if (p.imagen) {
        // Si la imagen ya es una URL completa (ej: data:image/... o http://) usarla directamente
        if (p.imagen.startsWith("data:") || p.imagen.startsWith("http")) {
          imageUrl = p.imagen;
        } else {
          // Si es ruta relativa, resolverla usando la estructura del proyecto
          const filename = p.imagen.split("/").pop();
          imageUrl = filename
            ? new URL(`../assets/img/${filename}`, import.meta.url).href
            : "";
        }
      }
      return { ...p, imageUrl };
    })
    .filter((p) => {
      if (!search) return true;
      const hay = normalize(`${p.nombre || ""} ${p.descripcion || ""}`);
      return hay.includes(search);
    });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
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
        {productos.map((prod) => (
          <Card
            key={prod.id}
            id={prod.id}
            nombre={prod.nombre}
            imagen={prod.imageUrl}
            // ocultar la descripción en el listado pero mantener la info de stock en data
            hideDescription={true}
            descripcion={prod.descripcion || `Stock: ${prod.stock ?? "N/A"}`}
            stock={prod.stock ?? 0}
            stockCritico={prod.stockCritico}
            precio={Number(prod.precio)}
            onAgregar={(p) =>
              addToCartHelper({
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
