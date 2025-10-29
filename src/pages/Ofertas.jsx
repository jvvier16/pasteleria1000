import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import pasteles from "../data/Pasteles.json";
import Card from "../components/Card";
import { addToCart } from "../utils/localstorageHelper";

// util para resolver imagenes (misma estrategia que en otras páginas)
const resolveImage = (imgPath) => {
  try {
    const filename = (imgPath || "").split("/").pop();
    return filename
      ? new URL(`../assets/img/${filename}`, import.meta.url).href
      : "";
  } catch (err) {
    return "";
  }
};

const Ofertas = () => {
  // filtrar pasteles con precio mayor a 45000
  const ofertados = (pasteles || [])
    .map((p) => ({ ...p, precio: Number(p.precio || 0) }))
    .filter((p) => p.precio >= 40000)
    .map((p) => ({ ...p, imageUrl: resolveImage(p.imagen) }));

  const [toast, setToast] = useState(null);

  const handleAddToCart = (product) => {
    try {
      const toAdd = {
        id: product.id,
        nombre: product.nombre || product.titulo,
        precio: Number(product.precio) || 0,
        imagen: product.imageUrl || product.imagen || "",
        cantidad: 1,
        stock: product.stock,
      };
      addToCart(toAdd);
      window.dispatchEvent(new Event("storage"));
      setToast({
        title: "Carrito",
        message: `${toAdd.nombre} agregado al carrito`,
      });
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error("Error agregando al carrito desde Ofertas:", err);
      setToast({ title: "Error", message: "No se pudo agregar al carrito" });
      setTimeout(() => setToast(null), 2500);
    }
  };

  if (!ofertados.length) {
    return (
      <div className="container py-5">
        <h3>Ofertas</h3>
        <p className="text-muted">No hay productos en oferta por ahora.</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h3 className="mb-4">Ofertas especiales</h3>
      {toast && (
        <div
          className="toast show position-fixed bottom-0 end-0 m-3"
          role="alert"
          aria-live="polite"
          data-testid="toast-notification"
        >
          <div className="toast-header">
            <strong className="me-auto">{toast.title}</strong>
            <button
              type="button"
              className="btn-close"
              onClick={() => setToast(null)}
              aria-label="Cerrar"
            />
          </div>
          <div className="toast-body">{toast.message}</div>
        </div>
      )}

      <div className="row g-4">
        {ofertados.map((p) => {
          const precioOriginal = Number(p.precio || 0);
          const precioDescuento = Math.round(precioOriginal * 0.8);
          return (
            <div className="col-md-3" key={p.id}>
              <Card
                id={p.id}
                nombre={p.nombre}
                descripcion={p.descripcion || ""}
                precio={precioDescuento}
                imagen={p.imageUrl}
                stock={p.stock}
                origen={"json"}
                onAgregar={handleAddToCart}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Ofertas;
