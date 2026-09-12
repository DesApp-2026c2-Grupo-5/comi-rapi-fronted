# Comi-Rapi Frontend — Documentación Completa

> **Estado:** En desarrollo (funcional, datos mock, sin backend)
> **Versión:** comi-rapi-fronted (React + Vite)
> **Cobertura:** Parte de CLIENTE · Parte de ADMINISTRACIÓN (admin) · Infraestructura (rutas, autenticación, contextos, datos mock)

---

## 1. Información general

- **Nombre comercial:** Comi-Rapi
- **Descripción:** Aplicación web de pedidos de comida rápida (tipo PedidosYa/Rappi) con entrega a domicilio, asignación automática de sucursal y seguimiento de pedidos.

**Stack:**

| Tecnología | Uso |
|---|---|
| Vite + React 18 (JavaScript, funcional con hooks) | Build y framework UI |
| react-bootstrap | UI |
| react-router-dom v6 | Navegación |
| react-icons | Iconos Font Awesome (importar desde `react-icons/fa`) |

**Ejecución:**

```bash
npm install
npm run dev            # desarrollo
npm run build          # build de producción
npm run lint           # ESLint — ver nota al final
```

> **Sin backend:** todos los datos son MOCK (ver sección 6). Las llamadas a la API se simulan con delay y operan sobre copias en memoria de los datos semilla.

**Usuarios de prueba (seed):**

| Rol | Email | Password |
|---|---|---|
| Cliente | `cliente@test.com` | `123456` |
| Admin | `admin@test.com` | `123456` |

**Idioma de la UI:** es-AR (precios en pesos argentinos con `formatPrice`, cantidades giradas como "Agrega", "hace", etc.).

**Regla de diseño:** no se usan emojis en la interfaz. Los estados y botones se representan con iconos SVG inline o react-icons.

---

## 2. Estructura de carpetas

```text
src/
  main.jsx                     Punto de entrada (monta <App />)
  App.jsx                      Router + contextos + Navbar + Footer
  routes/
    AppRoutes.jsx              Definición de todas las rutas
  pages/
    comunes/
      Login.jsx                Login de cliente    (ruta /login)
      Login.css                Estilos compartidos de autenticación
      Registro.jsx             Registro de cliente (ruta /registro)
    cliente/
      Inicio.jsx               Home del cliente    (/cliente/inicio)
      Catalogo.jsx             Catálogo con filtros (/cliente/catalogo)
      Carrito.jsx              Carrito de compras  (/cliente/carrito)
      ConfirmacionPedido.jsx   Éxito del pedido    (/cliente/confirmacion)
      MisPedidos.jsx           Historial de pedidos (/cliente/mis-pedidos)
      DetallePedido.jsx        Detalle con stepper (/cliente/pedido/:id)
      MisDirecciones.jsx       CRUD de direcciones (/cliente/mis-direcciones)
    admin/
      AdminLogin.jsx           Login de admin      (/admin-login)
      AdminRegister.jsx        Registro de admin   (/admin-registro)
      Dashboard.jsx            Dashboard admin     (/admin/dashboard)
      GestionProductos.jsx     Lista de productos  (/admin/productos)
      EditarProducto.jsx       Crear/editar producto
      GestionPedidos.jsx       Pedidos del admin   (/admin/pedidos)
      GestionSucursales.jsx    Tabla de sucursales (/admin/sucursales)
      EditarSucursal.jsx       Crear/editar sucursal
  components/
    comunes/
      Navbar.jsx               Barra naranja con iconos y rol
      Navbar.css
      ProtectedRoute.jsx       Guarda rutas por rol
      Footer.jsx               Pie de página oscuro
      IconoEstado.jsx          SVG de estados de pedido + IconoCheck
      HistorialStepper.jsx     Stepper de estados compartido (cliente + admin)
      HistorialStepper.css
    cliente/
      ProductoCard.jsx         Tarjeta de producto del catálogo
      ItemCarrito.jsx          Ítem del carrito (imagen, cantidad, eliminar)
      ResumenPedido.jsx        Resumen (subtotal, envío, total, sucursal)
      FormularioDireccion.jsx  Alta/edición de dirección
    admin/
      PanelAdmin.jsx           Tarjetas de estadísticas
      ListaProductos.jsx       Tabla de productos con acciones
      FormularioProducto.jsx   Formulario de producto
      FormularioSucursal.jsx   Formulario de sucursal
      PedidosPendientes.jsx    Stepper de estados de pedido (admin)
      PedidosPendientes.css
  context/
    AuthContext.jsx            Autenticación y roles
    CarritoContext.jsx         Carrito de compras
    SucursalContext.jsx        Sucursales y asignación
    PedidoContext.jsx          Pedidos y transiciones de estado
    DireccionContext.jsx       Direcciones del cliente
  hooks/                       Envoltorios de `useContext`
    useAuth.js, useCarrito.js, useSucursal.js,
    usePedidos.js, useDirecciones.js
  api/                         Capa de servicios mock
    auth.js, carrito.js, categorias.js,
    productos.js, pedidos.js, sucursales.js
  services/
    seedData.js                Todos los datos semilla (MOCK)
    estadosPedido.js           Lógica de transiciones válidas
    asignacionSucursal.js      Sucursal óptima por carga de pedidos
  utils/
    constants.js               Roles, estados, variantes de Badge, colores
    helpers.js                 delay(), generateId(), filterByProperty()
    formatters.js              formatPrice(), formatDate()
    validators.js              validateEmail(), validatePassword(), validateProducto()
```

