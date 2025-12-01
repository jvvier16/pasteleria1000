import React from 'react'
import { useApiHealth } from '../context/ApiHealthContext'
import './ApiDown.css'

export default function ApiDown() {
  const { healthy, checking, retry } = useApiHealth()

  if (healthy) return null

  return (
    <div className="api-down-overlay" role="alert">
      <div className="api-down-box">
        <h2>Servicio no disponible</h2>
        <p>La aplicación requiere conexión con la base de datos / API para funcionar. Estamos intentando reconectar.</p>
        <div className="api-down-actions">
          <button onClick={retry}>Reintentar ahora</button>
        </div>
        <p className="muted">Si el problema persiste, verifica que el servidor y la base de datos estén activos.</p>
      </div>
    </div>
  )
}
