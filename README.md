# Pastelería 1000

## Descripción del Proyecto

Pastelería 1000 es una aplicación web de e-commerce diseñada para una pastelería ficticia que ofrece una amplia variedad de productos dulces. La aplicación permite a los usuarios explorar el catálogo de pasteles, tortas y postres, agregar productos al carrito, gestionar pedidos y realizar pagos de manera segura. Además, incluye un panel de administración para que los propietarios puedan gestionar inventarios, pedidos y usuarios.

Este proyecto no solo es una herramienta técnica, sino que representa un negocio completo de pastelería, simulando operaciones reales como la gestión de categorías de productos (tortas, postres sin azúcar, veganos, etc.), promociones y ofertas especiales. Está construido con tecnologías modernas para asegurar una experiencia de usuario fluida y responsive.

## Características Principales

- **Catálogo de Productos**: Más de 16 productos en categorías como Tortas, Postres, Sin Azúcar, Sin Gluten, Veganos, Especiales y Otros.
- **Carrito de Compras**: Funcionalidades completas para agregar, eliminar y modificar cantidades de productos.
- **Autenticación y Autorización**: Registro de usuarios, login/logout, perfiles personales y roles de administrador.
- **Panel de Administración**: Gestión de productos, categorías, pedidos, reportes y usuarios (requiere permisos de admin).
- **Sistema de Pedidos**: Historial de pedidos, seguimiento y generación de boletas.
- **Páginas Informativas**: Información sobre la pastelería, contacto, ofertas y blog.
- **Responsive Design**: Optimizado para móviles y desktop usando Bootstrap.
- **Pruebas Automatizadas**: Cobertura completa con Vitest, incluyendo pruebas unitarias e integración para componentes, rutas y flujos de autenticación.
- **Gestión de Imágenes**: Recursos estáticos para productos y branding.

## Tecnologías Utilizadas

- **Frontend**: React 19 con Vite para un desarrollo rápido y eficiente.
- **Routing**: React Router DOM para navegación SPA.
- **UI y Estilos**: Bootstrap 5 para diseño responsive, Bootstrap Icons y Lucide React para iconografía.
- **Linter y Calidad de Código**: ESLint para mantener estándares de código.
- **Testing**: Vitest con @testing-library/react para pruebas unitarias y de integración, incluyendo cobertura de código.
- **Build y Dev Tools**: Vite para bundling y servidor de desarrollo.
- **Datos**: Archivos JSON locales para simular base de datos (productos, usuarios, boletas).

## Instalación y Configuración

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn

### Pasos de Instalación

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

4. Abre tu navegador en `http://localhost:5173` (o el puerto indicado por Vite).

### Configuración Adicional

- Los datos de prueba están en `src/data/` (Pasteles.json, Usuarios.json, Boleta.json).
- Imágenes de productos en `src/assets/img/`.
- Para desarrollo, asegúrate de tener configurado ESLint y Vitest.

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo con hot reload.
- `npm run build`: Construye la aplicación para producción.
- `npm run preview`: Previsualiza la build de producción localmente.
- `npm run lint`: Ejecuta ESLint para verificar y corregir el código.
- `npm test`: Ejecuta las pruebas con Vitest en modo watch.
- `npm run test:ui`: Ejecuta pruebas con interfaz gráfica (Vitests UI).
- `npm run test:coverage`: Genera reporte de cobertura de pruebas.

## Estructura del Proyecto