Archivos de estilo propios por página (además de los `.css` citados): `Inicio.css`, `Catalogo.css`, `Carrito.css`, `DetallePedido.css`, `ProductoCard.css`, `ItemCarrito.css`, `ResumenPedido.css`.

---

## 3. Rutas (`src/routes/AppRoutes.jsx`)

**Públicas:**

| Ruta | Componente | Nota |
|---|---|---|
| `/` | — | redirige a `/login` |
| `/login` | `Login` | cliente |
| `/registro` | `Registro` | cliente |
| `/admin-login` | `AdminLogin` | admin |
| `/admin-registro` | `AdminRegister` | admin |
| `*` | — | redirige a `/login` |

**Protegidas CLIENTE** (`ProtectedRoute requiredRole="CLIENTE"`):

| Ruta | Componente |
|---|---|
| `/cliente/inicio` | `Inicio` |
| `/cliente/catalogo` | `Catalogo` |
| `/cliente/carrito` | `Carrito` |
| `/cliente/confirmacion` | `ConfirmacionPedido` |
| `/cliente/mis-pedidos` | `MisPedidos` |
| `/cliente/pedido/:id` | `DetallePedido` |
| `/cliente/mis-direcciones` | `MisDirecciones` |

**Protegidas ADMIN** (`ProtectedRoute requiredRole="ADMIN"`):

| Ruta | Componente |
|---|---|
| `/admin/dashboard` | `Dashboard` |
| `/admin/productos` | `GestionProductos` |
| `/admin/producto/editar/:id` | `EditarProducto` |
| `/admin/producto/nuevo` | `EditarProducto` (modo alta) |
| `/admin/pedidos` | `GestionPedidos` |
| `/admin/sucursales` | `GestionSucursales` |
| `/admin/sucursal/nuevo` | `EditarSucursal` |
| `/admin/sucursal/editar/:id` | `EditarSucursal` |

---

## 4. Autenticación y roles

**Roles** definidos en `utils/constants.js`:
- `ROLES.CLIENTE = 'CLIENTE'`
- `ROLES.ADMIN = 'ADMIN'`

**Flujo de login (`AuthContext`):**

| Función | Comportamiento |
|---|---|
| `login(email, password)` | `loginCliente` (`api/auth.js`) |
| `loginAdministrador(...)` | `loginAdmin` |
| `register(datos)` | `registroCliente` |
| `registerAdmin(datos)` | `registroAdmin` |
| `logout()` | limpia estado y `localStorage` |

