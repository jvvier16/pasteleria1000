import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Card from "../components/Card";
import pastelesData from "../data/Pasteles.json";
import { addToCart } from "../utils/localstorageHelper";

const Index = () => {
  // Leer pasteles locales (si existen) y combinar con el JSON base
  const rawLocal = localStorage.getItem("pasteles_local");
  let pastelesLocales = [];
  try {
    pastelesLocales = rawLocal ? JSON.parse(rawLocal) : [];
  } catch {
    pastelesLocales = [];
  }

  // Combinar JSON + locales (locales sobrescriben si comparten id)
  const mapa = new Map();
  for (const p of pastelesData) mapa.set(p.id, p);
  for (const p of pastelesLocales || []) mapa.set(p.id, p);
  const todos = Array.from(mapa.values());

  // Crear un set con ids locales para marcar el origen
  const localIds = new Set((pastelesLocales || []).map((x) => String(x.id)));

  // Handler para agregar al carrito desde la página principal
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
      const res = addToCart(toAdd);
      // Notificar cambios (componentes que escuchan 'storage')
      window.dispatchEvent(new Event("storage"));
      return res;
    } catch (err) {
      console.error("Error agregando al carrito desde Index:", err);
      throw err;
    }
  };

  // Resolver imagenes (manejar data:, http:, o filename relativo)
  const productos = todos
    .map((p) => {
      let imageUrl = "";
      if (p.imagen) {
        if (p.imagen.startsWith("data:") || p.imagen.startsWith("http")) {
          imageUrl = p.imagen;
        } else {
          const filename = (p.imagen || "").split("/").pop();
          imageUrl = filename
            ? new URL(`../assets/img/${filename}`, import.meta.url).href
            : "";
        }
      }
      return { ...p, imageUrl };
    })
    .slice(0, 4);

  return (
    <div className="bg-muted">
      {/* Carrusel */}
      <div
        id="carouselExampleIndicators"
        className="carousel slide reveal slide-up"
        data-bs-ride="carousel"
      >
        <div className="carousel-indicators">
          <button
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide-to="0"
            className="active"
          ></button>
          <button
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide-to="1"
          ></button>
          <button
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide-to="2"
          ></button>
        </div>

        <div className="carousel-inner">
          <div className="carousel-item active">
            <div
              role="img"
              aria-label="tienda"
              className="carousel-bg"
              style={{
                backgroundImage: `url(${new URL("../assets/img/tienda.png", import.meta.url).href})`,
              }}
            />
            <div className="carousel-caption d-none d-md-block">
              <h5 className="brand-text fw-semibold reveal fade-in fade-delay-1">
                Pasteleria 1000 sabores
              </h5>
              <p className="carousel-caption-text reveal fade-in fade-delay-2">
                Famosa por su participación en un récord Guinness en 1995,
                cuando colaboró en la creación de la torta más grande del mundo.
              </p>
            </div>
          </div>

          <div className="carousel-item">
            <div
              role="img"
              aria-label="local"
              className="carousel-bg"
              style={{
                backgroundImage: `url(${new URL("../assets/img/local.jpg", import.meta.url).href})`,
              }}
            />
          </div>

          <div className="carousel-item">
            <div
              role="img"
              aria-label="vitrina"
              className="carousel-bg"
              style={{
                backgroundImage: `url(${new URL("../assets/img/vitrina.png", import.meta.url).href})`,
              }}
            />
          </div>
        </div>

        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#carouselExampleIndicators"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon"></span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#carouselExampleIndicators"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon"></span>
        </button>
      </div>

      {/* Productos */}
      <section className="py-5 bg-white text-center index-products">
        <div className="container">
          <h2 className="mb-4 fw-bold reveal slide-up">Productos</h2>
          <div className="row g-4">
            {productos.map((p) => (
              <div className="col-md-3" key={p.id}>
                <div className="reveal fade-in fade-delay-2">
                  <Card
                  id={p.id}
                  nombre={p.nombre}
                  descripcion={p.descripcion || ""}
                  precio={p.precio}
                  imagen={p.imageUrl}
                  stock={p.stock}
                  origen={localIds.has(String(p.id)) ? "local" : "json"}
                  onAgregar={handleAddToCart}
                  showAdminControls={false}
                  showStockCritical={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
