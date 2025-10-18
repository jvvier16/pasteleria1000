import React from 'react'

function Card({ id, titulo, nombre, contenido, descripcion, precio, imagen, comprar, onAgregar }){
    // compatibilidad: permitir usar tanto `titulo` como `nombre`, `contenido` o `descripcion`
    const title = titulo || nombre || 'Producto'
    const desc = contenido || descripcion || ''
    const price = typeof precio === 'number' ? precio : (precio || '')
    const imgSrc = imagen || ''

    const handleAgregar = (e) => {
        if (onAgregar) return onAgregar({ id, nombre: title, precio: price, imagen: imgSrc })
        if (comprar) return comprar(e)
    }

    return (
        <div className="card h-100">
            {imgSrc && <img src={imgSrc} className="card-img-top" alt={title} />}
            <div className="card-body d-flex flex-column">
                <h5 className="card-title">{title}</h5>
                <p className="card-text flex-grow-1">{desc}</p>
                <p className="card-text fw-bold text-success mb-2">{typeof price === 'number' ? `$${price.toLocaleString('es-CL')}` : price}</p>
                <button
                    type="button"
                    className="btn btn-primary mt-auto btn-agregar-carrito"
                    data-id={id}
                    data-nombre={title}
                    data-precio={price}
                    data-imagen={imgSrc}
                    onClick={handleAgregar}
                >
                    Agregar a carrito
                </button>
            </div>
        </div>
    )
}

export default Card