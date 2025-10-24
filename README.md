# Pastelería 1000

Una aplicación web de e-commerce para una pastelería, construida con React y Vite. Permite a los usuarios explorar productos, agregar al carrito, realizar pedidos y gestionar cuentas de usuario.

## Características

- **Catálogo de Productos**: Amplia variedad de pasteles, tortas, postres y productos especiales.
- **Categorías**: Tortas, Postres, Sin Azúcar, Sin Gluten, Veganas, Especiales, Otros.
- **Carrito de Compras**: Agregar, eliminar y gestionar productos en el carrito.
- **Autenticación de Usuarios**: Registro, login y gestión de perfiles.
- **Panel de Administración**: Para gestionar productos y pedidos (requiere permisos de admin).
- **Páginas Informativas**: Sobre nosotros, contacto, ofertas.
- **Sistema de Pedidos**: Historial de pedidos y seguimiento.
- **Pago**: Página de pago integrada.
- **Responsive Design**: Optimizado para dispositivos móviles y desktop.

## Tecnologías Utilizadas

- **Frontend**: React 19, Vite
- **Routing**: React Router DOM
- **UI Framework**: Bootstrap 5
- **Iconos**: Bootstrap Icons, Lucide React
- **Linter**: ESLint
- **Build Tool**: Vite

## Instalación

1. Clona el repositorio:

   ```bash
   git clone <url-del-repositorio>
   cd pasteleria1000
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Abre tu navegador en `http://localhost:5173` (o el puerto que indique Vite).

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo con hot reload.
- `npm run build`: Construye la aplicación para producción.
- `npm run preview`: Previsualiza la build de producción.
- `npm run lint`: Ejecuta ESLint para verificar el código.

## Estructura del Proyecto

```
pasteleria1000/
├── public/                 # Archivos estáticos
│   └── vite.svg
├── src/
│   ├── assets/             # Imágenes y recursos
│   │   └── img/            # Imágenes de productos
│   ├── components/         # Componentes reutilizables
│   │   ├── Card.jsx        # Tarjeta de producto
│   │   ├── Footer.jsx      # Pie de página
│   │   ├── RequireAuth.jsx # Guardia de autenticación
│   │   └── RequireAdmin.jsx # Guardia de admin
│   ├── data/               # Datos JSON
│   │   ├── Pasteles.json   # Catálogo de productos
│   │   ├── Usuarios.json   # Datos de usuarios
│   │   └── Boleta.json     # Datos de boletas
│   ├── pages/              # Páginas de la aplicación
│   │   ├── Index.jsx       # Página principal
│   │   ├── Productos.jsx   # Lista de productos
│   │   ├── Carrito.jsx     # Carrito de compras
│   │   ├── Login.jsx       # Inicio de sesión
│   │   ├── Registro.jsx    # Registro de usuario
│   │   ├── Admin.jsx       # Panel de administración
│   │   └── ...             # Otras páginas
│   ├── utils/              # Utilidades
│   │   └── localstorageHelper.js # Helpers para localStorage
│   ├── App.jsx             # Componente principal
│   ├── App.css             # Estilos globales
│   ├── index.css           # Estilos base
│   └── main.jsx            # Punto de entrada
├── package.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

## Uso

### Para Usuarios

1. Regístrate o inicia sesión.
2. Explora productos por categoría o busca ofertas.
3. Agrega productos al carrito.
4. Revisa tu carrito y procede al pago.
5. Gestiona tus pedidos desde tu perfil.

### Para Administradores

1. Inicia sesión con cuenta de administrador.
2. Accede al panel de admin para gestionar productos y pedidos.

## Datos de Prueba

- **Usuario Admin**: (Configurado en Usuarios.json)
- **Productos**: 16 productos disponibles en diferentes categorías.
- **Imágenes**: Ubicadas en `src/assets/img/`.

## Contribución

1. Fork el proyecto.
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`).
4. Push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto

Para preguntas o soporte, contacta al equipo de desarrollo.
