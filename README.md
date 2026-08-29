# Comi-Rapi Frontend

Aplicación web de delivery de comida construida con React + Vite.

## Características

- **Framework**: React 18 con Vite
- **Enrutamiento**: React Router DOM v6
- **Estado global**: Context API (AuthContext, CarritoContext, SucursalContext)
- **Estilos**: React Bootstrap (Bootstrap 5 con componentes de react-bootstrap)
- **Lenguaje**: JavaScript

## Roles de usuario

### Cliente (mock)
- Email: `cliente@test.com`
- Contraseña: `123456`

### Administrador (mock)
- Email: `admin@test.com`
- Contraseña: `123456`

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build

# Vista previa del build
npm run preview
```

## Estructura del proyecto

```
src/
├── api/            # Servicios para consumir el backend (mock)
├── components/     # Componentes reutilizables
│   ├── comunes/    # Navbar, Footer, Loader, ProtectedRoute
│   ├── cliente/    # ProductoCard, ItemCarrito, etc.
│   └── admin/      # PanelAdmin, ListaProductos, etc.
├── context/        # Contextos de React (Auth, Carrito, Sucursal)
├── hooks/          # Custom hooks (useAuth, useCarrito, useSucursal)
├── pages/          # Páginas principales
│   ├── comunes/    # Login, Registro
│   ├── cliente/    # Inicio, Catálogo, Carrito, etc.
│   └── admin/      # Dashboard, Gestión de Productos, etc.
├── routes/         # Configuración de rutas
├── services/       # Servicios y lógica de negocio
├── styles/         # CSS personalizado adicional por componente/página
└── utils/          # Utilidades y constantes
```

## Variables de entorno

El archivo `.env` contiene:

```
VITE_API_URL=http://localhost:3000/api
```

## Notas

- Todos los datos son mock y están preparados para ser reemplazados por llamadas a la API real.
- Los `alert()` son solo para simular acciones y serán reemplazados por llamadas a la API.
- El proyecto utiliza React Bootstrap (Bootstrap 5) con CSS personalizado extra por componente cuando hace falta.
