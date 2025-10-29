import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const img = (path) => new URL(path, import.meta.url).href;

export default function BlogUno() {
  return (
    <article className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/blog">Blog</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Bizcocho esponjoso
          </li>
        </ol>
      </nav>

      <header className="mb-3">
        <h1 className="display-6 fw-bold">
          7 trucos para un bizcocho ultra esponjoso
        </h1>
        <p className="text-muted">
          Temperatura, mezcla y horneado: paso a paso con explicación técnica.
        </p>
      </header>

      <figure className="mb-4">
        <img
          src={img("../assets/img/torta circular de vainilla.jpeg")}
          className="img-fluid rounded shadow-sm"
          alt="Bizcocho de vainilla esponjoso"
          onError={(e) =>
            (e.currentTarget.src = new URL(
              "../assets/img/orta circular de vainilla.jpeg",
              import.meta.url
            ).href)
          }
        />
        <figcaption className="form-text mt-2">
          La miga ligera empieza antes de encender el horno.
        </figcaption>
      </figure>

      <section className="mb-4">
        <h2 className="h5">Resumen rápido</h2>
        <ul className="list-group">
          <li className="list-group-item">
            Usa <strong>ingredientes a temperatura ambiente</strong>{" "}
            (20–22&nbsp;°C).
          </li>
          <li className="list-group-item">
            Crema <strong>mantequilla + azúcar</strong> 3–5 min hasta palidecer.
          </li>
          <li className="list-group-item">
            Añade los huevos de a uno, <strong>emulsionando</strong> bien.
          </li>
          <li className="list-group-item">
            Alterna secos y leche en 3 tandas, <strong>sin sobrebatir</strong>.
          </li>
          <li className="list-group-item">
            Molde engrasado y forrado; <strong>llena al 60–70%</strong>.
          </li>
          <li className="list-group-item">
            <strong>Horno precalentado</strong> y estable (170–175&nbsp;°C).
          </li>
          <li className="list-group-item">
            Enfriado 10 min en molde, luego rejilla.
          </li>
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="h5">Ingredientes base (molde 20 cm)</h2>
        <ul>
          <li>200 g mantequilla sin sal</li>
          <li>200 g azúcar</li>
          <li>3 huevos L</li>
          <li>240 g harina sin polvos + 8 g polvos de hornear</li>
          <li>120 ml leche</li>
          <li>2 cditas esencia de vainilla</li>
          <li>1 pizca de sal</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="h5">Procedimiento</h2>
        <ol className="list-group list-group-numbered">
          <li className="list-group-item">
            Precalienta el horno y prepara el molde.
          </li>
          <li className="list-group-item">
            Bate mantequilla y azúcar hasta cremar.
          </li>
          <li className="list-group-item">
            Agrega los huevos, batiendo y raspando bordes.
          </li>
          <li className="list-group-item">
            Incorpora secos alternando con leche.
          </li>
          <li className="list-group-item">
            Vierte, alisa y hornea 30–40 min (palillo seco).
          </li>
          <li className="list-group-item">
            Enfría, desmolda y deja en rejilla.
          </li>
        </ol>
      </section>

      <section className="mb-4">
        <h2 className="h5">Solución de problemas</h2>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="border rounded p-3">
              <h3 className="h6">Se hunde al centro</h3>
              <p className="mb-1">
                <strong>Causa:</strong> horno frío o apertura temprana.
              </p>
              <p className="mb-0">
                <strong>Solución:</strong> hornea 5–10 min extra y evita abrir
                antes de los 25 min.
              </p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border rounded p-3">
              <h3 className="h6">Miga densa</h3>
              <p className="mb-1">
                <strong>Causa:</strong> sobrebatido o falta de polvos.
              </p>
              <p className="mb-0">
                <strong>Solución:</strong> mezcla solo hasta integrar y verifica
                la fecha del impulsor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="d-flex gap-2">
        <Link to="/blog" className="btn btn-outline-secondary">
          ← Volver al Blog
        </Link>
        <Link to="/blog/dos" className="btn btn-dark">
          Siguiente: Ganache perfecto →
        </Link>
      </div>
    </article>
  );
}
