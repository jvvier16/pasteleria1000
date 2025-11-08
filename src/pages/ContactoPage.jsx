// Contacto: formulario de contacto con validación cliente y enlaces a redes sociales.
// - Validación mínima en el cliente; el envío es simulado y muestra un mensaje temporal.
import React, { useState } from "react";

function Contacto() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Ingresa tu nombre";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email inválido";
    if (form.message.trim().length < 10)
      e.message = "Escribe al menos 10 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    // Persistir mensaje en localStorage para que admin lo vea en "Reportes"
    try {
      const raw = localStorage.getItem("reportes_contacto");
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({
        id: `MSG-${Date.now()}`,
        nombre: form.name,
        correo: form.email,
        mensaje: form.message,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("reportes_contacto", JSON.stringify(arr));
      // notificar cambios: emitir storage (compat) y un evento personalizado para la misma pestaña
      try {
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}
      try {
        window.dispatchEvent(new Event("reportes:updated"));
      } catch (e) {}
    } catch (err) {
      console.error("No se pudo guardar el mensaje de contacto", err);
    }

    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="container my-5">
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h2 className="card-title mb-3">Contacto</h2>
              <p className="text-muted mb-4">
                ¿Tienes alguna pregunta o quieres encargar un pastel? Escríbenos
                y te responderemos pronto.
              </p>

              <form onSubmit={onSubmit} noValidate>
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    className={`form-control ${
                      errors.name ? "is-invalid" : ""
                    }`}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${
                      errors.email ? "is-invalid" : ""
                    }`}
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label form-label--strong">
                    Mensaje
                  </label>
                  <textarea
                    rows={5}
                    className={`form-control ${
                      errors.message ? "is-invalid" : ""
                    }`}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                  />
                  {errors.message && (
                    <div className="invalid-feedback">{errors.message}</div>
                  )}
                </div>

                <div className="d-flex align-items-center">
                  <button type="submit" className="btn btn-primary me-3">
                    Enviar mensaje
                  </button>
                  {sent && (
                    <div className="text-success">Mensaje enviado</div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-4">
              <h5 className="mb-3">Nuestra tienda</h5>
              <p className="mb-1">
                <strong>Dirección:</strong> Av. Principal 123, Santiago
              </p>
              <p className="mb-1">
                <strong>Teléfono:</strong> +56 9 1234 5678
              </p>
              <p className="mb-0">
                <strong>Horario:</strong> Lun-Sab 9:00 - 20:00
              </p>
            </div>
          </div>

          <div className="card shadow-sm border-0 p-3">
            <h6 className="mb-3">Contáctanos en redes</h6>
            <div className="d-flex gap-2">
              <a
                className="btn btn-instagram text-white flex-grow-1 py-2"
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
              <a
                className="btn btn-whatsapp text-white flex-grow-1 py-2"
                href="https://wa.me/56912345678"
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <a
                className="btn btn-facebook text-white flex-grow-1 py-2"
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contacto;