- Al loguearse/registrarse correctamente se guarda el usuario en `localStorage` (`'user'`). Al montar la app se restaura la sesión.
- En `api/auth.js` el login valida contra `usuariosMock` buscando `email + password + rol`. La password nunca se persiste.

**Roles y UI:**
- `AuthContext` expone `isAuthenticated`, `isAdmin`, `isCliente`.
- La `Navbar` muestra menús diferentes por rol:
  - **Cliente:** Inicio, Catálogo, Carrito, Mis Pedidos, Mis direcciones.
  - **Admin:** Dashboard, Productos, Pedidos, Sucursales.

**Protección de rutas (`components/comunes/ProtectedRoute.jsx`):**
- Si no está autenticado → redirige a `/login`.
- Si el rol no coincide → redirige a la home del rol que corresponda (`/cliente/inicio` o `/admin/dashboard`).
- Soporta modo wrapper (con `children`) y modo outlet (rutas anidadas).

**Pisos de autenticación (`App.jsx` → `pages/*Login` con estilo Comi-Rapi):**
- Fondo crema con degradado (`auth-comirapi-bg`).
- Card con cabecera naranja degradada, marca circular animada, inputs con icono (`FaEnvelope`, `FaLock`), botón submit pill naranja (`btn-submit-comirapi`) y banner de credenciales demo (`auth-demo`).
- Cliente: icono `FaHamburger`. Admin: icono `FaUserShield`.

---

## 5. Contextos globales

Orden de anidado en `App.jsx`:

```text
BrowserRouter > AuthProvider > CarritoProvider > SucursalProvider >
PedidoProvider > DireccionProvider > (Navbar + AppRoutes + Footer)
```

### AuthContext

- **Estado:** `user`, `loading`. **Funciones:** `login`, `loginAdministrador`, `register`, `registerAdmin`, `logout`. **Derivados:** `isAuthenticated`, `isAdmin`, `isCliente`.
- Usado por `Navbar`, `ProtectedRoute`, `Carrito` y todas las páginas.

### CarritoContext

- **Estado:** `items` (array de `{ producto, cantidad }`).
- **Funciones:** `agregarAlCarrito(producto, cantidad=1)`, `eliminarDelCarrito(id)`, `actualizarCantidad(id, n)` (`n<=0` elimina), `vaciarCarrito()`.
- **Derivados:** `totalItems`, `total` (suma `precio*cantidad`).
- Nota: usa `alert()` como feedback simulado.

### SucursalContext

- **Estado:** `sucursales`, `sucursalAsignada`, `pedidosPendientes`, `loading`.
- **Funciones:** `obtenerSucursales` (carga desde api), `cargarSucursales` (carga y asigna la óptima al montar), `asignarSucursalOptima`, `cambiarSucursal(id)`, `agregarSucursal`, `actualizarSucursal`, `eliminarSucursal`.
- **Derivado:** `sucursalesCercanas` (solo activas).
- Las sucursales tienen: `id, nombre, direccion, lat, lng, horario, telefono, estado ('activo'|'inactivo')`.

### PedidoContext

- **Estado:** `pedidos` (`pedidosMock`), `pedidoActual`.
- **Funciones:** `crearPedido(datos, sucursalAsignada)` → estado inicial `'pendiente'` + historial; `confirmarPedido(id)` → PENDIENTE a CONFIRMADO (simula el pago); `cambiarEstado(id, nuevoEstado)`; `obtenerPedidosPendientes()` (devuelve los `'pendiente'` y `'confirmado'`).
- Cada pedido guarda: `id`, `cliente` (email), `productos`, `total`, `direccion`, `sucursal` (objeto completo), `estado`, `fecha`, `historialEstados` (array de `{ estado, fecha }`).

### DireccionContext

