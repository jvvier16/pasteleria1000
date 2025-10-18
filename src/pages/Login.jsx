import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import usuariosData from "../data/Usuarios.json";

export default function Login() {
  const [form, setForm] = useState({ userOrEmail: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [logged, setLogged] = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  // Cargar usuarios desde el JSON
  useEffect(() => {
    setUsuarios(usuariosData);
  }, []);

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

  const onSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const found = usuarios.find(
      (u) => u.username === form.userOrEmail || u.email === form.userOrEmail
    );

    if (!found) {
      setLogged(false);
      setErrors({ ...errors, userOrEmail: "Usuario o email no registrado" });
      return;
    }

    if (found.password !== form.password) {
      setLogged(false);
      setErrors({ ...errors, password: "Contraseña incorrecta" });
      return;
    }

    setLogged(true);
    setErrors({});
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="card p-4 shadow login-card"
        style={{
          maxWidth: 420,
          width: "100%",
          borderRadius: "1rem",
        }}
      >
        <div className="login-header mb-3">
          <img
            src={new URL("../assets/img/logo.png", import.meta.url).href}
            alt="logo"
            className="mx-auto d-block"
            style={{ width: "100px" }}
          />
        </div>

        <h3 className="mb-3 text-center">Iniciar Sesión</h3>

        {logged === true && (
          <div className="alert alert-success w-100">
            Has ingresado correctamente
          </div>
        )}
        {logged === false && (
          <div className="alert alert-danger w-100">
            Error al iniciar sesión
          </div>
        )}

        <form
          className="text-start"
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
            <label htmlFor="email" className="form-label">
              Usuario o Correo
            </label>
            <input
              id="email"
              type="text"
              className={`form-control ${
                errors.userOrEmail ? "is-invalid" : ""
              }`}
              placeholder="ejemplo@correo.cl"
              value={form.userOrEmail}
              onChange={(e) =>
                setForm({ ...form, userOrEmail: e.target.value })
              }
              required
            />
            {errors.userOrEmail && (
              <div className="invalid-feedback">{errors.userOrEmail}</div>
            )}
          </div>

          {/* Contraseña con botón mostrar/ocultar */}
          <div className="mb-3 position-relative">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
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
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <div className="invalid-feedback d-block">{errors.password}</div>
            )}
          </div>

          {/* Botones apilados */}
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
