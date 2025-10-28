import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const img = (path) => new URL(path, import.meta.url).href;

function BlogDos() {
  return (
    <article className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/blog">Blog</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Ganache perfecto
          </li>
        </ol>
      </nav>

      <header className="mb-3">
        <h1 className="display-6 fw-bold">
          Ganache de chocolate perfecto (y 3 usos)
        </h1>
        <p className="text-muted">
          Fórmulas por porcentaje de cacao, textura controlada y aplicaciones
          prácticas.
        </p>
      </header>

      <figure className="mb-4">
        <img
          src={img("../assets/img/Torta Cuadrada de Chocolate.webp")}
          className="img-fluid rounded shadow-sm"
          alt="Ganache brillante en torta de chocolate"
          onError={(e) =>
            (e.currentTarget.src = new URL(
              "../assets/img/logo.png",
              import.meta.url
            ).href)
          }
        />
        <figcaption className="form-text mt-2">
          La proporción chocolate:crema define la textura final.
        </figcaption>
      </figure>

      <section className="mb-4">
        <h2 className="h5">Proporciones básicas</h2>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Uso</th>
                <th>Chocolate (g)</th>
                <th>Crema (g)</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cobertura fluida (drip)</td>
                <td>200</td>
                <td>240</td>
                <td>Más crema para caer suave.</td>
              </tr>
              <tr>
                <td>Relleno clásico</td>
                <td>250</td>
                <td>200</td>
                <td>Firme pero untuoso.</td>
              </tr>
              <tr>
                <td>Trufas / relleno firme</td>
                <td>300</td>
                <td>150</td>
                <td>Consistencia moldeable.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small text-muted">
          Usa chocolate 54–64% cacao. Si tu cacao es mayor, suma 10–15% de
          crema.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="h5">Método infalible</h2>
        <ol className="list-group list-group-numbered">
          <li className="list-group-item">
            Calienta la crema hasta que <em>empiece</em> a humear (no hervir).
          </li>
          <li className="list-group-item">
            Vierte sobre el chocolate picado. Reposa 2–3 minutos.
          </li>
          <li className="list-group-item">
            Emulsiona del centro hacia afuera con espátula o minipimer.
          </li>
          <li className="list-group-item">
            Añade 15 g de mantequilla por cada 250 g de chocolate para más
            brillo.
          </li>
          <li className="list-group-item">
            Filma a piel y deja atemperar antes de usar.
          </li>
        </ol>
      </section>

      <section className="mb-4">
        <h2 className="h5">3 usos rápidos</h2>
        <div className="row g-3">
          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <img
                src={img("../assets/img/Roll de Canela.jpeg")}
                className="card-img-top"
                alt="Drip sobre torta"
              />
              <div className="card-body">
                <h3 className="h6">Cobertura drip</h3>
                <p className="mb-0">
                  Textura fluida: calienta 10–15 s en microondas y deja caer en
                  bordes.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <img
                src={img("../assets/img/Tiramisú Clásico.jpeg")}
                className="card-img-top"
                alt="Relleno montado"
              />
              <div className="card-body">
                <h3 className="h6">Relleno montado</h3>
                <p className="mb-0">
                  Refrigera 6–8 h y bate 1–2 min: queda aireado para manga.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <img
                src={img("../assets/img/Mousse de Chocolate.jpeg")}
                className="card-img-top"
                alt="Trufas"
              />
              <div className="card-body">
                <h3 className="h6">Trufas</h3>
                <p className="mb-0">
                  Usa la proporción firme, porciona con cuchara y reboza en
                  cacao.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4">
        <h2 className="h5">Se cortó la ganache, ¿y ahora?</h2>
        <p>
          Agrega de a <strong>1 cda de leche tibia</strong> y emulsiona. Repite
          hasta que vuelva a unir.
        </p>
      </section>

      <div className="d-flex gap-2">
        <Link to="/blog" className="btn btn-outline-secondary">
          ← Volver al Blog
        </Link>
        <Link to="/blog/uno" className="btn btn-dark">
          Ver: Bizcocho esponjoso →
        </Link>
      </div>
    </article>
  );
}

export { BlogDos as default, BlogDos };