- **Estado:** `direcciones` (`direccionesMock`).
- **Funciones:** `cargarDirecciones(clienteId)` (activas de un cliente), `obtenerDireccionPrincipal(clienteId)`, `agregarDireccion(datos)`, `editarDireccion(id, datos)`, `eliminarDireccion(id)` (baja lógica a `'inactivo'`), `seleccionarDireccionPrincipal(id)`.
- **Reglas:** UNA dirección principal por cliente (al marcar/guardar una se desmarcan las demás). Si es la única activa, pasa a principal automáticamente. Las direcciones del cliente son TEXTUALES (`nombre, direccion, ciudad, codigoPostal, referencia, esPrincipal, estado`); no usan coordenadas (solo la sucursal usa `lat/lng`).

---

## 6. Datos mock y capa API

**`services/seedData.js` exporta:**

| Export | Detalle |
|---|---|
| `productosMock` | 11 productos `{ id, nombre, precio, categoria, imagen, descripcion }` |
| `categoriasMock` | 5 categorías `{ id, nombre, descripcion }` |
| `sucursalesMock` | 3 sucursales `{ id, nombre, direccion, lat, lng, horario, telefono, estado }` |
| `pedidosPendientesMock` | Pedidos `'pendiente'` por `sucursalId` (para asignación) |
| `pedidosMock` | 3 pedidos con `historialEstados` completo |
| `usuariosMock` | 2 usuarios `{ id, nombre, email, password, rol }` |
| `direccionesMock` | 2 direcciones de `cliente@test.com` (Casa principal, Trabajo) |

**`api/` (servicios mock, cada uno usa `delay()` y una copia mutable local):**

| Módulo | Funciones |
|---|---|
| `auth.js` | `loginCliente`, `loginAdmin`, `registroCliente`, `registroAdmin` |
| `carrito.js` | `agregarAlCarrito`, `obtenerCarrito`, `vaciarCarrito` |
| `categorias.js` | `obtenerCategorias` |
| `productos.js` | `obtenerProductos`, `obtenerProductoPorId`, `crearProducto`, `editarProducto`, `eliminarProducto` |
| `pedidos.js` | `crearPedido`, `obtenerPedidos`, `obtenerPedidoPorId`, `confirmarPedido` |
| `sucursales.js` | `obtenerSucursales`, `obtenerSucursalPorId`, `crearSucursal`, `actualizarSucursal`, `eliminarSucursal` |

Todos devuelven `{ success, data|error }` con delays de 200-500ms.

> **Observación:** algunos módulos (Carrito, `PedidoContext`, `ListaProductos`, `EditarProducto`) usan los datos mock de `seedData` directamente en lugar de la capa api. En producción se debe unificar todo detrás de la capa api.

**`utils/`:**

| Módulo | Contenido |
|---|---|
| `constants.js` | `ROLES`, `ESTADOS_PEDIDO`, `ETIQUETAS_ESTADO_PEDIDO`, `VARIANTE_ESTADO_PEDIDO`, `COLOR_ESTADO_PEDIDO`, `ESTADO_SUCURSAL`, `ESTADO_DIRECCION`, `LIMITES_LAT/LNG` |
| `helpers.js` | `delay(ms)`, `generateId()`, `filterByProperty(array, prop, valor)` |
| `formatters.js` | `formatPrice` (ARS es-AR), `formatDate` (fecha larga es-AR) |
| `validators.js` | `validateEmail`, `validatePassword` (>= 6), `validateProducto` |

---

## 7. Estados de pedido (core del negocio)

Ciclo de vida (`ESTADOS_PEDIDO` en `utils/constants.js`, valores en minúscula y sin tildes en el código):

```text
pendiente -> confirmado -> en_preparacion -> listo_para_entregar
          -> en_camino -> entregado
(desde pendiente hasta en_camino, cualquiera puede ir a 'cancelado')
```

**Transiciones válidas (`services/estadosPedido.js`):**

