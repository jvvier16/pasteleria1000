// Footer: pie de página con enlaces y contactos.
// - Presenta información de la empresa y enlaces a redes.
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Footer = () => {
  return (
    <footer className="bg-dark text-light pt-5 pb-3 mt-5 reveal slide-up">
      <div className="container">
        <div className="row text-center text-md-start">
          {/* Columna 1 */}
          <div className="col-md-4 mb-4">
            <h5 className="fw-bold text-warning">Pastelería 1000 Sabores</h5>
            <p className="text-light">
              Endulzando momentos desde 1975. Nos especializamos en tortas y
              productos de repostería artesanal con el sabor tradicional que nos
              caracteriza.
            </p>
          </div>


          {/* Columna 3 */}
          <div className="col-md-4 mb-4">
            <h6 className="fw-bold text-warning">Contáctanos</h6>
            <p className="mb-1">📍 Santiago, Chile</p>
            <p className="mb-1">📞 +56 9 5555 1000</p>
            <p className="mb-1">✉️ contacto@1000sabores.cl</p>
            <div className="mt-3">
              <a href="https://www.facebook.com" className="me-3 text-light">
                <i className="bi bi-facebook fs-4"></i>
              </a>
              <a href="https://www.instagram.com" className="me-3 text-light">
                <i className="bi bi-instagram fs-4"></i>
              </a>
              <a href="https://www.tiktok.com" className="text-light">
                <i className="bi bi-tiktok fs-4"></i>
              </a>
            </div>
          </div>
        </div>

        <hr className="border-secondary" />

        <div className="text-center small text-muted">
          © {new Date().getFullYear()} Pastelería 1000 Sabores — Todos los
          derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
