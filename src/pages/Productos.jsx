import React from "react";
import Card from "../components/Card";
import pasteles from "../data/Pasteles.json";
import { useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function Productos() {
  const query = useQuery();
  const search = (query.get("search") || "").trim().toLowerCase();

  // Resolver la URL de las imágenes listadas en pasteles.json
  const productos = pasteles
    .map((p) => {
      const filename = p.imagen.split("/").pop();
      const imageUrl = new URL(`../assets/img/${filename}`, import.meta.url)
        .href;
      return { ...p, imageUrl };
    })
    .filter((p) => {
      if (!search) return true;
      const hay = `${p.nombre || ""} ${p.descripcion || ""}`.toLowerCase();
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

export default Productos;