| De | Hacia |
|---|---|
| `pendiente` | `confirmado` \| `cancelado` |
| `confirmado` | `en_preparacion` \| `cancelado` |
| `en_preparacion` | `listo_para_entregar` \| `cancelado` |
| `listo_para_entregar` | `en_camino` \| `cancelado` |
| `en_camino` | `entregado` \| `cancelado` |
| `entregado` | (final) |
| `cancelado` | (final) |

**Funciones:**
- `puedeTransicionar(estadoActual, nuevoEstado)` → boolean
- `obtenerEstadosSiguientes(estadoActual)` → array

**Presentación:**
- `ETIQUETAS_ESTADO_PEDIDO` → "Pendiente", "Confirmado", etc.
- `VARIANTE_ESTADO_PEDIDO` → variante de Badge de Bootstrap.
- `COLOR_ESTADO_PEDIDO` → color hex para los SVG de la timeline.
- `IconoEstado` (`comunes/IconoEstado.jsx`) → SVG inline por estado:
  - `pendiente` = reloj, `confirmado` = check, `en_preparacion` = fuego, `listo_para_entregar` = caja, `en_camino` = bicicleta, `entregado` = check en círculo, `cancelado` = cruz.
  - Además exporta `<IconoCheck />` (check simple) usado en la confirmación.

**Flujo de creación (desde el carrito):**
`crearPedido()` deja el pedido en `'pendiente'` con historial en `PedidoContext` y luego `confirmarPedido()` simula el pago y lo pasa a `'confirmado'`. Ver sección 9 (Carrito).

---

## 8. Asignación automática de sucursal

Servicio: `services/asignacionSucursal.js` → `asignarSucursalOptima()`.

**Reglas:**
1. Filtra las sucursales con estado `'activo'`.
2. Ordena por `id` (para desempatar a favor de la de menor id).
3. Elige la sucursal con MENOS pedidos pendientes. Si no se pasan pedidos, usa la propiedad `'pedidosPendientes'` de cada sucursal.
4. Devuelve `null` si no hay sucursales.

**Usos:**
- `SucursalContext.cargarSucursales` la asigna al cliente al montar.
- `Carrito.jsx` la ejecuta al confirmar el pedido, usando las sucursales activas del contexto y los pedidos `'pendiente'`/`'confirmado'` de `PedidoContext.obtenerPedidosPendientes()`.

> El cliente NO elige sucursal: la aplicación la asigna sola. En la confirmación y en Mis Pedidos se muestra que pedido quedó asignado a qué sucursal.

---

## 9. Parte de cliente (detalle por pantalla)

### 9.1 Inicio (`/cliente/inicio`) — `src/pages/cliente/Inicio.jsx` + `Inicio.css`

- Hero naranja (fondo `#FF9F1C`) con texto "COMI" y "RAPI" separados y una hamburguesa flotante en el centro hecha con CSS puro, con ingredientes que vuelan (decoración animada).
- Badge "Google Play" a la izquierda y botón "ORDENAR" a la derecha.
- Sección "Nuestras Categorías": 5 círculos (Hamburguesas, Combos, Papas, Bebidas, Postres) usando placeholders de imagen.
- "Favoritos de la semana": 3 productos reutilizando `<ProductoCard />`.
- Sección "Envío a domicilio rápido": fondo naranja, texto blanco y botón "PIDE AHORA" con icono de bicicleta (SVG inline).
- El footer oscuro lo provee el componente global `<Footer />`.

### 9.2 Catálogo (`/cliente/catalogo`) — `Catalogo.jsx` + `Catalogo.css`

- Título grande "Nuestro Catálogo".
- Filtros de categoría en pills (Todos + `categoriasMock`).
- Grid responsive de `<ProductoCard />` (md=3, lg=4 columnas).
- Aviso si no hay productos en la categoría.

### 9.3 ProductoCard — `components/cliente/ProductoCard.jsx` + `ProductoCard.css`

