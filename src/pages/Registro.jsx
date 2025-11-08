/**
 * Componente: Registro
 *
 * Este componente maneja el registro de nuevos usuarios en la aplicación.
 * Características principales:
 * - Formulario completo de registro con validaciones
 * - Verificación de duplicados en JSON y localStorage
 * - Validación de edad (18+ años)
 * - Validación de contraseña
 * - Persistencia en localStorage
 * - Creación automática de sesión post-registro
 *
 * Flujo de registro:
 * 1. Usuario completa el formulario
 * 2. Se validan todos los campos
 * 3. Se verifica que el correo no esté duplicado
 * 4. Se crea el nuevo usuario con rol "user"
 * 5. Se guarda en localStorage
 * 6. Se inicia sesión automáticamente
 * 7. Se redirige al inicio
 */
import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import usuariosData from "../data/Usuarios.json";

const Registro = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    repetirContrasena: "",
    fechaNacimiento: "",
    direccion: "",
  });
  const [errors, setErrors] = useState({});
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validarFechaNacimiento = (fechaStr) => {
    // Aceptar YYYY-MM-DD o DD-MM-YYYY (normalizaremos a YYYY-MM-DD)
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    const ddmmyyyyRegex = /^\d{2}-\d{2}-\d{4}$/;
    let fecha;

    if (isoRegex.test(fechaStr)) {
      fecha = new Date(fechaStr);
    } else if (ddmmyyyyRegex.test(fechaStr)) {
      // convertir DD-MM-YYYY a YYYY-MM-DD para parseo seguro
      const [dd, mm, yyyy] = fechaStr.split("-");
      fecha = new Date(`${yyyy}-${mm}-${dd}`);
    } else {
      return "Formato inválido (YYYY-MM-DD o DD-MM-YYYY)";
    }

    if (isNaN(fecha.getTime())) return "Fecha no válida";

    const hoy = new Date();
    const edad = hoy.getFullYear() - fecha.getFullYear();
    const m = hoy.getMonth() - fecha.getMonth();
    const ajustada =
      m < 0 || (m === 0 && hoy.getDate() < fecha.getDate()) ? edad - 1 : edad;

    if (ajustada < 18) return "Debe tener al menos 18 años";
    if (ajustada > 90) return "Edad máxima 90 años";

    return null;
  };

  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return "Formato de email inválido";
    return null;
  };

  const validarContrasena = (pass) => {
    if (pass.length < 12)
      return "La contraseña debe tener al menos 12 caracteres";
    if (pass.length > 18)
      return "La contraseña debe tener como máximo 18 caracteres";
    if (!/[A-Z]/.test(pass))
      return "La contraseña debe contener al menos una mayúscula";
    if (!/[a-z]/.test(pass))
      return "La contraseña debe contener al menos una minúscula";
    if (!/\d/.test(pass))
      return "La contraseña debe contener al menos un número";
    return null;
  };

  // Normaliza una fecha a formato ISO YYYY-MM-DD si es posible
  const normalizeToISO = (fechaStr) => {
    if (!fechaStr) return fechaStr;
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    const ddmmyyyyRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (isoRegex.test(fechaStr)) return fechaStr;
    if (ddmmyyyyRegex.test(fechaStr)) {
      const [dd, mm, yyyy] = fechaStr.split("-");
      return `${yyyy}-${mm}-${dd}`;
    }
    // Fallback: intentar parsear con Date y formatear
    const d = new Date(fechaStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    return fechaStr;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let newErrors = {};

    // Validación nombre y apellido
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.apellido.trim())
      newErrors.apellido = "El apellido es obligatorio";

    // Validación email
    const emailError = validarEmail(formData.correo);
    if (emailError) newErrors.correo = emailError;

    // Validación contraseña
    const passError = validarContrasena(formData.contrasena);
    if (passError) {
      newErrors.contrasena = passError;
    } else if (formData.contrasena !== formData.repetirContrasena) {
      newErrors.repetirContrasena = "Las contraseñas no coinciden";
    }

    // Validación fecha nacimiento
    const errFecha = validarFechaNacimiento(formData.fechaNacimiento);
    if (errFecha) newErrors.fechaNacimiento = errFecha;

    // Validación campos vacíos extra
    if (!formData.direccion?.trim()) {
      newErrors.direccion = "La dirección es obligatoria";
    }

    // Si hay errores se detiene
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Leer usuarios del localStorage
    const localRaw = localStorage.getItem("usuarios_local");
    let local = [];
    try {
      local = localRaw ? JSON.parse(localRaw) : [];
    } catch {
      local = [];
    }

    // Validar mail duplicado
    const emailLower = formData.correo.toLowerCase();
    const dupInJson = usuariosData.some(
      (u) => u.correo.toLowerCase() === emailLower
    );
    const dupInLocal = local.some((u) => u.correo.toLowerCase() === emailLower);
    if (dupInJson || dupInLocal) {
      setErrors({ correo: "Este correo ya está registrado" });
      return;
    }

    // Nuevo ID
    const idsJson = usuariosData.map((u) => u.id || 0);
    const idsLocal = local.map((u) => u.id || 0);
    const maxId = Math.max(0, ...idsJson, ...idsLocal);
    const nuevoId = maxId + 1;

    // Crear usuario (normalizar fecha a YYYY-MM-DD)
    const fechaNorm = normalizeToISO(formData.fechaNacimiento);
    const nuevoUsuario = {
      id: nuevoId,
      nombre: formData.nombre,
      apellido: formData.apellido,
      correo: formData.correo,
      contrasena: formData.contrasena,
      fechaNacimiento: fechaNorm,
      direccion: formData.direccion,
      role: "user",
    };

    local.push(nuevoUsuario);
    localStorage.setItem("usuarios_local", JSON.stringify(local));

    // Guardar sesión
    // Notificar éxito y redirigir a login
    setRegistroExitoso(true);
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-muted">
      <div className="p-4 rounded-4 shadow bg-white card-max-380">
        <h3 className="text-center mb-4 font-cursive">Registro</h3>

        {registroExitoso && (
          <div
            className="alert alert-success"
            role="alert"
            data-testid="registro-exitoso"
          >
            ¡Registro exitoso! Redirigiendo al login...
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="registro-form">
          {/* Nombre */}
          <div className="mb-3">
            <label htmlFor="nombre" className="form-label">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
              value={formData.nombre}
              onChange={handleChange}
              required
              data-testid="registro-nombre"
              aria-invalid={errors.nombre ? "true" : "false"}
            />
            {errors.nombre && (
              <div className="invalid-feedback" role="alert">
                {errors.nombre}
              </div>
            )}
          </div>

          {/* Apellido */}
          <div className="mb-3">
            <label htmlFor="apellido" className="form-label">
              Apellido
            </label>
            <input
              id="apellido"
              type="text"
              name="apellido"
              className={`form-control ${errors.apellido ? "is-invalid" : ""}`}
              value={formData.apellido}
              onChange={handleChange}
              required
              data-testid="registro-apellido"
              aria-invalid={errors.apellido ? "true" : "false"}
            />
            {errors.apellido && (
              <div className="invalid-feedback" role="alert">
                {errors.apellido}
              </div>
            )}
          </div>

          {/* Correo */}
          <div className="mb-3">
            <label htmlFor="correo" className="form-label">
              Correo
            </label>
            <input
              id="correo"
              type="email"
              name="correo"
              className={`form-control ${errors.correo ? "is-invalid" : ""}`}
              value={formData.correo}
              onChange={handleChange}
              required
              data-testid="registro-email"
              aria-invalid={errors.correo ? "true" : "false"}
            />
            {errors.correo && (
              <div className="invalid-feedback" role="alert">
                {errors.correo}
              </div>
            )}
          </div>

          {/* Fecha Nacimiento */}
          <div className="mb-3">
            <label htmlFor="fechaNacimiento" className="form-label">
              Fecha de nacimiento (YYYY-MM-DD)
            </label>
            <input
              id="fechaNacimiento"
              type="date"
              name="fechaNacimiento"
              className={`form-control ${
                errors.fechaNacimiento ? "is-invalid" : ""
              }`}
              value={formData.fechaNacimiento}
              onChange={handleChange}
              required
              data-testid="registro-fecha"
              aria-invalid={errors.fechaNacimiento ? "true" : "false"}
            />
            {errors.fechaNacimiento && (
              <div className="invalid-feedback" role="alert">
                {errors.fechaNacimiento}
              </div>
            )}
          </div>

          {/* Dirección */}
          <div className="mb-3">
            <label htmlFor="direccion" className="form-label">
              Dirección
            </label>
            <input
              id="direccion"
              type="text"
              name="direccion"
              className={`form-control ${errors.direccion ? "is-invalid" : ""}`}
              value={formData.direccion}
              onChange={handleChange}
              required
              data-testid="registro-direccion"
              aria-invalid={errors.direccion ? "true" : "false"}
            />
            {errors.direccion && (
              <div className="invalid-feedback" role="alert">
                {errors.direccion}
              </div>
            )}
          </div>

          {/* Contraseña */}
          <div className="mb-3">
            <label htmlFor="contrasena" className="form-label">
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              name="contrasena"
              className={`form-control ${
                errors.contrasena ? "is-invalid" : ""
              }`}
              value={formData.contrasena}
              onChange={handleChange}
              required
              minLength={12}
              maxLength={18}
              data-testid="registro-password"
              aria-invalid={errors.contrasena ? "true" : "false"}
            />
            {errors.contrasena && (
              <div className="invalid-feedback" role="alert">
                {errors.contrasena}
              </div>
            )}
          </div>

          {/* Repetir Contraseña */}
          <div className="mb-4">
            <label htmlFor="repetirContrasena" className="form-label">
              Repetir Contraseña
            </label>
            <input
              id="repetirContrasena"
              type="password"
              name="repetirContrasena"
              className={`form-control ${
                errors.repetirContrasena ? "is-invalid" : ""
              }`}
              value={formData.repetirContrasena}
              onChange={handleChange}
              required
              minLength={12}
              maxLength={18}
              data-testid="registro-confirm-password"
              aria-invalid={errors.repetirContrasena ? "true" : "false"}
            />
            {errors.repetirContrasena && (
              <div className="invalid-feedback" role="alert">
                {errors.repetirContrasena}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-dark w-100"
            data-testid="registro-submit"
          >
            Registrar
          </button>

          <button
            type="reset"
            className="btn btn-secondary w-100 mt-2"
            data-testid="registro-reset"
            onClick={() => {
              setFormData({
                nombre: "",
                apellido: "",
                correo: "",
                contrasena: "",
                repetirContrasena: "",
                fechaNacimiento: "",
                direccion: "",
              });
              setErrors({});
              setRegistroExitoso(false);
            }}
          >
            Limpiar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registro;
