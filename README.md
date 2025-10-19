# Pastelería 1000 Sabores

Una aplicación web moderna para la pastelería "1000 Sabores", famosa por su participación en un récord Guinness en 1995 al crear la torta más grande del mundo. Esta plataforma permite a los clientes explorar y comprar una variedad de pasteles, tortas y postres, incluyendo opciones sin azúcar, sin gluten y veganas.

## 🚀 Características

- **Catálogo de Productos**: Explora una amplia gama de pasteles organizados por categorías (Tortas, Postres, Sin Azúcar, Sin Gluten, Veganas, Especiales, Otros).
- **Búsqueda de Productos**: Busca pasteles por nombre o descripción.
- **Carrito de Compras**: Agrega productos al carrito (funcionalidad básica implementada).
- **Sistema de Login**: Autenticación de usuarios con validación de credenciales.
- **Página de Contacto**: Formulario de contacto con validación y enlaces a redes sociales.
- **Pago Simulado**: Formulario de pago con validación de tarjetas de crédito (Visa, Mastercard, Amex) y algoritmo de Luhn.
- **Panel de Administración**: Página de administración (placeholder para futuras funcionalidades).
- **Diseño Responsivo**: Interfaz adaptada para dispositivos móviles y de escritorio usando Bootstrap.
- **Navegación Intuitiva**: Menú de navegación con categorías dinámicas generadas automáticamente.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19 con Vite
- **Enrutamiento**: React Router DOM
- **Estilos**: Bootstrap 5, CSS personalizado
- **Iconos**: Lucide React
- **Datos**: JSON estáticos para productos y usuarios
- **Validación**: Formularios con validación en tiempo real
- **Linter**: ESLint con reglas personalizadas

## 📦 Instalación

1. Clona el repositorio:

   ```bash
   git clone <url-del-repositorio>
   cd pasteleria
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

## 📖 Uso

### Navegación

- **Inicio**: Página principal con carrusel de imágenes y productos destacados.
- **Productos**: Lista completa de productos con opción de búsqueda.
- **Categorías**: Dropdown en el navbar con categorías generadas dinámicamente.
- **Carrito**: Agrega productos al carrito (funcionalidad básica).
- **Contacto**: Envía mensajes de contacto.
- **Login**: Inicia sesión con credenciales de usuario.
- **Pago**: Simula un pago con validación de tarjeta.

### Credenciales de Prueba

Para probar el login, usa cualquiera de estos usuarios de `src/data/Usuarios.json`:

- ana.garcia@gmail.com / AnaGarcia1234
- luis.martinez@gmail.com / LuisMartinez1
- sofia.lopez@gmail.com / SofiaLopez12

### Productos

La aplicación incluye 16 productos en categorías como:

- Tortas tradicionales y especiales
- Postres como Tiramisú
- Opciones sin azúcar y sin gluten
- Productos veganos
- Especiales para cumpleaños y bodas

## 🏗️ Estructura del Proyecto

```
pasteleria/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── img/          # Imágenes de productos y tienda
│   ├── components/
│   │   └── Card.jsx      # Componente para mostrar productos
│   ├── data/
│   │   ├── Pasteles.json # Datos de productos
│   │   └── Usuarios.json # Datos de usuarios
│   ├── pages/
│   │   ├── Index.jsx     # Página principal
│   │   ├── Productos.jsx # Lista de productos
│   │   ├── Carrito.jsx   # Carrito de compras
│   │   ├── Login.jsx     # Página de login
│   │   ├── Contacto.jsx  # Formulario de contacto
│   │   ├── Pago.jsx      # Formulario de pago
│   │   ├── Admin.jsx     # Panel de administración
│   │   ├── Navbar.jsx    # Barra de navegación
│   │   └── Ofertas.jsx   # Página de ofertas
│   ├── utils/
│   │   └── localstorageHelper.js # Utilidades para localStorage
│   ├── App.jsx           # Componente principal
│   ├── App.css           # Estilos globales
│   ├── index.css         # Estilos base
│   └── main.jsx          # Punto de entrada
├── package.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

## 🎨 Estilos y Diseño

- **Tema**: Colores pastel con acentos en rosa (#e67ca3) y verde (#91d7c8).
- **Tipografía**: Bootstrap por defecto.
- **Imágenes**: Carrusel con fotos de la tienda y productos.
- **Responsive**: Diseño adaptativo con grid de Bootstrap.

## 🔧 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Construye la aplicación para producción.
- `npm run lint`: Ejecuta ESLint para verificar el código.
- `npm run preview`: Vista previa de la build de producción.

## 📝 Notas de Desarrollo

- Los datos de productos y usuarios están en archivos JSON estáticos.
- El carrito y admin son placeholders para futuras implementaciones.
- La validación de pagos incluye algoritmo de Luhn y detección de tipo de tarjeta.
- Las imágenes se resuelven dinámicamente desde `src/assets/img/`.

## 🤝 Contribución

1. Haz un fork del proyecto.
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`).
4. Push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## 📄 Licencia

Este proyecto es privado y propiedad de Pastelería 1000 Sabores.

## 📞 Contacto

- **Dirección**: Av. Principal 123, Santiago
- **Teléfono**: +56 9 1234 5678
- **Horario**: Lun-Sab 9:00 - 20:00
- **Redes**: [Instagram](https://instagram.com), [WhatsApp](https://wa.me/56912345678), [Facebook](https://facebook.com)

¡Disfruta explorando nuestros deliciosos pasteles!