- Card redondeada con sombra, imagen arriba, nombre, descripción, precio destacado (`formatPrice`) y botón "Añadir" redondo naranja (100%).
- Al click llama a `agregarAlCarrito(producto, 1)` y muestra `alert`.

### 9.4 Carrito (`/cliente/carrito`) — `Carrito.jsx` + `Carrito.css`

- Título "Tu Carrito". Estado vacío con card y botón al catálogo.
- Lista de `<ItemCarrito />` más botón "Vaciar carrito".
- `<ResumenPedido onConfirmar={handleConfirmarPedido} />`.
- Si el cliente no tiene dirección principal: banner de alerta con link a `/cliente/mis-direcciones`, y al confirmar se bloquea con `alert('Agrega una direccion antes de confirmar')`.
- Confirmación (flujo automático):
  1. Filtra sucursales activas del `SucursalContext`.
  2. Obtiene pedidos pendientes de `PedidoContext`.
  3. `asignarSucursalOptima()` → sucursal con menos carga.
  4. `crearPedido({ cliente, productos, total, direccion }, sucursal)` → estado `'pendiente'`.
  5. `confirmarPedido(id)` → pasa a `'confirmado'` (pago simulado).
  6. `vaciarCarrito()` y navega a `/cliente/confirmacion`.

### 9.5 ItemCarrito — `components/cliente/ItemCarrito.jsx` + `ItemCarrito.css`

- Card con imagen, nombre, precio unitario, input de cantidad (1-20), subtotal y botón circular de eliminar (SVG de cruz inline).
- Las cantidades se actualizan con `actualizarCantidad`.

### 9.6 ResumenPedido — `components/cliente/ResumenPedido.jsx` + `ResumenPedido.css`

- Props: `onConfirmar`, `items`, `total`, `sucursal` (todos opcionales).
- Sin props → usa el carrito (modo carrito). En modo lectura recibe `items/total/sucursal` (modo confirmación): no muestra botón.
- Simula envío (MOCK): GRATIS a partir de $10.000, $350 si supera.
- Si recibe `sucursal`, muestra el bloque "Sucursal asignada".

### 9.7 ConfirmacionPedido (`/cliente/confirmacion`) — `ConfirmacionPedido.jsx`

- Si no hay `pedidoActual` (recarga) avisa y ofrece ir al catálogo.
- Check verde grande (`<IconoCheck />`), número de pedido, fecha, estado (Badge) y bloques destacados:
  - "Tu pedido será preparado en" → sucursal asignada.
  - "Entregamos en" → dirección principal usada (nombre, dirección, ciudad/CP y referencia).
- `<ResumenPedido />` modo lectura + botón "Ver mis pedidos".

### 9.8 MisPedidos (`/cliente/mis-pedidos`) — `MisPedidos.jsx`

- Filtra los pedidos del cliente por email de usuario.
- Cada pedido: header con número y Badge de estado con icono (`IconoEstado` + `VARIANTE_ESTADO_PEDIDO`), fecha, productos, total, sucursal y stepper de progreso (`HistorialStepper`, solo lectura).
- Estado vacío con CTA al catálogo.

### 9.9 DetallePedido (`/cliente/pedido/:id`) — `DetallePedido.jsx` + `DetallePedido.css`

- Busca el pedido por id en `PedidoContext`; si no existe avisa.
- Header con número y Badge de estado con icono.
- Cliente y sucursal asignada (nombre + dirección).
- Tabla de productos con cantidades y subtotales, total destacado.
- "Progreso del pedido": stepper horizontal (`HistorialStepper`, solo lectura) con el MISMO visual que el admin: iconos que se encienden en verde a medida que el pedido avanza, el estado actual late en naranja y los futuros quedan oscurecidos. Se apagan/encienden según el estado del pedido.

### 9.10 MisDirecciones (`/cliente/mis-direcciones`) — `MisDirecciones.jsx`

