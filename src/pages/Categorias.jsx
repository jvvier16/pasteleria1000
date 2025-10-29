import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import "bootstrap/dist/css/bootstrap.min.css";
import pasteles from "../data/Pasteles.json";

// helper para crear slugs seguros (sin tildes y espacios)
const slugify = (str) =>
  String(str)
    .normalize("NFD")
    // eliminar marcas diacríticas (tildes)
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-]/g, "")
    .toLowerCase();

const Categorias = () => {
  // agrupar pasteles por categoria
  const categorias = useMemo(() => {
    const map = new Map();
    pasteles.forEach((p) => {
      const cat = (p.categoria || "Otros").toString().trim();
      if (!map.has(cat)) map.set(cat, []);
      // resolver URL de imagen
      const filename = (p.imagen || "").split("/").pop();
      const imageUrl = filename
        ? new URL(`../assets/img/${filename}`, import.meta.url).href
        : "";
      map.get(cat).push({ ...p, imageUrl });
    });
    // convertir a array con un id único
    return Array.from(map.entries()).map(([nombre, productos], i) => ({
      id: i + 1,
      nombre,
      productos,
    }));
  }, []);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [toast, setToast] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // sincronizar con query param ?cat=slug
  useEffect(() => {
    try {
      const qp = new URLSearchParams(location.search).get("cat");
      if (qp) {
        const found = categorias.find((c) => slugify(c.nombre) === qp);
        if (found) {
          setSelectedCategory(found.nombre);
          // pequeño delay para que el DOM renderice y luego hacer scroll
          setTimeout(() => {
            const el = document.getElementById(qp);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 150);
          return;
        }
      }
      // si no hay qp, limpiar selección
      setSelectedCategory(null);
    } catch (err) {
      setSelectedCategory(null);
    }
  }, [categorias, location.search]);
  const categoriasAMostrar = selectedCategory
    ? categorias.filter((c) => c.nombre === selectedCategory)
    : categorias;

  return (
    <div className="container py-4">
      {/* Barra de filtros por categoría */}
      <div className="d-flex justify-content-center flex-wrap gap-2 mb-4">
        <button
          className={`btn btn-sm ${
            selectedCategory ? "btn-outline-secondary" : "btn-primary"
          }`}
          onClick={() => setSelectedCategory(null)}
        >
          Todas
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            className={`btn btn-sm ${
              selectedCategory === cat.nombre
                ? "btn-primary"
                : "btn-outline-secondary"
            }`}
            onClick={() => {
              // actualizar estado y la query string
              setSelectedCategory(cat.nombre);
              const s = slugify(cat.nombre);
              navigate(`/categorias?cat=${encodeURIComponent(s)}`);
            }}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Categorías */}
      <div className="d-flex justify-content-center flex-wrap gap-3 mb-5">
        {categorias.map((cat) => (
          <div
            key={cat.id}
            className="card text-center shadow-sm"
            style={{ width: "8rem" }}
          >
            <img
              src={
                cat.productos[0]?.imageUrl || "https://via.placeholder.com/100"
              }
              className="card-img-top"
              alt={cat.nombre}
            />
            <div className="card-body p-2">
              <h6 className="card-title">{cat.nombre}</h6>
            </div>
          </div>
        ))}
      </div>

      {/* Productos por categoría */}
      {categoriasAMostrar.map((cat) => (
        <section key={cat.id} id={`${slugify(cat.nombre)}`} className="mb-5">
          <h3 className="mb-4 fw-bold">{cat.nombre}</h3>
          <div className="row g-4">
            {cat.productos.map((prod) => (
              <div key={prod.id} className="col-md-3">
                <div className="card shadow-sm h-100">
                  <img
                    src={prod.imageUrl}
                    className="card-img-top"
                    alt={prod.nombre}
                  />
                  <div className="card-body text-center">
                    <h6 className="card-title">{prod.nombre}</h6>
                    <p className="small text-muted">
                      ${Number(prod.precio).toLocaleString("es-CL")}
                    </p>
                    <button
                      className="btn btn-outline-success btn-sm mt-2"
                      onClick={async () => {
                        try {
                          const mod = await import(
                            "../utils/localstorageHelper"
                          );
                          mod.addToCart({
                            id: prod.id,
                            nombre: prod.nombre,
                            precio: prod.precio,
                            imagen: prod.imageUrl,
                            cantidad: 1,
                          });
                        } catch (err) {
                          // fallback simple
                          const raw = localStorage.getItem("pasteleria_cart");
                          let cart = raw ? JSON.parse(raw) : [];
                          const existing = cart.find(
                            (i) => Number(i.id) === Number(prod.id)
                          );
                          if (existing)
                            existing.cantidad = (existing.cantidad || 1) + 1;
                          else
                            cart.push({
                              id: prod.id,
                              nombre: prod.nombre,
                              precio: prod.precio,
                              imagen: prod.imageUrl,
                              cantidad: 1,
                            });
                          localStorage.setItem(
                            "pasteleria_cart",
                            JSON.stringify(cart)
                          );
                          window.dispatchEvent(new Event("storage"));
                        }
                        setToast({
                          title: "Carrito",
                          message: `${prod.nombre} agregado`,
                        });
                        setTimeout(() => setToast(null), 2500);
                      }}
                    >
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Categorias;
