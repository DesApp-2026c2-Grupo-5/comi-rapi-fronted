# Comi-Rapi Frontend

Frontend de Comi-Rapi, aplicación de delivery de comida. React 18 con Vite, consumiendo la API real de `comi-rapi-backend`.

Rama de trabajo actual: `dev`.

## Estado actual

La integración con el backend está **casi** completa. La mayor parte de la app consume la API real por HTTP y el seguimiento de pedidos viene por WebSocket. Los `alert()` que existían al principio ya no están.

Qedan tres partes que siguen mockeadas, y conviene conocerlas antes de tocar esa zona:

- **`src/api/personalizacion.js`** es el CRUD de elementos de personalización y sigue siendo mock: lee de `personalizacionElementosMock` y simula la latencia con `delay()`. Es coherente con el backend, donde `lib/routes/personalizacion.js` existe pero **no está montado** en `lib/routes/index.js`, así que todavía no hay endpoint que consuma. Integrarlo requiere montar la ruta del lado del backend.
- **`src/api/carrito.js`** son helpers mock que devuelven datos calculados con `delay()`. El carrito que la app usa de verdad vive en `CarritoContext` y se persiste en `localStorage`.
- **La asignación de sucursal** recibe `pedidosPendientesMock` como entrada: `SucursalContext.jsx:70` se lo pasa a `asignarSucursalOptimaService`. Las sucursales sí vienen de la API; los pedidos pendientes que pesan en la asignación, no.

Los datos mock restantes viven en `src/services/seedData.js`. Cuando veas datos hardcodeados en pantalla, casi siempre vienen de ahí.

## Stack

- **React** 18.3 con **Vite** 5 (ESM, `"type": "module"` en `package.json`)
- **React Router** v6
- **Bootstrap** 5.3 + **React Bootstrap** 2.10
- **socket.io-client** 4 para el canal en tiempo real
- **prop-types** para el contrato de props de los componentes
- **ESLint** 8 con el plugin de React y el de hooks
- **playwright-core**, usado solo por el script de verificación end-to-end

## Requisitos

El frontend necesita el backend corriendo en `:3000`. Sin él, la app no carga datos y el login falla.

## Instalación y ejecución

```shell
npm install
npm run dev        # servidor de desarrollo de Vite
npm run build      # build de producción
npm run preview    # sirve el build
npm run lint       # ESLint con --max-warnings 0
```

Con el backend arriba en el puerto 3000, `npm run dev` alcanza para trabajar: Vite proxya `/api` contra `localhost:3000`.

## Usuarios de prueba

Los carga el seeder del backend. Ambos tienen contraseña `123456`.

| Rol | Email |
| --- | --- |
| Cliente | `cliente@test.com` |
| Administrador | `admin@test.com` |

## Integración con el backend

### Variables de entorno

El archivo `.env` define:

