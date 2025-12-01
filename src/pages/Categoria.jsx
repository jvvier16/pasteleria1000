/**
 * Categoria: organiza productos por categoría desde el backend.
 * - Carga categorías desde GET /api/v2/categorias
 * - Carga productos por categoría desde GET /api/v2/productos/categoria/{id}
 * - Si la URL contiene `?cat=slug` selecciona y hace scroll a esa sección.
 */
import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Card from "../components/Card";
import { addToCart } from "../utils/localstorageHelper";
import { obtenerCategorias, obtenerProductosPorCategoria, obtenerProductos } from "../utils/apiHelper";
import "bootstrap/dist/css/bootstrap.min.css";

// helper para crear slugs seguros (sin tildes y espacios)
const slugify = (str) => {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
};

const Categorias = () => {
  // Estados para categorías y productos
  const [categorias, setCategorias] = useState([]);
  const [productosPorCategoria, setProductosPorCategoria] = useState({});
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [toast, setToast] = useState(null);

  const location = useLocation();

  // Resolver imagen
  const resolveImageUrl = (imagen) => {
    if (!imagen) return "";
    if (imagen.startsWith("data:") || imagen.startsWith("http")) return imagen;
    const filename = (imagen || "").split("/").pop();
    return filename
      ? new URL(`../assets/img/${filename}`, import.meta.url).href
      : "";
  };

  // Cargar categorías y productos del backend
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError(null);

      try {
        // Cargar categorías
        const categoriasResponse = await obtenerCategorias();
        const categoriasData = categoriasResponse.data || [];

        // Cargar todos los productos para tener datos iniciales
        const productosResponse = await obtenerProductos();
        const productosData = (productosResponse.data || []).map((p) => ({
          ...p,
          id: p.productoId || p.id,
          imageUrl: resolveImageUrl(p.imagen),
        }));

        setTodosLosProductos(productosData);

        // Agrupar productos por categoría
        const productosPorCat = {};
        
        // Cargar productos para cada categoría
        for (const cat of categoriasData) {
          const catId = cat.categoriaId || cat.id;
          try {
            const prodCatResponse = await obtenerProductosPorCategoria(catId);
            const prodCatData = (prodCatResponse.data || []).map((p) => ({
              ...p,
              id: p.productoId || p.id,
              imageUrl: resolveImageUrl(p.imagen),
            }));
            productosPorCat[cat.nombre] = prodCatData;
          } catch (err) {
            // Si falla cargar una categoría, usar productos filtrados localmente
            productosPorCat[cat.nombre] = productosData.filter(
              (p) => p.categoria?.nombre === cat.nombre || p.categoria === cat.nombre
            );
          }
        }

        // Agregar categoría "Otros" para productos sin categoría
        const productosConCategoria = Object.values(productosPorCat).flat();
        const productosIdsConCategoria = new Set(productosConCategoria.map((p) => p.id));
        const productosSinCategoria = productosData.filter((p) => !productosIdsConCategoria.has(p.id));
        
        if (productosSinCategoria.length > 0) {
          productosPorCat["Otros"] = productosSinCategoria;
        }

        setProductosPorCategoria(productosPorCat);

        // Formatear categorías para el componente
        const categoriasFormateadas = categoriasData.map((cat, index) => ({
          id: cat.categoriaId || cat.id || index + 1,
          nombre: cat.nombre,
          productos: productosPorCat[cat.nombre] || [],
        }));

        // Agregar categoría "Otros" si existe
        if (productosSinCategoria.length > 0) {
          categoriasFormateadas.push({
            id: categoriasFormateadas.length + 1,
            nombre: "Otros",
            productos: productosSinCategoria,
          });
        }

        setCategorias(categoriasFormateadas);

      } catch (err) {
        console.error("Error al cargar categorías:", err);
        setError(err.message || "Error al cargar las categorías");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Manejar selección de categoría desde URL
  useEffect(() => {
    try {
      const qp = new URLSearchParams(location.search).get("cat");
      if (qp && categorias.length > 0) {
        const found = categorias.find((c) => slugify(c.nombre) === qp);
        if (found) {
          setSelectedCategory(found.nombre);
          const t = setTimeout(() => {
            try {
              if (typeof document !== "undefined") {
                const el = document.getElementById(qp);
                if (el && typeof el.scrollIntoView === "function") {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }
            } catch (err) {
              // Silenciar errores de scroll
            }
          }, 150);
          return () => clearTimeout(t);
        }
      }
    } catch (err) {
      // ignore
    }
  }, [categorias, location.search]);

  // Handler para agregar al carrito
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

  // Productos con descuento (precio >= 40000)
  const DISCOUNT_PERCENT = 20;
  const discountedProducts = useMemo(() => {
    return todosLosProductos
      .filter((p) => Number(p.precio || 0) >= 40000)
      .map((p) => ({
        ...p,
        discountedPrice: Math.round(Number(p.precio || 0) * (1 - DISCOUNT_PERCENT / 100)),
      }));
  }, [todosLosProductos]);

  // Categorías a mostrar según selección
  const categoriasAMostrar = selectedCategory && selectedCategory !== "__descuentos"
    ? categorias.filter((c) => c.nombre === selectedCategory)
    : categorias;

  // Estado de carga
  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted">Cargando categorías...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error al cargar categorías</h4>
          <p>{error}</p>
          <hr />
          <button 
            className="btn btn-outline-danger"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
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

      {/* Tiles de categorías */}
      <div className="d-flex justify-content-center flex-wrap gap-3 mb-5">
        {/* Tile 'Todas' */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setSelectedCategory(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedCategory(null);
            }
          }}
          className={`card category-card text-center shadow-sm fixed-width-8rem position-relative ${
            selectedCategory === null ? "active" : ""
          }`}
          aria-pressed={!selectedCategory}
          data-testid="categoria-tile-todas"
        >
          <img 
            src={categorias[0]?.productos[0]?.imageUrl || "https://via.placeholder.com/100"} 
            className="card-img-top" 
            alt="Todas" 
          />
          <div className="card-body p-2">
            <h6 className="card-title">Todas</h6>
          </div>
        </div>

        {/* Tile Ofertas */}
        {discountedProducts.length > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSelectedCategory("__descuentos")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedCategory("__descuentos");
              }
            }}
            className={`card category-card text-center shadow-sm fixed-width-8rem position-relative ${
              selectedCategory === "__descuentos" ? "active" : ""
            }`}
            aria-pressed={selectedCategory === "__descuentos"}
            data-testid="categoria-tile-descuentos"
          >
            <div className="discount-badge">-{DISCOUNT_PERCENT}%</div>
            <img 
              src={discountedProducts[0]?.imageUrl || "https://via.placeholder.com/100"} 
              className="card-img-top" 
              alt="Descuentos" 
            />
            <div className="card-body p-2">
              <h6 className="card-title">Ofertas</h6>
            </div>
          </div>
        )}

        {/* Tiles de cada categoría */}
        {categorias.map((cat) => {
          const hasDiscount = cat.productos.some((p) => Number(p.precio || 0) >= 40000);
          return (
            <div
              key={cat.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCategory(cat.nombre)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedCategory(cat.nombre);
                }
              }}
              className={`card category-card text-center shadow-sm fixed-width-8rem position-relative ${
                selectedCategory === cat.nombre ? "active" : ""
              }`}
              aria-pressed={selectedCategory === cat.nombre}
              data-testid={`categoria-tile-${slugify(cat.nombre)}`}
            >
              {hasDiscount && <div className="discount-badge">-{DISCOUNT_PERCENT}%</div>}
              <img 
                src={cat.productos[0]?.imageUrl || "https://via.placeholder.com/100"} 
                className="card-img-top" 
                alt={cat.nombre} 
              />
              <div className="card-body p-2">
                <h6 className="card-title">{cat.nombre}</h6>
              </div>
            </div>
          );
        })}

        {/* Banner de Ofertas cuando está seleccionado */}
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
                  <img 
                    src={p.imageUrl || "https://via.placeholder.com/100"} 
                    alt={p.nombre} 
                    style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6 }} 
                  />
                  <div className="mt-2">
                    <div className="small text-muted">{p.nombre}</div>
                    <div className="fw-bold text-discounted">
                      ${Number(p.discountedPrice).toLocaleString('es-CL')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Productos por categoría */}
      {selectedCategory === "__descuentos" ? (
        <section className="mb-5">
          <h3 className="mb-4 fw-bold">Ofertas Especiales</h3>
          <div className="row g-4">
            {discountedProducts.map((prod) => (
              <div key={prod.id} className="col-md-3">
                <Card
                  id={prod.id}
                  nombre={prod.nombre}
                  descripcion={prod.descripcion || ""}
                  precio={prod.precio}
                  imagen={prod.imageUrl}
                  stock={prod.stock}
                  onAgregar={handleAddToCart}
                  discountPercent={DISCOUNT_PERCENT}
                  discountedPrice={prod.discountedPrice}
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        categoriasAMostrar.map((cat) => (
          <section key={cat.id} id={slugify(cat.nombre)} className="mb-5">
            <h3 className="mb-4 fw-bold">{cat.nombre}</h3>
            {cat.productos.length === 0 ? (
              <p className="text-muted">No hay productos en esta categoría</p>
            ) : (
              <div className="row g-4">
                {cat.productos.map((prod) => (
                  <div key={prod.id} className="col-md-3">
                    <Card
                      id={prod.id}
                      nombre={prod.nombre}
                      descripcion={prod.descripcion || ""}
                      precio={prod.precio}
                      imagen={prod.imageUrl}
                      stock={prod.stock}
                      onAgregar={handleAddToCart}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        ))
      )}

      {/* Mensaje si no hay categorías */}
      {categorias.length === 0 && !loading && (
        <div className="text-center py-5">
          <p className="text-muted fs-5">No hay categorías disponibles</p>
        </div>
      )}
    </div>
  );
};

export default Categorias;
