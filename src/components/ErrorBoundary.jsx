// ErrorBoundary: componente de clase que captura errores durante el render y muestra
// un mensaje de diagnóstico. Útil para evitar pantallas en blanco y obtener
// contexto del stack cuando un componente lanza una excepción.
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // guardar para mostrar detalles y loguear en consola
    this.setState({ error, info });
    // también lo dejamos visible en consola para debugging
    // eslint-disable-next-line no-console
    console.error("Captured by ErrorBoundary:", error, info);
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <div className="error-boundary">
          <h2>Ha ocurrido un error en la aplicación</h2>
          <p>
            Este mensaje aparece porque un componente lanzó una excepción al
            renderizar.
          </p>
          <div className="error-box">
            <strong>Error:</strong>
            <div className="error-text">
              {String(error && (error.message || error))}
            </div>
            {info && info.componentStack && (
              <details>
                <summary>Detalles del stack</summary>
                <pre className="pre-wrap">{info.componentStack}</pre>
              </details>
            )}
          </div>
          <p className="mt-12">
            Recomendación: abre la consola del navegador (F12) y copia el error
            completo aquí para que lo revise.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
