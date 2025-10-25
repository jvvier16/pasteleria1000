import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import pasteles from "../data/Pasteles.json";
import { addToCart as addToCartHelper } from "../utils/localstorageHelper";

const ProductoDetalle = () => {
  const { id } = useParams();
  const prod = pasteles.find((p) => String(p.id) === String(id));
  const [added, setAdded] = useState(false);

  if (!prod)
    return <div className="container py-5">Producto no encontrado</div>;

  const imageUrl = prod.imagen
    ? new URL(prod.imagen, import.meta.url).href
    : "";

  const handleAdd = async () => {
    try {
      await addToCartHelper({
        id: prod.id,
        nombre: prod.nombre,
        precio: Number(prod.precio),
        imagen: imageUrl,
        cantidad: 1,
        stock: prod.stock,
      });
      window.dispatchEvent(new Event("storage"));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Error agregando al carrito desde detalle:", err);
    }
  };

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/productos">Productos</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {prod.nombre}
          </li>
        </ol>
      </nav>

      <div className="row g-4 align-items-start">
        <div className="col-12 col-md-6">
          {imageUrl ? (
            <img
              src={imageUrl}
              className="img-fluid rounded shadow-sm"
              alt={prod.nombre}
            />
          ) : (
            <div className="bg-light p-5 text-center">Sin imagen</div>
          )}
        </div>
        <div className="col-12 col-md-6">
          <h1 className="h3 fw-bold mb-3">{prod.nombre}</h1>
          <p className="text-muted mb-2">{prod.descripcion}</p>
          {typeof prod.stock !== "undefined" && (
            <p
              className={`mb-2 ${
                Number(prod.stock) === 0 ? "text-danger" : "text-muted"
              }`}
            >
              Stock: {prod.stock}
            </p>
          )}
          <p className="h4 fw-semibold mb-4">
            ${Number(prod.precio).toLocaleString()}
          </p>

          {added && (
            <div className="alert alert-success py-1 mb-3">
              Agregado al carrito
            </div>
          )}

          <button
            className="btn btn-dark me-2"
            onClick={handleAdd}
            disabled={Number(prod.stock) === 0}
          >
            Agregar al carrito
          </button>
          <Link to="/productos" className="btn btn-outline-secondary">
            Volver
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductoDetalle;
