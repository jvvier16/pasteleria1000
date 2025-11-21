import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Nosotros = () => {
  return (
    <div className="container py-5">
      {/* Encabezado */}
      <div className="text-center mb-5">
        <h1 className="fw-bold text-primary">Nosotros</h1>
        <p className="lead text-muted">
          Conoce más sobre nuestra historia, misión y visión como Pastelería
          1000 Sabores.
        </p>
      </div>

      {/* Historia */}
      <div className="row align-items-center mb-5">
        <div className="col-md-6">
          <img
            src={new URL("../assets/img/tienda.png", import.meta.url).href}
            alt="Pastelería 1000 Sabores"
            className="img-fluid rounded shadow"
          />
        </div>
        <div className="col-md-6">
          <h3 className="fw-semibold text-primary mb-3">Nuestra Historia</h3>
          <p>
            <strong>Pastelería 1000 Sabores</strong> celebra su{" "}
            <strong>50° aniversario</strong> como un referente en la repostería
            chilena. Famosa por su participación en un récord Guinness en 1995,
            cuando colaboró en la creación de la torta más grande del mundo, hoy
            continuamos innovando para mantener viva nuestra tradición dulce y
            artesanal.
          </p>
          <p>
            Actualmente, buscamos renovar nuestra experiencia digital con una
            plataforma moderna que acerque nuestras delicias a todos los hogares
            de Chile.
          </p>
        </div>
      </div>

      {/* Misión y Visión */}
      <div className="row text-center mb-5">
        <div className="col-md-6 mb-4 mb-md-0">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h4 className="text-primary fw-bold mb-3">Nuestra Misión</h4>
              <p>
                Ofrecer una experiencia dulce y memorable a nuestros clientes,
                elaborando{" "}
                <strong>productos de repostería de alta calidad</strong> para
                todas las ocasiones. Celebramos nuestras raíces y fomentamos la
                creatividad para que cada torta y postre sea una obra única.
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h4 className="text-primary fw-bold mb-3">Nuestra Visión</h4>
              <p>
                Convertirnos en la{" "}
                <strong>tienda online líder en repostería en Chile</strong>,
                reconocida por nuestra innovación, calidad y compromiso con la
                comunidad. Buscamos inspirar a nuevos talentos en el mundo de la
                gastronomía y seguir siendo un símbolo de sabor y tradición.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Proyecto actual */}
      <div className="row align-items-center">
        <div className="col-md-6 order-md-2">
          <img
            src={new URL("../assets/img/local.jpg", import.meta.url).href}
            alt="E-commerce de repostería"
            className="img-fluid rounded shadow"
          />
        </div>
        <div className="col-md-6">
          <h3 className="fw-semibold text-primary mb-3">Nuestro Proyecto</h3>
          <p>
            Estamos desarrollando una nueva plataforma de{" "}
            <strong>e-commerce</strong> que permitirá a nuestros clientes:
          </p>
          <ul>
            <li>
              Comprar tortas y productos de repostería de manera fácil y segura.
            </li>
            <li>Personalizar sus pedidos según gusto y ocasión.</li>
            <li>
              Participar en un programa de descuentos y promociones especiales.
            </li>
          </ul>
          <p>
            Con esta iniciativa, buscamos que cada persona pueda disfrutar del
            sabor de 1000 Sabores sin salir de casa.
          </p>
        </div>
      </div>
      {/* Equipo */}
      <div className="row mt-5 reveal slide-up">
        <div className="col-12 text-center mb-4">
          <h3 className="fw-semibold text-primary mb-3">Equipo</h3>
          <p className="text-muted">Conoce a las personas que hacen posible 1000 Sabores</p>
        </div>

        <div className="col-12">
          <div className="row g-4 justify-content-center">
            <div className="col-12 col-sm-6 col-md-4 d-flex">
              <div className="card border-0 shadow-sm w-100 text-center p-3">
                <img
                  src={new URL("../assets/img/primera.jpeg", import.meta.url).href}
                  alt="Aracelly Zenteno"
                  className="mx-auto mb-3 rounded-circle"
                  style={{ width: 96, height: 96, objectFit: "cover" }}
                />
                <h5 className="mb-1">Aracelly Zenteno</h5>
                <small className="text-muted">Miembro del equipo</small>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-4 d-flex">
              <div className="card border-0 shadow-sm w-100 text-center p-3">
                <img
                  src={new URL("../assets/img/segunda.jpeg", import.meta.url).href}
                  alt="Javier Rojas"
                  className="mx-auto mb-3 rounded-circle"
                  style={{ width: 96, height: 96, objectFit: "cover" }}
                />
                <h5 className="mb-1">Javier Rojas</h5>
                <small className="text-muted">Miembro del equipo</small>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-4 d-flex">
              <div className="card border-0 shadow-sm w-100 text-center p-3">
                <img
                  src={new URL("../assets/img/tecera.jpeg", import.meta.url).href}
                  alt="Matias Jara"
                  className="mx-auto mb-3 rounded-circle"
                  style={{ width: 96, height: 96, objectFit: "cover" }}
                />
                <h5 className="mb-1">Matias Jara</h5>
                <small className="text-muted">Miembro del equipo</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nosotros;
