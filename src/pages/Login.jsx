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
import { Eye, EyeOff } from "lucide-react";
import usuariosData from "../data/Usuarios.json";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ userOrEmail: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [logged, setLogged] = useState(null);
  const [usuarios, setUsuarios] = useState([]); // ahora tendrá JSON + localStorage
  const navigate = useNavigate();
  const location = useLocation();

  //  Cargar usuarios desde JSON + localStorage
  useEffect(() => {
    try {
      // Leer local
      const rawLocal = localStorage.getItem("usuarios_local");
      const usuariosLocal = rawLocal ? JSON.parse(rawLocal) : [];

      // Si no existe, inicializar
      if (!rawLocal) {
        localStorage.setItem("usuarios_local", JSON.stringify([]));
      }

      // Preferir usuarios locales si existen, sino usar JSON
      // Evitamos concatenar ambos para prevenir duplicados cuando
      // `usuarios_local` contiene ya las entradas del JSON.
      setUsuarios(
        usuariosLocal && usuariosLocal.length ? usuariosLocal : usuariosData
      );
    } catch (err) {
      console.error("Error cargando usuarios", err);
      setUsuarios(usuariosData);
    }
  }, []);

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
  const onSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    // Normalizar comparaciones
    const normalized = (s) => (s || "").toString().toLowerCase();

    const matches = (u) => {
      const email = normalized(u.correo || u.email);
      const nombre = normalized(u.nombre || "");
      const nombreCompleto = normalized(
        ((u.nombre || "") + " " + (u.apellido || "")).trim()
      );
      const input = normalized(form.userOrEmail);
      return input === email || input === nombre || input === nombreCompleto;
    };

    // Buscar en la lista combinada
    const found = usuarios.find(matches);

    if (!found) {
      setLogged(false);
      setErrors({ userOrEmail: "Usuario o email no registrado" });
      return;
    }

    // Validar contraseña
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

      // Guardar sesión en localStorage
      localStorage.setItem("session_user", JSON.stringify(session));

      // Disparar eventos para notificar el inicio de sesión
      // Primero el evento personalizado para actualizar el estado
      window.dispatchEvent(
        new CustomEvent("userLogin", {
          detail: session,
          bubbles: true,
          cancelable: true,
        })
      );

      // Luego el evento de storage para persistencia
      window.dispatchEvent(new Event("storage"));

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