```
pasteleria1000/
├── public/                 # Archivos estáticos (favicon, etc.)
├── src/
│   ├── assets/             # Recursos multimedia
│   │   └── img/            # Imágenes de productos y branding
│   ├── components/         # Componentes reutilizables
│   │   ├── Card.jsx        # Tarjeta de producto
│   │   ├── Navbar.jsx      # Barra de navegación
│   │   ├── Footer.jsx      # Pie de página
│   │   ├── RequireAuth.jsx # Guardia de autenticación
│   │   └── RequireAdmin.jsx # Guardia de admin
│   ├── data/               # Datos JSON simulados
│   │   ├── Pasteles.json   # Catálogo de productos
│   │   ├── Usuarios.json   # Datos de usuarios
│   │   └── Boleta.json     # Plantillas de boletas
│   ├── pages/              # Páginas principales
│   │   ├── Index.jsx       # Página de inicio
│   │   ├── Productos.jsx   # Lista de productos
│   │   ├── Carrito.jsx     # Carrito de compras
│   │   ├── Login.jsx       # Inicio de sesión
│   │   ├── Registro.jsx    # Registro de usuario
│   │   ├── Pago.jsx        # Página de pago
│   │   ├── Perfil.jsx      # Perfil de usuario
│   │   └── ...             # Otras páginas (Nosotros, Contacto, etc.)
│   ├── Admin/              # Panel de administración
│   │   ├── Admin.jsx       # Dashboard principal
│   │   ├── AdminPastel.jsx # Gestión de pasteles
│   │   ├── AgregarPastel.jsx # Agregar nuevos productos
│   │   ├── AdminOrdenes.jsx # Gestión de pedidos
│   │   ├── Reportes.jsx    # Reportes y estadísticas
│   │   └── UsuariosAdmin.jsx # Gestión de usuarios
│   ├── test/               # Pruebas automatizadas
│   │   ├── *.test.jsx      # Pruebas de componentes y flujos
│   │   └── setup.js        # Configuración de pruebas
│   ├── utils/              # Utilidades y helpers
│   │   ├── cart.js         # Lógica del carrito
│   │   ├── session.js      # Gestión de sesiones
│   │   ├── slugify.js      # Utilidad para URLs
│   │   └── localstorageHelper.js # Helpers para localStorage
│   ├── App.jsx             # Componente raíz
│   ├── App.css             # Estilos globales
│   ├── index.css           # Estilos base
│   └── main.jsx            # Punto de entrada
├── scripts/                # Scripts de utilidad
│   ├── move-tests.js       # Script para mover pruebas
│   └── move-tests.mjs      # Versión ES module
├── package.json            # Dependencias y scripts
├── vite.config.js          # Configuración de Vite
├── vitest.config.js        # Configuración de Vitest
├── eslint.config.js        # Configuración de ESLint
├── setupTests.js           # Setup global para pruebas
└── README.md               # Este archivo
```

## Uso de la Aplicación

### Para Clientes

1. **Registro/Login**: Crea una cuenta o inicia sesión para acceder a funciones avanzadas.
2. **Explorar Productos**: Navega por categorías o busca ofertas especiales.
3. **Carrito**: Agrega productos, ajusta cantidades y revisa el total.
4. **Pago**: Completa la compra con información de envío y pago.
5. **Perfil**: Gestiona pedidos, historial y datos personales.

### Para Administradores

1. **Acceso**: Inicia sesión con credenciales de admin (ver Usuarios.json).
2. **Gestión**: Agrega/edita productos, administra pedidos y genera reportes.
3. **Usuarios**: Gestiona cuentas de usuarios y permisos.

## Pruebas

El proyecto incluye una suite completa de pruebas con Vitest:

- **Pruebas Unitarias**: Para componentes individuales y utilidades.
- **Pruebas de Integración**: Flujos completos como autenticación, carrito y admin.
- **Cobertura**: Más del 80% de cobertura en componentes críticos.
- **Ejecución**: `npm test` para modo interactivo, `npm run test:coverage` para reporte.

Ejemplos de pruebas incluyen:

- Flujos de login/logout
- Gestión del carrito
- Rutas protegidas (admin y auth)
- Componentes como Navbar, Card, etc.

## Contribución

1. Fork el proyecto.
2. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`.
3. Realiza commits descriptivos: `git commit -am 'Agrega nueva funcionalidad'`.
4. Push a la rama: `git push origin feature/nueva-funcionalidad`.
5. Abre un Pull Request con descripción detallada.

### Guías de Desarrollo

- Sigue las reglas de ESLint.
- Escribe pruebas para nuevas funcionalidades.
- Mantén la estructura de carpetas.
- Usa commits en español o inglés descriptivos.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## Contacto y Soporte

Para preguntas, soporte técnico o colaboraciones:

- Email: [tu-email@ejemplo.com]
- Sitio Web: [www.pasteleria1000.com] (ficticio)
- Equipo de Desarrollo: Javier (desarrollador principal)

---

_Pastelería 1000: Dulces momentos para todos._
