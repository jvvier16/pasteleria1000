import React, { useMemo, useState } from "react";
import Card from "../components/Card";
import pasteles from "../data/Pasteles.json";
import { useLocation } from "react-router-dom";
import { addToCart } from "../utils/localstorageHelper";

function Productos() {
  const location = useLocation();
  const searchRaw = (
    new URLSearchParams(location.search).get("search") || ""
  ).trim();
  const search = searchRaw.toLowerCase();

  // Resolver la URL de las imágenes listadas en pasteles.json y memorizar
  const productos = useMemo(() => {
    return pasteles
      .map((p) => {
        const filename = (p.imagen || "").split("/").pop();
        const imageUrl = filename
          ? new URL(`../assets/img/${filename}`, import.meta.url).href
          : "";
        return { ...p, imageUrl };
      })
      .filter((p) => {
        if (!search) return true;
        const hay = `${p.nombre || ""} ${p.descripcion || ""} ${
          p.categoria || ""
        }`.toLowerCase();
        return hay.includes(search);
      });
  }, [location.search]);

  const [toast, setToast] = useState(null);

  const handleAgregar = (producto) => {
    addToCart({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      cantidad: producto.cantidad,
      stock: producto.stock,
    });
    setToast({
      title: "Carrito",
      message: `${producto.cantidad} x ${producto.nombre} agregad${
        producto.cantidad > 1 ? "os" : "o"
      } al carrito`,
    });
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="container mt-4">
      <h2>Pasteles</h2>
      {/* Toast Bootstrap fijo en la esquina */}
      {toast && (
        <div
          className="toast show position-fixed top-0 end-0 m-3"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{ zIndex: 1100 }}
        >
          <div className="toast-header">
            <strong className="me-auto">{toast.title}</strong>
            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={() => setToast(null)}
            ></button>
          </div>
          <div className="toast-body">{toast.message}</div>
        </div>
      )}

      {searchRaw && (
        <p className="mb-3">
          Resultados de búsqueda para: <strong>{searchRaw}</strong>
        </p>
      )}

      <div className="cards-grid mt-3">
        {productos.map((prod) => (
          <Card
            key={prod.id}
            id={prod.id}
            nombre={prod.nombre}
            imagen={prod.imageUrl}
            descripcion={prod.descripcion || `Stock: ${prod.stock ?? "N/A"}`}
            precio={Number(prod.precio)}
            onAgregar={(p) =>
              handleAgregar({
                id: prod.id,
                nombre: prod.nombre,
                precio: Number(prod.precio),
                imagen: prod.imageUrl,
                cantidad: p.cantidad,
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

export default Productos;
