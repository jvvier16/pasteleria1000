// Footer: pie de página con enlaces y contactos.
// - Presenta información de la empresa y enlaces a redes.
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Footer = () => {
  return (
    <footer className="fancy-footer mt-5" aria-label="Pie de página">
      <div className="footer-decor" aria-hidden="true">
        <span className="sweet s1" />
        <span className="sweet s2" />
        <span className="sweet s3" />
        <span className="sweet s4" />
      </div>

      <div className="container py-5">
        <div className="row align-items-center text-center text-md-start">
          <div className="col-md-4 mb-4">
            <h4 className="footer-logo mb-2">Pastelería 1000 Sabores</h4>
            <p className="text-muted mb-0">
              Endulzando momentos desde 1975 con repostería artesanal y recetas
              de la casa. Calidad y cariño en cada porción.
            </p>
          </div>

          <div className="col-md-4 mb-4 text-center">
            <h6 className="fw-bold text-warning mb-2">Contáctanos</h6>
            <p className="mb-1">📍 Santiago, Chile</p>
            <p className="mb-1">📞 +56 9 5555 1000</p>
            <p className="mb-1">✉️ contacto@1000sabores.cl</p>
            <div className="socials mt-3">
              <a href="https://www.facebook.com" className="me-3 social" aria-label="Facebook">
                <i className="bi bi-facebook fs-4"></i>
              </a>
              <a href="https://www.instagram.com" className="me-3 social" aria-label="Instagram">
                <i className="bi bi-instagram fs-4"></i>
              </a>
              <a href="https://www.tiktok.com" className="social" aria-label="TikTok">
                <i className="bi bi-tiktok fs-4"></i>
              </a>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <h6 className="fw-bold text-warning mb-2">Recibe nuestras ofertas</h6>
            <p className="small text-muted mb-2">Suscríbete y recibe descuentos exclusivos.</p>
            <div className="d-flex justify-content-center justify-content-md-start gap-2">
              <input aria-label="Email" type="email" placeholder="tu@email.cl" className="form-control form-control-sm footer-input" />
              <button className="btn btn-sm btn-primary footer-cta">Suscribirme</button>
            </div>
          </div>
        </div>

        <hr className="border-secondary" />

        <div className="text-center small text-muted">
          © {new Date().getFullYear()} Pastelería 1000 Sabores — Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