- Lista de direcciones activas del cliente. Solo crea/edita inline (sin ruta aparte) usando `<FormularioDireccion />`.
- Botón "Agregar dirección" (`FaPlus`). Badge "Principal" (`FaStar`) en la dirección principal.
- Acciones por dirección: Editar (`FaEdit`), Marcar como principal (si no lo es), Eliminar (baja lógica con confirmación).
- Campos del formulario: Nombre\*, Dirección\*, Ciudad, Código postal, Referencia y checkbox "Usar como dirección principal".
- Si no hay direcciones: card vacía con CTA.

### 9.11 Auth cliente (login/registro)

- Login/AdminLogin comparten `Login.css` (ver sección 4).
- Registro (`/registro`) y AdminRegister (`/admin-registro`) mantienen el layout básico de Bootstrap (Container+Card). Tras registrarse, navegan a `/cliente/inicio` o `/admin/dashboard` según el rol.

---

## 10. Parte de admin (detalle por pantalla)

### 10.1 Dashboard (`/admin/dashboard`) — `Dashboard.jsx` + `PanelAdmin.jsx`

- Renderiza `<PanelAdmin />`: título "Panel de Administración" y 3 tarjetas resumen (Total de productos = 12, Pedidos pendientes = 5, Sucursales = 3) con valores estáticos de demo.

### 10.2 GestionProductos (`/admin/productos`) — `GestionProductos.jsx` + `ListaProductos.jsx`

- Tabla (`Table` striped/bordered/hover) con ID, Nombre, Precio (`formatPrice`), Categoría y Acciones (Editar / Eliminar).
- Los datos salen de `productosMock` (`seedData`) directamente.
- "Eliminar" muestra `alert` simulado (no modifica datos).
- Botón "Agregar nuevo producto" → navega a `/admin/producto/nuevo`.

### 10.3 EditarProducto (`/admin/producto/nuevo` | `/admin/producto/editar/:id`)

- Si viene `id`, lo busca en `productosMock`; si no existe, "Producto no encontrado" con link de vuelta.
- Reutiliza `<FormularioProducto />` (ver siguiente).
- "Guardar" muestra `alert` simulado ('guardado correctamente').

### 10.4 FormularioProducto — `components/admin/FormularioProducto.jsx`

- Campos controlados: Nombre\*, Precio\*, Categoría\* (select de `categoriasMock`) y URL de imagen (default = placeholder).
- Valida obligatorios con `alert` y llama a `onGuardar(datos)`.

### 10.5 GestionPedidos (`/admin/pedidos`) — `GestionPedidos.jsx` + `PedidosPendientes.jsx` + `PedidosPendientes.css`

- Tarjeta con título "Pedidos Pendientes" y stepper de estados.
- Flujo del stepper (componente compartido `HistorialStepper`, en `comunes`; en admin, además, el siguiente estado es clicable):
  - Estados: `pendiente` (reloj), `confirmado` (check), `en_preparacion` (fuego), `listo_para_entregar` (caja), `en_camino` (bicicleta), `entregado` (bandera final). Nodo `cancelado` aparte.
  - El estado ACTUAL tiene animación (late en naranja).
  - Los estados FUTUROS se ven oscurecidos/dimmed y se encienden al ser alcanzados.
  - El estado siguiente es clicable (`FaArrowRight`) y hay un gran botón de avance para pasar al siguiente estado permitido (según `estadosPedido.puedeTransicionar` / `obtenerEstadosSiguientes`).
  - Botón "Cancelar pedido" (rojo) disponible mientras el pedido pueda cancelarse; cambia el estado a `'cancelado'`.
  - Usa `PedidoContext.cambiarEstado` y `PedidoContext.pedidos`.
- NOTA: muestra todos los pedidos del seed (permite ver el flujo completo en un mismo admin). En una versión real debería listar solo los `'pendiente'`/`'confirmado'` de la sucursal del admin.

### 10.6 GestionSucursales (`/admin/sucursales`) — `GestionSucursales.jsx`

