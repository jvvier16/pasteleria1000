// Categoria: organiza productos por categoría.
// - Agrupa pasteles por `categoria` y resuelve imágenes.
// - Si la URL contiene `?cat=slug` selecciona y hace scroll a esa sección.
import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Card from "../components/Card";
import "bootstrap/dist/css/bootstrap.min.css";
import pasteles from "../data/Pasteles.json";

// helper para crear slugs seguros (sin tildes y espacios)
const slugify = (str) => {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // eliminar todas las tildes
    .replace(/[^a-zA-Z0-9\s-]/g, "") // mantener solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, "-") // reemplazar espacios con guiones
    .replace(/-+/g, "-") // evitar guiones múltiples
    .toLowerCase();
};

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
  const [imageError, setImageError] = useState({});

  const handleImageError = (id) => {
    setImageError((prev) => ({ ...prev, [id]: true }));
  };

  // Función para mostrar toast
  const showToast = (title, message) => {
    setToast({ title, message });
    setTimeout(() => setToast(null), 2500);
  };

  // si la url contiene ?cat=slug, seleccionar esa categoria al cargar
  const location = useLocation();

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
            try {
              if (el && typeof el.scrollIntoView === "function") {
                el.scrollIntoView({ behavior: "smooth" });
              }
            } catch (err) {
              // En entornos de test (jsdom) scrollIntoView puede no existir o fallar.
              // Silenciar errores para que los tests no crasheen.
            }
          }, 150);
        }
      }
    } catch (err) {
      // ignore
    }
  }, [categorias, location.search]);
  const categoriasAMostrar = selectedCategory
    ? categorias.filter((c) => c.nombre === selectedCategory)
    : categorias;

  return (
    <div className="container py-4">
      {/* Barra de filtros por categoría */}
      <div
        className="d-flex justify-content-center flex-wrap gap-2 mb-4"
        role="toolbar"
        aria-label="Filtros de categorías"
      >
        <button
          className={`btn btn-sm ${
            selectedCategory ? "btn-outline-secondary" : "btn-primary"
          }`}
          onClick={() => setSelectedCategory(null)}
          data-testid="categoria-todas"
          aria-pressed={!selectedCategory}
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
            onClick={() => setSelectedCategory(cat.nombre)}
            data-testid={`categoria-${slugify(cat.nombre)}`}
            aria-pressed={selectedCategory === cat.nombre}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Toast de notificación */}
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

      {/* Categorías */}
      <div className="d-flex justify-content-center flex-wrap gap-3 mb-5">
        {categorias.map((cat) => (
          <div
            key={cat.id}
            className="card text-center shadow-sm fixed-width-8rem"
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
                    src={
                      imageError[prod.id]
                        ? "/src/assets/img/placeholder.png"
                        : prod.imageUrl
                    }
                    className="card-img-top"
                    alt={prod.nombre}
                    onError={() => handleImageError(prod.id)}
                    data-testid={`producto-imagen-${prod.id}`}
                  />
                  <div className="card-body text-center">
                    <h6 className="card-title">{prod.nombre}</h6>
                    <p
                      className="small text-muted"
                      aria-label={`Precio: ${prod.precio} pesos`}
                    >
                      ${Number(prod.precio).toLocaleString("es-CL")}
                    </p>
                    <button
                      className="btn btn-outline-success btn-sm mt-2"
                      onClick={async () => {
                        try {
                          const mod = await import(
                            "../utils/localstorageHelper"
                          );
                          await mod.addToCart({
                            id: prod.id,
                            nombre: prod.nombre,
                            precio: prod.precio,
                            imagen: prod.imageUrl,
                            cantidad: 1,
                          });
                          showToast(
                            "Carrito",
                            `${prod.nombre} agregado al carrito`
                          );
                        } catch (err) {
                          console.error("Error al agregar al carrito:", err);
                          try {
                            // fallback manual
                            const raw = localStorage.getItem("pasteleria_cart");
                            let cart = [];
                            try {
                              cart = raw ? JSON.parse(raw) : [];
                            } catch {
                              cart = [];
                            }

                            const existing = cart.find(
                              (i) => Number(i.id) === Number(prod.id)
                            );

                            if (existing) {
                              existing.cantidad = (existing.cantidad || 1) + 1;
                            } else {
                              cart.push({
                                id: prod.id,
                                nombre: prod.nombre,
                                precio: prod.precio,
                                imagen: prod.imageUrl,
                                cantidad: 1,
                              });
                            }

                            localStorage.setItem(
                              "pasteleria_cart",
                              JSON.stringify(cart)
                            );
                            window.dispatchEvent(new Event("storage"));
                            showToast(
                              "Carrito",
                              `${prod.nombre} agregado al carrito`
                            );
                          } catch (fallbackErr) {
                            console.error("Error en fallback:", fallbackErr);
                            showToast("Error", "No se pudo agregar al carrito");
                          }
                        }
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