```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

`VITE_API_URL` es la base contra la que se arman las peticiones. Si no se define o se vacía, el cliente usa rutas relativas y aprovecha el proxy de Vite, que reenvía `/api` a `localhost:3000` (está configurado en `vite.config.js`). `VITE_SOCKET_URL` apunta al servidor de socket.io.

Para conectar contra un backend remoto, alcanza con cambiar estas dos variables.

### Sesión y CSRF

La autenticación es **por cookie de sesión**, no por token guardado en el `localStorage`: el login del backend deja una cookie y el frontend la usa en cada petición (`credentials: 'include'` en `src/api/client.js`).

Para los métodos que modifican datos (`POST`, `PUT`, `PATCH`, `DELETE`) hace falta además el token CSRF de doble envío, que viaja en el header `x-csrf-token`. Todo esto lo resuelve `src/api/client.js`, así que los módulos de `src/api/` no se preocupan por ello: exportan funciones que reciben datos y devuelven `{ success, data, error }`.

### Tiempo real

`src/services/socket.js` mantiene la conexión de socket.io y expone los eventos de seguimiento del pedido. El backend los emite cuando cambia el estado de un pedido.

## Estructura del proyecto

```shell
src/
├── api/           # Un módulo por recurso; todos consumen la API real
│   ├── client.js  # Wrapper de fetch: cookies, CSRF y manejo de errores
│   ├── auth.js  pedidos.js  productos.js  categorias.js  promociones.js
│   ├── sucursales.js  direcciones.js  stock.js  imagenes.js
│   └── perfil.js  personalizacion.js  carrito.js  health.js
├── components/    # Componentes reutilizables
│   ├── comunes/   # Navbar, NavInferior, Footer, Loader, ProtectedRoute, CampoPassword, Avatar
│   ├── cliente/   # ProductoCard, ItemCarrito, selector de personalización, etc.
│   └── admin/     # Paneles y formularios de ABM
├── context/       # Contextos de React
│   ├── AuthContext.jsx        # sesión y usuario
│   ├── CarritoContext.jsx     # carrito y su persistencia
│   ├── DireccionContext.jsx   # dirección de entrega y selección de sucursal
│   ├── PedidoContext.jsx      # pedido en curso
│   ├── PersonalizacionContext.jsx
│   ├── SucursalContext.jsx
│   └── NotificacionContext.jsx  # notificaciones y toasts
├── hooks/         # Wrappers finos sobre los contexts y lógica reutilizable
│   ├── useAuth.js  useCarrito.js  useDirecciones.js  useSucursal.js
│   ├── usePedidos.js  usePersonalizacion.js  useNotificaciones.js
│   ├── usePromocionesCarrito.js  useRepetirPedido.js
│   └── useIndicadoresNav.js  useMuestraNavInferior.js
├── pages/         # Páginas, una por ruta
│   ├── comunes/   # Login, Registro, RecuperarPassword, NuevaPassword
│   ├── cliente/   # Inicio, SucursalesCercanas, Catalogo, Carrito, Pago,
│   │              # ConfirmacionPedido, MisPedidos, HistorialPedidos,
│   │              # DetallePedido, Perfil
│   └── admin/     # Dashboard, AdminLogin, AdminRegister, y los ABM de
│                  # Productos, Categorias, Sucursales, Promociones,
│                  # Personalizacion, stock y Pedidos
├── routes/        # AppRoutes.jsx: tabla de rutas y ProtectedRoute
├── services/      # Lógica de cliente: socket, asignación de sucursal,
│                  # estados de pedido, envío, pago, configuración de personalización
├── styles/        # CSS global
└── utils/         # Helpers: formatters, validators, carrito en storage,
                   # cálculo de promociones, rutas, avisos de repetición
```

## Funcionalidad

### Cliente

- Login, registro y recuperación de contraseña con email
- Inicio con sucursales cercanas
- Catálogo por categoría, con búsqueda de productos, stock y más vendidos
- Personalización de productos (opciones con precio adicional) y combos con sus componentes
- Carrito persistente entre recargas, con aplicación de promociones
- Checkout: dirección de entrega, selección de sucursal y pago
- Seguimiento del pedido en tiempo real por WebSocket
- Historial de pedidos, detalle y repetición de un pedido anterior
- Perfil y cambio de contraseña

### Administrador

- Dashboard con métricas
- ABM de productos (incluidos combos), categorías, sucursales, promociones y stock
- ABM de elementos de personalización. **Es el que sigue mockeado**: los datos viven en memoria y se pierden al recargar
- Gestión y transición de estados de pedidos

## Notas

- El backend sirve las imágenes subidas por el administrador. En desarrollo caen en `public/imagenes/<carpeta>` del frontend y se sirven desde la raíz de Vite.
- No hay scripts de test unitarios ni de typecheck. El único script de verificación es `npm run test:tiempo-real`, que corre `scripts/verificar-tiempo-real.js` contra el backend de desarrollo y necesita el server arriba. Existe un `src/setupTests.js` que es residuo de una plantilla y no lo ejecuta ningún script.
- `mockup/` guarda los HTML de mockups de diseño. Son referencias visuales, no código en uso.
- Cada módulo y casi cada componente arranca con un bloque de comentario que documenta su propósito, su contenido, sus dependencias y su forma de uso. Es la convención del proyecto: al agregar código nuevo, mantenerla.