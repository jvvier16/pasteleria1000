// Categoria: organiza productos por categoría.
// - Agrupa pasteles por `categoria` y resuelve imágenes.
// - Si la URL contiene `?cat=slug` selecciona y hace scroll a esa sección.
import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Card from "../components/Card";
import { addToCart } from "../utils/localstorageHelper";
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

  // Handler para agregar al carrito desde la página de Categorías
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
      console.error("Error agregando al carrito desde Categorias:", err);
      setToast({ title: "Error", message: "No se pudo agregar al carrito" });
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleImageError = (id) => {
    setImageError((prev) => ({ ...prev, [id]: true }));
  };

  // Función para mostrar toast
  const showToast = (title, message) => {
    setToast({ title, message });
    setTimeout(() => setToast(null), 2500);
  };

  // Special discounts view: compute discounted products (e.g., 20% off on productos >= 40000)
  const DISCOUNT_PERCENT = 20;
  const discountedProducts = useMemo(() => {
    return pasteles
      .filter((p) => Number(p.precio || 0) >= 40000)
      .map((p) => ({
        ...p,
        imageUrl: p.imageUrl || ((p.imagen || "").split("/").pop() ? new URL(`../assets/img/${(p.imagen||"").split("/").pop()}`, import.meta.url).href : ""),
        discountedPrice: Math.round(Number(p.precio || 0) * (1 - DISCOUNT_PERCENT / 100)),
      }));
  }, []);

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
          const t = setTimeout(() => {
            try {
              if (typeof document !== "undefined") {
                const el = document.getElementById(qp);
                if (el && typeof el.scrollIntoView === "function") {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }
            } catch (err) {
              // En entornos de test (jsdom) scrollIntoView puede no existir o fallar.
              // Silenciar errores para que los tests no crasheen.
            }
          }, 150);
          return () => clearTimeout(t);
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
          className={`btn btn-sm ${selectedCategory === "__descuentos" ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={() => setSelectedCategory("__descuentos")}
          data-testid={`categoria-descuentos`}
          aria-pressed={selectedCategory === "__descuentos"}
        >
          Descuentos
        </button>
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
        {/** Render category tiles, including Descuentos tile which shows discount badge if applicable */}
        {selectedCategory !== "__descuentos" && (
          <>
            {categorias.map((cat) => {
              const hasDiscount = cat.productos.some((p) => Number(p.precio || 0) >= 40000);
              return (
                <div key={cat.id} className="card text-center shadow-sm fixed-width-8rem position-relative">
                  {hasDiscount && <div className="discount-badge">-{DISCOUNT_PERCENT}%</div>}
                  <img src={cat.productos[0]?.imageUrl || "https://via.placeholder.com/100"} className="card-img-top" alt={cat.nombre} />
                  <div className="card-body p-2">
                    <h6 className="card-title">{cat.nombre}</h6>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/** Descuentos tile: a large card summarizing discounted products */}
        {selectedCategory === "__descuentos" && (
          <div className="card text-center shadow-sm p-3 w-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h5 className="mb-1">Ofertas Especiales</h5>
                <p className="mb-0 text-muted">Descuentos del {DISCOUNT_PERCENT}% en productos seleccionados</p>
              </div>
              <div>
                <span className="discount-badge">-{DISCOUNT_PERCENT}%</span>
              </div>
            </div>
            <div className="row g-3 mt-3">
              {discountedProducts.slice(0, 6).map((p) => (
                <div key={p.id} className="col-md-2 text-center">
                  <img src={p.imageUrl || "https://via.placeholder.com/100"} alt={p.nombre} style={{width: '100%', height: 80, objectFit: 'cover', borderRadius: 6}} />
                  <div className="mt-2">
                    <div className="small text-muted">{p.nombre}</div>
                    <div className="fw-bold text-discounted">${Number(p.discountedPrice).toLocaleString('es-CL')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Productos por categoría */}
      {/** If selectedCategory is __descuentos, we render a synthetic category showing discountedProducts */}
      {categoriasAMostrar.map((cat) => (
        <section key={cat.id} id={`${slugify(cat.nombre)}`} className="mb-5">
          <h3 className="mb-4 fw-bold">{cat.nombre}</h3>
          <div className="row g-4">
            {/** If this is the discounts synthetic category, render discounted products with badge */}
            {(selectedCategory === "__descuentos" ? discountedProducts : cat.productos).map((prod) => (
              <div key={prod.id} className="col-md-3">
                <Card
                  id={prod.id}
                  nombre={prod.nombre}
                  descripcion={prod.descripcion || ""}
                  precio={prod.precio}
                  imagen={prod.imageUrl}
                  stock={prod.stock}
                  origen={"json"}
                  onAgregar={handleAddToCart}
                  discountPercent={selectedCategory === "__descuentos" ? DISCOUNT_PERCENT : 0}
                  discountedPrice={selectedCategory === "__descuentos" ? prod.discountedPrice : null}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Categorias;
