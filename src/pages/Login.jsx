/**
 * Componente: Login
 *
 * Este componente maneja la autenticación de usuarios en la aplicación.
 * Características principales:
 * - Combina usuarios de JSON y localStorage para autenticación
 * - Validación completa de formularios
 * - Manejo de sesiones con localStorage
 * - Redirección basada en roles
 * - Interfaz de usuario amigable con feedback visual
 *
 * Flujo de autenticación:
 * 1. Usuario ingresa credenciales
 * 2. Se validan los datos localmente
 * 3. Se busca el usuario en la base de datos combinada
 * 4. Se verifica la contraseña
 * 5. Se crea la sesión y se almacena
 * 6. Se redirige según el rol del usuario
 */
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { UsuarioService } from "../services/dataService";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ userOrEmail: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [logged, setLogged] = useState(null);
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
    } else {
      if (form.password.length < 12) {
        e.password = "La contraseña debe tener al menos 12 caracteres";
      } else if (form.password.length > 18) {
        e.password = "La contraseña debe tener como máximo 18 caracteres";
      } else if (!/[A-Z]/.test(form.password)) {
        e.password = "La contraseña debe contener al menos una mayúscula";
      } else if (!/[a-z]/.test(form.password)) {
        e.password = "La contraseña debe contener al menos una minúscula";
      } else if (!/\d/.test(form.password)) {
        e.password = "La contraseña debe contener al menos un número";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // 🚪 Submit login
  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    // Primero intentamos autenticación en el servidor (si está disponible)
    const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8094'
    try {
      const resp = await fetch(`${API_BASE}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userOrEmail: form.userOrEmail, password: form.password })
      })
      if (resp.ok) {
        const payload = await resp.json()
        let found = payload && payload.user ? payload.user : payload
        const token = payload && payload.token ? payload.token : null
        // server returns user object without password
        const session = {
          id: found.id,
          nombre: (found.nombre || '') + (found.apellido ? ' ' + found.apellido : '') || 'Usuario',
          correo: found.correo || form.userOrEmail,
          imagen: found.imagen || null,
          role: found.role || 'user',
          token: token,
        }
        login(session)
        setLogged(true)
        setErrors({})
        setTimeout(() => {
          const fromPath = location?.state?.from?.pathname
          if (fromPath) { navigate(fromPath); return }
          if (session.role === 'admin') navigate('/admin'); else navigate('/')
        }, 0)
        return
      }
    } catch (e) {
      // Si falla la llamada al servidor, caemos a autenticación local
      console.warn('Server login failed, falling back to local auth', e.message)
    }

    // Fallback: Usar UsuarioService para buscar el usuario (local)
    const found = UsuarioService.findBy(form.userOrEmail);

    if (!found) {
      setLogged(false);
      setErrors({ userOrEmail: "Usuario o email no registrado" });
      return;
    }

    // Validar contraseña (local)
    const expected = found.contrasena || "";
    if (expected !== form.password) {
      setLogged(false);
      setErrors({ password: "Contraseña incorrecta" });
      return;
    }

    // Guardar session_user con el role real del usuario encontrado
    try {
      // Resolve imagen: allow JSON to provide a relative asset path like
      // "../assets/img/segunda.jpeg" and convert it to an absolute URL
      let imagenUrl = null;
      try {
        if (found.imagen) {
          const raw = String(found.imagen);
          if (raw.startsWith("data:") || raw.startsWith("http") || raw.startsWith("/")) {
            imagenUrl = raw;
          } else {
            imagenUrl = new URL(raw, import.meta.url).href;
          }
        }
      } catch (err) {
        imagenUrl = found.imagen || null;
      }

      const session = {
        id: found.id,
        nombre:
          (found.nombre || "") + (found.apellido ? " " + found.apellido : "") ||
          "Usuario",
        correo: found.correo || form.userOrEmail,
        imagen: imagenUrl,
        role: found.role || "user",
      };

      // Guardar sesión usando AuthContext (centraliza storage y eventos)
      login(session);

      // Marcar login como exitoso antes de redirigir para que los tests
      // y la UI muestren el feedback. Luego navegar en un tick.
      setLogged(true);
      setErrors({});

      setTimeout(() => {
        // If the user was redirected here by RequireAuth, go back to the original page
        const fromPath = location?.state?.from?.pathname;
        if (fromPath) {
          navigate(fromPath);
          return;
        }
        if (session.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }, 0);
    } catch (err) {
      console.error("No se pudo guardar session_user", err);
    }

    setLogged(true);
    setErrors({});
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
              Usuario o Correo
            </label>
            <input
              id="userOrEmail"
              type="text"
              className={`form-control ${
                errors.userOrEmail ? "is-invalid" : ""
              }`}
              placeholder="ejemplo@correo.cl"
              value={form.userOrEmail}
              onChange={(e) =>
                setForm({ ...form, userOrEmail: e.target.value })
              }
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
                minLength={12}
                maxLength={18}
                type={showPassword ? "text" : "password"}
                className={`form-control ${
                  errors.password ? "is-invalid" : ""
                }`}
                placeholder="********"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                data-testid="login-password"
                aria-invalid={errors.password ? "true" : "false"}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
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
              data-testid="login-submit"
              role="button"
            >
              Ingresar
            </button>
            <button
              type="reset"
              className="btn btn-secondary"
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
