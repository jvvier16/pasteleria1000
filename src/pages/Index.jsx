import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Card from "../components/Card";
import pasteles from "../data/Pasteles.json";

const Index = () => {
  const productos = pasteles.slice(0, 4).map((p) => ({
    ...p,
    imageUrl: new URL(p.imagen, import.meta.url).href,
  }));

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
              <h5 className="text-dark fw-semibold">Pasteleria 1000 sabores</h5>
              <p className="text-dark">
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
      <section className="py-5 bg-white text-center">
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
