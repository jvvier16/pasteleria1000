/**
 * Componente: Login
 *
 * Este componente maneja la autenticación de usuarios en la aplicación.
 * Características principales:
 * - Autenticación contra el backend con JWT
 * - Validación de formularios
 * - Manejo de sesiones con localStorage
 * - Redirección basada en roles
 * - Interfaz de usuario amigable con feedback visual
 *
 * Flujo de autenticación:
 * 1. Usuario ingresa credenciales
 * 2. Se validan los datos localmente
 * 3. Se envía petición al backend /api/v2/auth/login
 * 4. Se recibe token JWT y datos del usuario
 * 5. Se guarda token y sesión en localStorage
 * 6. Se redirige según el rol del usuario
 */
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { login as apiLogin } from "../utils/apiHelper";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ userOrEmail: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [logged, setLogged] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Validación del formulario
  const validate = () => {
    const e = {};
    const userOrEmail = form.userOrEmail.trim();

    // Validación de usuario/email
    if (!userOrEmail) {
      e.userOrEmail = "Ingresa usuario o email";
    } else if (
      userOrEmail.includes("@") &&
      !userOrEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    ) {
      e.userOrEmail = "Ingresa un email válido";
    }

    // Validación de contraseña
    if (!form.password) {
      e.password = "Ingresa la contraseña";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // 🚪 Submit login
  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setLogged(null);
    setErrors({});

    try {
      // Llamada al backend usando apiHelper
      const response = await apiLogin(form.userOrEmail, form.password);

      // El backend devuelve: { status, message, data: { token, userId, nombre, correo, role } }
      const userData = response.data;

      if (!userData || !userData.token) {
        throw { status: 400, message: "Respuesta inválida del servidor" };
      }

      // Guardar token JWT en localStorage (para que apiHelper lo use)
      localStorage.setItem("token", userData.token);

      // Crear objeto de sesión
      const session = {
        id: userData.userId,
        nombre: userData.nombre || "Usuario",
        correo: userData.correo || form.userOrEmail,
        imagen: userData.imagen || null,
        role: userData.role || "user",
        token: userData.token,
      };

      // Guardar sesión usando AuthContext
      login(session);

      // Marcar login como exitoso
      setLogged(true);
      setErrors({});

      // Redirigir según rol o página de origen
      setTimeout(() => {
        const fromPath = location?.state?.from?.pathname;
        if (fromPath) {
          navigate(fromPath);
          return;
        }
        // Redirigir según el rol
        const role = (userData.role || "user").toLowerCase();
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "vendedor") {
          navigate("/vendedor");
        } else {
          navigate("/");
        }
      }, 0);

    } catch (error) {
      console.error("Error de autenticación:", error);
      setLogged(false);

      // Manejar errores específicos del backend
      if (error.status === 401) {
        // Credenciales inválidas
        setErrors({ 
          userOrEmail: "Credenciales inválidas",
          password: "Verifica tu correo y contraseña" 
        });
      } else if (error.status === 403) {
        // Usuario desactivado
        setErrors({ 
          userOrEmail: "Tu cuenta ha sido desactivada. Contacta al administrador." 
        });
      } else if (error.message) {
        // Otro error del backend
        setErrors({ userOrEmail: error.message });
      } else {
        // Error de conexión o desconocido
        setErrors({ 
          userOrEmail: "Error de conexión. Verifica tu conexión a internet." 
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

        <h3 className="mb-3 text-center">Iniciar Sesión</h3>

        {logged === true && (
          <div className="alert alert-success">Has ingresado correctamente</div>
        )}
        {logged === false && (
          <div className="alert alert-danger">Error al iniciar sesión</div>
        )}

        <form
          onSubmit={onSubmit}
          onReset={(e) => {
            e.preventDefault();
            setForm({ userOrEmail: "", password: "" });
            setErrors({});
            setLogged(null);
            setShowPassword(false);
          }}
          noValidate
        >
          {/* Usuario o correo */}
          <div className="mb-3">
            <label className="form-label" htmlFor="userOrEmail">
              Correo Electrónico
            </label>
            <input
              id="userOrEmail"
              type="email"
              className={`form-control ${
                errors.userOrEmail ? "is-invalid" : ""
              }`}
              placeholder="ejemplo@correo.cl"
              value={form.userOrEmail}
              onChange={(e) =>
                setForm({ ...form, userOrEmail: e.target.value })
              }
              disabled={isLoading}
              data-testid="login-username"
              aria-invalid={errors.userOrEmail ? "true" : "false"}
            />
            {errors.userOrEmail && (
              <div className="invalid-feedback" role="alert">
                {errors.userOrEmail}
              </div>
            )}
          </div>

          {/* Contraseña */}
          <div className="mb-3 position-relative">
            <label className="form-label">Contraseña</label>
            <div className="input-group">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`form-control ${
                  errors.password ? "is-invalid" : ""
                }`}
                placeholder="********"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={isLoading}
                data-testid="login-password"
                aria-invalid={errors.password ? "true" : "false"}
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
            {errors.password && (
              <div className="invalid-feedback d-block">{errors.password}</div>
            )}
          </div>

          <div className="d-grid gap-2 mt-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              data-testid="login-submit"
              role="button"
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </button>
            <button
              type="reset"
              className="btn btn-secondary"
              disabled={isLoading}
              data-testid="login-reset"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
