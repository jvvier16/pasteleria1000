# Servidor de ejemplo PayPal (sandbox)

Este servidor minimalista permite crear y capturar órdenes PayPal desde el servidor (recomendado para producción).

Requisitos
- Node.js 14+

Instalación
```powershell
cd server
npm install
```

Configurar credenciales (sandbox)
- Copia `.env.example` a `.env` y completa `PAYPAL_CLIENT_ID` y `PAYPAL_SECRET` con las credenciales de tu app sandbox en https://developer.paypal.com

Ejecutar
```powershell
# en la carpeta server
npm run start
# o en desarrollo con nodemon
npm run dev
```

Endpoints
- POST /api/create-order  -> Crear orden en PayPal
  body: { total: number|string, currency?: string, items?: [{name, unit_amount, quantity}] }
  devuelve el objeto de orden (incluye id y enlaces)

- POST /api/capture-order -> Capturar orden en PayPal
  body: { orderID: string }
  devuelve el resultado de la captura

Notas de seguridad
- Nunca publiques `PAYPAL_SECRET` en el cliente ni en repositorios públicos.
- En producción, valida montos y artículos en el servidor antes de crear la orden.

Uso con el frontend
- En vez de usar `actions.order.create(...)` del SDK con montos en el cliente, llama a `/api/create-order` para crear la orden y devuelve `order.id` al cliente.
- Luego en `onApprove` puedes capturar con `/api/capture-order` si quieres capturar en tu backend, o usar `actions.order.capture()` en el cliente pero validando en servidor después.
