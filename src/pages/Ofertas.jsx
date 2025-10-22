import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import pasteles from "../data/Pasteles.json";

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
    .filter((p) => p.precio >= 45000)
    .map((p) => ({ ...p, imageUrl: resolveImage(p.imagen) }));

  const addToCart = async (prod) => {
    try {
      const mod = await import("../utils/localstorageHelper");
      mod.addToCart(prod);
    } catch (err) {
      // fallback directo a localStorage
      const raw = localStorage.getItem("pasteleria_cart");
      let cart = raw ? JSON.parse(raw) : [];
      const existing = cart.find((i) => Number(i.id) === Number(prod.id));
      if (existing) existing.cantidad = (existing.cantidad || 1) + 1;
      else cart.push({ ...prod, cantidad: 1 });
      localStorage.setItem("pasteleria_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("storage"));
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
      <div className="row g-4">
        {ofertados.map((p) => {
          const precioOriginal = Number(p.precio || 0);
          const precioDescuento = Math.round(precioOriginal * 0.8);
          return (
            <div className="col-md-3" key={p.id}>
              <div className="card h-100 shadow-sm">
                <img
                  src={p.imageUrl || "https://via.placeholder.com/300"}
                  className="card-img-top"
                  alt={p.nombre}
                  style={{ objectFit: "cover", height: 180 }}
                />
                <div className="card-body text-center">
                  <h6 className="card-title">{p.nombre}</h6>
                  <p className="small text-muted mb-1">
                    <span className="text-decoration-line-through me-2">
                      ${precioOriginal.toLocaleString("es-CL")}
                    </span>
                    <strong className="text-danger">
                      ${precioDescuento.toLocaleString("es-CL")}
                    </strong>
                  </p>
                  <p className="small text-secondary">20% descuento</p>
                  <button
                    className="btn btn-success btn-sm mt-2"
                    onClick={() =>
                      addToCart({
                        id: p.id,
                        nombre: p.nombre,
                        precio: precioDescuento,
                        imagen: p.imageUrl,
                        cantidad: 1,
                      })
                    }
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Ofertas;
