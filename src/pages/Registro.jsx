/**
 * Componente: Registro
 *
 * Este componente maneja el registro de nuevos usuarios en la aplicación.
 * Características principales:
 * - Formulario completo de registro con validaciones
 * - Registro contra el backend con JWT
 * - Validación de edad (18+ años)
 * - Validación de contraseña
 * - Creación automática de sesión post-registro
 *
 * Flujo de registro:
 * 1. Usuario completa el formulario
 * 2. Se validan todos los campos localmente
 * 3. Se envía petición al backend /api/v2/auth/registro
 * 4. Se recibe token JWT y datos del usuario
 * 5. Se guarda token y sesión en localStorage
 * 6. Se inicia sesión automáticamente
 * 7. Se redirige al inicio
 */
import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registro as apiRegistro } from "../utils/apiHelper";
import { Eye, EyeOff } from "lucide-react";

const Registro = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validarFechaNacimiento = (fechaStr) => {
    if (!fechaStr) return "La fecha de nacimiento es obligatoria";
    
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

  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return "Formato de email inválido";
    return null;
  };

  const validarContrasena = (pass) => {
    if (!pass) return "La contraseña es obligatoria";
    if (pass.length < 6) return "La contraseña debe tener al menos 6 caracteres";
    return null;
  };

  const handleSubmit = async (e) => {
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

    setIsLoading(true);
    setErrors({});

    try {
      // Preparar datos para el backend
      const datosRegistro = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        correo: formData.correo.trim().toLowerCase(),
        contrasena: formData.contrasena,
        fechaNacimiento: formData.fechaNacimiento,
        direccion: formData.direccion.trim(),
      };

      // Llamada al backend usando apiHelper
      const response = await apiRegistro(datosRegistro);

      // El backend devuelve: { status, message, data: { token, userId, nombre, correo, role } }
      const userData = response.data;

      if (!userData || !userData.token) {
        throw { status: 400, message: "Respuesta inválida del servidor" };
      }

      // Guardar token JWT en localStorage
      localStorage.setItem("token", userData.token);

      // Crear objeto de sesión
      const session = {
        id: userData.userId,
        nombre: userData.nombre || `${formData.nombre} ${formData.apellido}`,
        correo: userData.correo || formData.correo,
        imagen: null,
        role: userData.role || "user",
        token: userData.token,
      };

      // Guardar sesión usando AuthContext (inicia sesión automáticamente)
      login(session);

      // Mostrar mensaje de éxito
      setRegistroExitoso(true);

      // Redirigir al inicio después de un breve mensaje
      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (error) {
      console.error("Error de registro:", error);

      // Manejar errores específicos del backend
      if (error.status === 400) {
        // Puede ser correo duplicado u otro error de validación
        if (error.message?.toLowerCase().includes("correo") || 
            error.message?.toLowerCase().includes("registrado")) {
          setErrors({ correo: "Este correo ya está registrado" });
        } else {
          setErrors({ correo: error.message || "Error en los datos de registro" });
        }
      } else if (error.message) {
        setErrors({ correo: error.message });
      } else {
        setErrors({ 
          correo: "Error de conexión. Verifica tu conexión a internet." 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="card p-4 shadow login-card card-max-420">
        <div className="login-header mb-3">
          <img
            src={new URL("../assets/img/logo.png", import.meta.url).href}
            alt="logo"
            className="mx-auto d-block logo-100"
          />
        </div>

        <h3 className="mb-3 text-center">Registro</h3>

        {registroExitoso && (
          <div
            className="alert alert-success"
            role="alert"
            data-testid="registro-exitoso"
          >
            ¡Registro exitoso! Iniciando sesión...
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          data-testid="registro-form"
          noValidate
        >
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              Fecha de nacimiento
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
              disabled={isLoading}
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
              disabled={isLoading}
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
          <div className="mb-3 position-relative">
            <label htmlFor="contrasena" className="form-label">
              Contraseña
            </label>
            <div className="input-group">
              <input
                id="contrasena"
                type={showPassword ? "text" : "password"}
                name="contrasena"
                className={`form-control ${
                  errors.contrasena ? "is-invalid" : ""
                }`}
                value={formData.contrasena}
                onChange={handleChange}
                disabled={isLoading}
                required
                data-testid="registro-password"
                aria-invalid={errors.contrasena ? "true" : "false"}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.contrasena && (
              <div className="invalid-feedback d-block" role="alert">
                {errors.contrasena}
              </div>
            )}
          </div>

          {/* Repetir Contraseña */}
          <div className="mb-4">
            <label htmlFor="repetirContrasena" className="form-label">
              Repetir Contraseña
            </label>
            <div className="input-group">
              <input
                id="repetirContrasena"
                type={showConfirmPassword ? "text" : "password"}
                name="repetirContrasena"
                className={`form-control ${
                  errors.repetirContrasena ? "is-invalid" : ""
                }`}
                value={formData.repetirContrasena}
                onChange={handleChange}
                disabled={isLoading}
                required
                data-testid="registro-confirm-password"
                aria-invalid={errors.repetirContrasena ? "true" : "false"}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.repetirContrasena && (
              <div className="invalid-feedback d-block" role="alert">
                {errors.repetirContrasena}
              </div>
            )}
          </div>

          <div className="d-grid gap-2 mt-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              data-testid="registro-submit"
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registrando...
                </>
              ) : (
                "Registrar"
              )}
            </button>

            <button
              type="reset"
              className="btn btn-secondary"
              disabled={isLoading}
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registro;
