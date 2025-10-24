// Productos: lista filtrable de pasteles.
// - Lee la query string `search` para filtrar por nombre/descripcion (normalizado sin tildes).
// - Resuelve la URL de la imagen basada en el campo `imagen` del JSON.
import Card from "../components/Card";
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

  // 2) Combinar JSON + Local
  const todosLosPasteles = [...pastelesData, ...pastelesLocales];

  // 3) Resolver imagen y filtrar por search
  const productos = todosLosPasteles
    .map((p) => {
      // Resolver imagen (del JSON tiene ruta relativa, de local puede venir "")
      let imageUrl = "";
      if (p.imagen) {
        const filename = (p.imagen || "").split("/").pop();
        imageUrl = filename
          ? new URL(`../assets/img/${filename}`, import.meta.url).href
          : "";
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
      <h2>Productos</h2>
      <div className="cards-grid mt-3">
        {productos.map((prod) => (
          <Card
            key={prod.id}
            id={prod.id}
            nombre={prod.nombre}
            imagen={prod.imageUrl}
            descripcion={prod.descripcion || `Stock: ${prod.stock ?? "N/A"}`}
            precio={Number(prod.precio)}
          />
        ))}
      </div>
    </div>
  );
}
