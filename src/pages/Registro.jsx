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
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.contrasena !== formData.repetirContrasena) {
      setErrors({ repetirContrasena: "Las contraseñas no coinciden" });
      return;
    }
    // Validación adicional: longitud de contraseña (coherente con Login)
    if (formData.contrasena.length < 12 || formData.contrasena.length > 18) {
      setErrors({
        contrasena: "La contraseña debe tener entre 12 y 18 caracteres",
      });
      return;
    }

    // Leer usuarios existentes desde localStorage (persistencia de usuarios creados por la app)
    const localRaw = localStorage.getItem("usuarios_local");
    let local = [];
    try {
      local = localRaw ? JSON.parse(localRaw) : [];
    } catch (err) {
      console.error("Error parseando usuarios_local", err);
      local = [];
    }

    // Validar email duplicado (en Usuarios.json y en local)
    const emailLower = (formData.correo || "").toLowerCase();
    const dupInJson = usuariosData.some(
      (u) => (u.correo || "").toLowerCase() === emailLower
    );
    const dupInLocal = local.some(
      (u) => (u.correo || "").toLowerCase() === emailLower
    );
    if (dupInJson || dupInLocal) {
      setErrors({ correo: "Este correo ya está registrado" });
      return;
    }

    // Determinar nuevo id único usando Usuarios.json + local
    const idsJson = usuariosData.map((u) => u.id || 0);
    const idsLocal = local.map((u) => u.id || 0);
    const maxId = Math.max(0, ...idsJson, ...idsLocal);
    const nuevoId = maxId + 1;

    const nuevoUsuario = {
      id: nuevoId,
      nombre: formData.nombre,
      apellido: formData.apellido,
      correo: formData.correo,
      contrasena: formData.contrasena,
    };

    local.push(nuevoUsuario);
    try {
      localStorage.setItem("usuarios_local", JSON.stringify(local));
    } catch (err) {
      console.error("No se pudo guardar usuario en localStorage", err);
      alert("Error al guardar usuario. Intenta nuevamente.");
      return;
    }
    // guardar sesión automáticamente
    try {
      localStorage.setItem(
        "session_user",
        JSON.stringify({
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          correo: nuevoUsuario.correo,
        })
      );
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("No se pudo guardar session_user", err);
    }
    alert(`Registro exitoso de ${formData.nombre} ${formData.apellido}`);
    // Redirigir al inicio o donde prefieras
    navigate("/");
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-muted">
      <div className="p-4 rounded-4 shadow bg-white" style={{ width: "380px" }}>
        <h3
          className="text-center mb-4 text-accent"
          style={{ fontFamily: "cursive" }}
        >
          Registro
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-accent">Nombre</label>
            <input
              type="text"
              name="nombre"
              className="form-control"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-accent">Apellido</label>
            <input
              type="text"
              name="apellido"
              className="form-control"
              value={formData.apellido}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-accent">Correo</label>
            <input
              type="email"
              name="correo"
              className="form-control"
              value={formData.correo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-accent">Contraseña</label>
            <input
              type="password"
              name="contrasena"
              className="form-control"
              value={formData.contrasena}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-accent">Repetir Contraseña</label>
            <input
              type="password"
              name="repetirContrasena"
              className="form-control"
              value={formData.repetirContrasena}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn w-100 text-white fw-semibold btn-submit"
            style={{ fontSize: "16px" }}
          >
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registro;
