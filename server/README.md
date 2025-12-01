# Servidor Pastelería 1000 (Express + SQLite)

Este servidor proporciona:
- **CRUD de Usuarios** (autenticación, registro)
- **CRUD de Pasteles** (gestión de productos)
- **CRUD de Pedidos** (historial de órdenes)
- **PayPal Integration** (crear y capturar órdenes)
- **SQLite Database** (persistencia local)

## Requisitos
- Node.js 14+
- npm

## Instalación

```powershell
cd server
npm install
```

## Configurar credenciales

Copia `.env.example` a `.env` y ajusta valores (ej. `PORT=8094`):

```
PAYPAL_CLIENT_ID=tu_client_id_sandbox
PAYPAL_SECRET=tu_secret_sandbox
PAYPAL_ENV=sandbox
PORT=8094
```

Obtén tus credenciales en: https://developer.paypal.com/dashboard

## Ejecutar

```powershell
# Producción
npm start

# Desarrollo (con auto-reload)
npm run dev
```

Servidor corriendo en: `http://localhost:8094` (por defecto, o según `PORT` en `.env`)

## Endpoints

### Salud
- `GET /api/health` → Verificar que el servidor está activo

### Usuarios
- `GET /api/usuarios` → Obtener todos los usuarios
- `POST /api/usuarios/login` → Login de usuario
  - Body: `{ userOrEmail: string, password: string }`
  - Response: `{ id, nombre, correo, role, imagen }`
  
- `POST /api/usuarios` → Crear usuario
  - Body: `{ nombre, apellido, correo, contrasena, role?, fechaNacimiento?, direccion?, imagen? }`

### Pasteles
- `GET /api/pasteles` → Obtener todos los pasteles
- `POST /api/pasteles` → Crear pastel
  - Body: `{ nombre, descripcion, precio, stock?, stockCritico?, categoria?, imagen? }`
  
- `PUT /api/pasteles/:id` → Actualizar pastel
  - Body: `{ nombre, descripcion, precio, stock, stockCritico, categoria, imagen }`
  
- `DELETE /api/pasteles/:id` → Eliminar pastel

### Pedidos
- `GET /api/pedidos` → Obtener todos los pedidos
- `GET /api/pedidos/user/:userId` → Obtener pedidos de un usuario
- `POST /api/pedidos` → Crear pedido
  - Body: `{ userId, items: [], total, status?, paymentMethod? }`

### PayPal
- `POST /api/create-order` → Crear orden PayPal
  - Body: `{ total, currency?, items? }`
  - Response: `{ id: paypal_order_id }`
  
- `POST /api/capture-order` → Capturar orden PayPal
  - Body: `{ orderId, userId? }`
  - Response: `{ id, status }`

## Base de Datos

La BD SQLite se crea automáticamente en `server/pasteleria.db`.

### Tablas
- `usuarios` — Usuarios y autenticación
- `pasteles` — Catálogo de productos
- `pedidos` — Órdenes y historial

## Usar desde el Frontend (React)

### Ejemplo: Login
```javascript
const response = await fetch('http://localhost:4000/api/usuarios/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userOrEmail: 'user@example.com', password: 'password123' })
})
const user = await response.json()
```

### Ejemplo: Obtener pasteles
```javascript
const response = await fetch('http://localhost:4000/api/pasteles')
const pasteles = await response.json()
```

### Ejemplo: Crear pedido
```javascript
const response = await fetch('http://localhost:4000/api/pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 1,
    items: [],
    total: 45000,
    paymentMethod: 'paypal'
  })
})
const pedido = await response.json()
```

## Seguridad

⚠️ **IMPORTANTE:**
- Nunca publiques `PAYPAL_SECRET` en el cliente ni en repositorios públicos
- En producción, valida **montos, IDs y permisos** en el servidor
- Usa HTTPS en producción
- Implementa autenticación con JWT o sesiones seguras
- Valida roles y permisos en cada endpoint

## Próximos pasos

1. **Migrar datos** de `localStorage` a la BD
2. **Refactorizar dataService** para llamar a estos endpoints
3. **Agregar validación** y manejo de errores robusto
4. **Implementar JWT** para autenticación segura
5. **Desplegar** a producción (Heroku, Railway, etc.)

### Script de migración
Dentro de `server/scripts/` hay un script `migrateSeed.js` que inserta los datos de `src/data/Usuarios.json` y `src/data/Pasteles.json` en la BD SQLite. Para ejecutarlo:

```powershell
cd server
node scripts/migrateSeed.js
```

El script evita duplicados por `correo` en `usuarios` y por `nombre+precio` en `pasteles`.