- Tabla con ID, Nombre, Dirección, Teléfono, Estado (Badge Activo/Inactivo según `ESTADO_SUCURSAL`) y Acciones.
- Carga con `useSucursal().obtenerSucursales()` (contexto), con Spinner.
- "Agregar nueva sucursal" → `/admin/sucursal/nuevo`.
- "Eliminar" con `window.confirm` y mensaje de resultado (simulado).
- Mensajes de éxito con `Alert` dismissible.

### 10.7 EditarSucursal (`/admin/sucursal/nuevo` | `/admin/sucursal/editar/:id`)

- Obtiene la sucursal a editar del contexto (`useSucursal`) por id.
- En modo creación o edición delega en `<FormularioSucursal />`.
- Al guardar llama a `agregarSucursal` o `actualizarSucursal` del contexto y navega de vuelta a `/admin/sucursales`. Muestra errores con `Alert`.

### 10.8 FormularioSucursal — `components/admin/FormularioSucursal.jsx`

- Campos: Nombre\*, Dirección\*, Latitud\*, Longitud\* (con validación de rangos `LIMITES_LAT`/`LIMITES_LNG`), Horario, Teléfono y Estado (Activo/Inactivo).
- Botones Guardar / Cancelar (cancelar vuelve a sucursales).
- En modo creación, tras guardar limpia el formulario.

### 10.9 Auth admin

- AdminLogin (`/admin-login`) con estilo Comi-Rapi (`Login.css`).
- AdminRegister (`/admin-registro`) layout básico de Bootstrap.

---

## 11. Navegación y estilo global

**Navbar (`comunes/Navbar.jsx` + `Navbar.css`):**
- Barra sticky con degradado naranja (`linear-gradient 90deg #f07f10 -> #ff9f1c -> #ffb347`) y sombra.
- Marca "Comi-Rapi" (`FaHamburger`) que rota un poco al hover; click va a la home del rol.
- Enlaces por rol con iconos react-icons (`FaHome`, `FaUtensils`, `FaShoppingCart`, `FaReceipt`, `FaMapMarkerAlt` para cliente; `FaTachometerAlt`, `FaHamburger`, `FaReceipt`, `FaStore` para admin).
- Hover animado: pill translúcido, subrayado animado, icono que rota, leve elevación. Página activa: pill blanco con texto naranja oscuro (`#b55d00`) vía `NavLink.isActive`.
- Zona de usuario: `FaUserCircle` + nombre, botón "Cerrar sesión" pill (`btn-logout-comirapi`) que hace logout y navega a `/login`.

**Footer (`comunes/Footer.jsx`):** `bg-dark`, "© 2026 Comi-Rapi - Todos los derechos reservados".

**Identidad de marca (paleta):**
- Naranjas: `#f07f10`, `#ff9f1c`, `#ffb347`.
- Naranja oscuro de acento: `#b55d00`.

**Botones:** sistema semántico de colores (tema global `src/styles/comirapi.css` aplicado sobre Bootstrap):

| Color | Rol | Uso |
|---|---|---|
| Naranja `#ff9f1c` | primary | CTA de marca (añadir, ordenar, guardar) |
| Verde `#22c55e` | success | confirmar-avanzar (confirmar pedido, avanzar estado) |
| Rojo `#e63946` | danger | destructivo (eliminar, cancelar, vaciar carrito) |
| Crema `#fff4e2` | secondary | neutro (volver, cancelar formulario, editar) |
| Blanco con texto naranja | — | CTAs del hero (ORDENAR / PIDE AHORA) |

- Contornos (`outline-danger/success/secondary`): cada uno con su color, se rellenan al hover.
- Forma: todos los `.btn` son pills (`border-radius 999px`) con iconos react-icons.

**Estilos por página (resumen):**
- Catálogo/ProductoCard/ItemCarrito/ResumenPedido/DetallePedido/Inicio: cards redondeadas, sombras suaves, botones pill con colores semánticos.
- Stepper admin (`PedidosPendientes.css`): animaciones con keyframes, estado actual pulsante naranja, futuros con opacidad reducida.

---
