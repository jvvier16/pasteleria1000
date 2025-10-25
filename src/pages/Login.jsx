// Login: formulario de autenticación local.
// - Combina datos de `Usuarios.json` con `usuarios_local` (localStorage).
// - En caso de credenciales válidas guarda `session_user` en localStorage con role.
import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import usuariosData from "../data/Usuarios.json";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ userOrEmail: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [logged, setLogged] = useState(null);
  const [usuarios, setUsuarios] = useState([]); // ahora tendrá JSON + localStorage
  const navigate = useNavigate();

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
    if (!form.userOrEmail.trim()) e.userOrEmail = "Ingresa usuario o email";
    if (!form.password) e.password = "Ingresa la contraseña";
    else if (form.password.length < 12)
      e.password = "La contraseña debe tener al menos 12 caracteres";
    else if (form.password.length > 18)
      e.password = "La contraseña debe tener como máximo 18 caracteres";
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
      setErrors({ ...errors, userOrEmail: "Usuario o email no registrado" });
      return;
    }

    // Validar contraseña
    const expected = found.contrasena || "";
    if (expected !== form.password) {
      setLogged(false);
      setErrors({ ...errors, password: "Contraseña incorrecta" });
      return;
    }

    // Guardar session_user con el role real del usuario encontrado
    try {
      const session = {
        id: found.id,
        nombre:
          (found.nombre || "") + (found.apellido ? " " + found.apellido : "") ||
          "Usuario",
        correo: found.correo || form.userOrEmail,
        imagen: found.imagen || null,
        role: found.role || "user", // <-- IMPORTANTE CAMBIO AQUÍ
      };

      localStorage.setItem("session_user", JSON.stringify(session));
      window.dispatchEvent(new Event("storage"));

      // Redirigir si es admin
      if (session.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
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
          onReset={() => {
            setForm({ userOrEmail: "", password: "" });
            setErrors({});
            setLogged(null);
            setShowPassword(false);
          }}
          noValidate
        >
          {/* Usuario o correo */}
          <div className="mb-3">
            <label className="form-label">Usuario o Correo</label>
            <input
              type="text"
              className={`form-control ${
                errors.userOrEmail ? "is-invalid" : ""
              }`}
              placeholder="ejemplo@correo.cl"
              value={form.userOrEmail}
              onChange={(e) =>
                setForm({ ...form, userOrEmail: e.target.value })
              }
            />
            {errors.userOrEmail && (
              <div className="invalid-feedback">{errors.userOrEmail}</div>
            )}
          </div>

          {/* Contraseña */}
          <div className="mb-3 position-relative">
            <label className="form-label">Contraseña</label>
            <div className="input-group">
              <input
                minLength={12}
                maxLength={18}
                type={showPassword ? "text" : "password"}
                className={`form-control ${
                  errors.password ? "is-invalid" : ""
                }`}
                placeholder="********"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            <button type="submit" className="btn btn-primary">
              Ingresar
            </button>
            <button type="reset" className="btn btn-secondary">
              Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
