import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Card from "../components/Card";
import pastelesData from "../data/Pasteles.json";

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
        className="carousel slide"
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
            <img
              src={new URL("../assets/img/tienda.png", import.meta.url).href}
              alt="tienda"
              className="carousel-img d-block w-100"
            />
            <div className="carousel-caption d-none d-md-block">
              <h5 className="brand-text fw-semibold">
                Pasteleria 1000 sabores
              </h5>
              <p className="carousel-caption-text">
                Famosa por su participación en un récord Guinness en 1995,
                cuando colaboró en la creación de la torta más grande del mundo.
              </p>
            </div>
          </div>

          <div className="carousel-item">
            <img
              src={new URL("../assets/img/local.jpg", import.meta.url).href}
              alt="local"
              className="carousel-img d-block w-100"
            />
          </div>

          <div className="carousel-item">
            <img
              src={new URL("../assets/img/vitrina.png", import.meta.url).href}
              alt="vitrina"
              className="carousel-img d-block w-100"
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
          <h2 className="mb-4 fw-bold">Productos</h2>
          <div className="row g-4">
            {productos.map((p) => (
              <div className="col-md-3" key={p.id}>
                <Card
                  id={p.id}
                  nombre={p.nombre}
                  descripcion={p.descripcion || ""}
                  precio={p.precio}
                  imagen={p.imageUrl}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
