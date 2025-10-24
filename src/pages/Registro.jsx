// Registro: formulario para crear un nuevo usuario y guardarlo en localStorage.
// - Valida campos mínimos y evita emails duplicados (compara JSON + usuarios_local).
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validarFechaNacimiento = (fechaStr) => {
    // formato YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(fechaStr)) return "Formato inválido (YYYY-MM-DD)";

    const fecha = new Date(fechaStr);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    let newErrors = {};

    // Validación contraseña
    if (formData.contrasena !== formData.repetirContrasena) {
      newErrors.repetirContrasena = "Las contraseñas no coinciden";
    }
    if (formData.contrasena.length < 12 || formData.contrasena.length > 18) {
      newErrors.contrasena =
        "La contraseña debe tener entre 12 y 18 caracteres";
    }

    // Validación fecha nacimiento
    const errFecha = validarFechaNacimiento(formData.fechaNacimiento);
    if (errFecha) newErrors.fechaNacimiento = errFecha;

    // Validación campos vacíos extra
    if (!formData.direccion.trim()) {
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

    // Crear usuario
    const nuevoUsuario = {
      id: nuevoId,
      nombre: formData.nombre,
      apellido: formData.apellido,
      correo: formData.correo,
      contrasena: formData.contrasena,
      fechaNacimiento: formData.fechaNacimiento,
      direccion: formData.direccion,
      role: "user",
    };

    local.push(nuevoUsuario);
    localStorage.setItem("usuarios_local", JSON.stringify(local));

    // Guardar sesión
    localStorage.setItem(
      "session_user",
      JSON.stringify({
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
      })
    );
    window.dispatchEvent(new Event("storage"));

    alert(`Registro exitoso de ${formData.nombre} ${formData.apellido}`);
    navigate("/");
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-muted">
      <div className="p-4 rounded-4 shadow bg-white" style={{ width: "380px" }}>
        <h3 className="text-center mb-4" style={{ fontFamily: "cursive" }}>
          Registro
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              name="nombre"
              className="form-control"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          {/* Apellido */}
          <div className="mb-3">
            <label className="form-label">Apellido</label>
            <input
              type="text"
              name="apellido"
              className="form-control"
              value={formData.apellido}
              onChange={handleChange}
              required
            />
          </div>

          {/* Correo */}
          <div className="mb-3">
            <label className="form-label">Correo</label>
            <input
              type="email"
              name="correo"
              className="form-control"
              value={formData.correo}
              onChange={handleChange}
              required
            />
            {errors.correo && (
              <small className="text-danger">{errors.correo}</small>
            )}
          </div>

          {/* Fecha Nacimiento */}
          <div className="mb-3">
            <label className="form-label">
              Fecha de nacimiento (YYYY-MM-DD)
            </label>
            <input
              type="text"
              name="fechaNacimiento"
              className="form-control"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              required
            />
            {errors.fechaNacimiento && (
              <small className="text-danger">{errors.fechaNacimiento}</small>
            )}
          </div>

          {/* Dirección */}
          <div className="mb-3">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              name="direccion"
              className="form-control"
              value={formData.direccion}
              onChange={handleChange}
              required
            />
            {errors.direccion && (
              <small className="text-danger">{errors.direccion}</small>
            )}
          </div>

          {/* Contraseña */}
          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              name="contrasena"
              className="form-control"
              value={formData.contrasena}
              onChange={handleChange}
              required
            />
            {errors.contrasena && (
              <small className="text-danger">{errors.contrasena}</small>
            )}
          </div>

          {/* Repetir Contraseña */}
          <div className="mb-4">
            <label className="form-label">Repetir Contraseña</label>
            <input
              type="password"
              name="repetirContrasena"
              className="form-control"
              value={formData.repetirContrasena}
              onChange={handleChange}
              required
            />
            {errors.repetirContrasena && (
              <small className="text-danger">{errors.repetirContrasena}</small>
            )}
          </div>

          <button type="submit" className="btn btn-dark w-100">
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registro;
