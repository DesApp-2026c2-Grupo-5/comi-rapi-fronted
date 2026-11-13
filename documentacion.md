# Comi-Rapi Frontend — Documentación Completa

> **Estado:** funcional e integrado al backend real (`comi-rapi-backend`, API en `/api`).
> Las secciones que se refieren a datos mock son **históricas**: sólo quedan mockeados
> `src/api/carrito.js` (el carrito real vive en `CarritoContext` + `localStorage`) y la
> asignación de sucursal que recibe `pedidosPendientesMock` en `SucursalContext`.
> **Versión:** comi-rapi-fronted (React 18 + Vite 5)
> **Cobertura:** CLIENTE · ADMINISTRADOR · SUPERADMINISTRADOR · Infraestructura (rutas,
> autenticación, contextos, capa API, horarios de atención)
>
> **Nota de actualización:** este documento nació cuando la app era sólo mock. Varias
> secciones (§6, §8, §10) se reescribieron para reflejar el backend real; las pantallas
> restantes pueden seguir describiendo detalles de UI válidos pero no el origen de datos.
> Ante la duda, el código y el `README.md` mandan.

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

> **Con backend:** la UI consume la API real del backend (`/api`, proxy de Vite a
> `localhost:3000`). La sesión viaja en cookie y las mutaciones llevan el token CSRF de
> doble envío que maneja `api/client.js`. No hay datos demo en pantalla salvo los dos
> casos indicados en el encabezado.

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
      Footer.jsx               Pie de página con marca, contacto y redes
      IconoEstado.jsx          SVG de estados de pedido + IconoCheck
      HistorialStepper.jsx     Stepper de estados compartido (cliente + admin)
      HistorialStepper.css
      ContadorCierre.jsx       Cuenta regresiva hasta el corte de pedidos
      AvisoSucursalesCerradas.jsx  Banner global "todas cerradas" + próxima apertura
    cliente/
      ProductoCard.jsx         Tarjeta de producto del catálogo
      ItemCarrito.jsx          Ítem del carrito (imagen, cantidad, eliminar)
      ResumenPedido.jsx        Resumen (subtotal, envío, total, sucursal)
      FormularioDireccion.jsx  Alta/edición de dirección
    admin/
      PanelAdmin.jsx           Tarjetas de estadísticas
      ListaProductos.jsx       Tabla de productos con acciones
      FormularioProducto.jsx   Formulario de producto
      FormularioSucursal.jsx   Formulario de sucursal (incluye el editor de horarios)
      EditorHorarios.jsx       Editor de franjas por día (siete días, cierre dentro del mismo día)
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
  api/                         Capa de API (fetch real al backend)
    client.js                  fetch con cookies + token CSRF de doble envío
    auth.js, carrito.js*, categorias.js, productos.js, pedidos.js,
    sucursales.js, direcciones.js, geo.js, perfil.js, usuarios.js,
    stock.js, insumos.js, promociones.js, personalizacion.js,
    personalizacionCategorias.js, parametros.js, reportes.js,
    resenas.js, superadmin.js, imagenes.js, health.js
  services/
    seedData.js                Datos semilla que quedan mock (ver §6)
    estadosPedido.js           Lógica de transiciones válidas
    asignacionSucursal.js      Sucursal "asignada" para mostrar (mock)
    envio.js, simuladorPago.js, socket.js, personalizacionConfig.js
  utils/
    constants.js               Roles, estados, variantes de Badge, colores
    helpers.js                 delay(), generateId(), filterByProperty()
    formatters.js              formatPrice(), formatDate()
    validators.js              validateEmail(), validatePassword(), validateProducto()
    horarios.js                Días, normalización, corte de pedidos, validación, textos
    direccion.js, llegada.js, carritoStorage.js, calculoPromociones.js
```

> `api/carrito.js` es el único módulo de API que sigue mockeado: el carrito real está en
> `CarritoContext` y se persiste en `localStorage` (`utils/carritoStorage.js`).

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
| `/cliente/pago` | `Pago` |
| `/cliente/sucursales` | `SucursalesCercanas` |
| `/cliente/mis-direcciones` | `MisDirecciones` |

**Protegidas ADMIN** (`ProtectedRoute requiredRole="ADMIN"`):

| Ruta | Componente |
|---|---|
| `/admin/dashboard` | `Dashboard` |
| `/admin/pedidos` | `GestionPedidos` (compartida con el SUPERADMIN con contexto) |
| `/admin/stock` | `GestionStock` (compartida con el SUPERADMIN con contexto) |
| `/admin/clientes` · `/admin/clientes/:id` | `GestionClientes` · `DetalleCliente` |
| `/admin/productos` | `GestionProductos` (solo lectura + disponibilidad por sucursal) |
| `/admin/categorias`, `/admin/promociones` | listados en solo lectura |
| `/admin/reportes` | `Reportes` |

**Protegidas SUPERADMIN** (`ProtectedRoute requiredRole="SUPERADMINISTRADOR"`):

| Ruta | Componente |
|---|---|
| `/superadmin/panel` | `PanelSuperadmin` (métricas globales vía `GET /api/superadmin/resumen`) |
| `/superadmin/reportes` | `Reportes` |
| `/superadmin/administradores` | `GestionAdministradores` (alta, edición y activación de administradores) |
| `/superadmin/clientes` · `/superadmin/clientes/:id` | `GestionClientes` · `DetalleCliente` |
| `/superadmin/sucursales` (+ `/sucursal/nuevo`, `/sucursal/editar/:id`) | `GestionSucursales` · `EditarSucursal` (incluye el editor de horarios) |
| `/superadmin/parametros` | `Parametros` (incluye `margenCierreMinutos`) |
| `/superadmin/productos`, `/superadmin/categorias` | CRUD de catálogo |
| `/superadmin/personalizacion` (+ `/categorias`) | Grupos, opciones y plantillas de personalización |
| `/superadmin/insumos`, `/superadmin/promociones` | Insumos y promociones |

El SUPERADMINISTRADOR entra por el mismo login del panel (`/admin-login`): con el
rol jerárquico el login es neutral por rol (`loginPanel` acepta ADMINISTRADOR y
SUPERADMINISTRADOR) y redirige con `destinoPorRol` a `/superadmin/panel`. Su
navbar es `menuSuperadmin` (Panel, Administradores) y no lleva la barra inferior
móvil (ver `useMuestraNavInferior`).

---

## 4. Autenticación y roles

**Roles** definidos en `utils/constants.js`:
- `ROLES.CLIENTE = 'CLIENTE'`
- `ROLES.ADMIN = 'ADMIN'`
- `ROLES.SUPERADMIN = 'SUPERADMINISTRADOR'`

**Flujo de login (`AuthContext`):**

| Función | Comportamiento |
|---|---|
| `login(email, password)` | `loginCliente` (`api/auth.js`) |
| `loginPanelAdmin(email, password)` | `loginPanel` (acepta ADMINISTRADOR y SUPERADMINISTRADOR) |
| `register(datos)` | `registroCliente` |
| `logout()` | limpia estado y `localStorage` |

- Al loguearse/registrarse correctamente se guarda el usuario en `localStorage` (`'user'`). Al montar la app se restaura la sesión.
- En `api/auth.js` el login valida contra `usuariosMock` buscando `email + password + rol`. La password nunca se persiste.

**Roles y UI:**
- `AuthContext` expone `isAuthenticated`, `isAdmin`, `isSuperadmin`, `isCliente`.
- La `Navbar` muestra menús diferentes por rol:
  - **Cliente:** Inicio, Catálogo, Carrito, Mis Pedidos, Mis direcciones.
  - **Admin:** Dashboard, Pedidos, Catálogo, Sucursales, Stock, Clientes.
  - **Superadmin:** Panel (métricas globales), Administradores.

**Protección de rutas (`components/comunes/ProtectedRoute.jsx`):**
- Si no está autenticado → redirige a `/login`.
- Si el rol no coincide → redirige a la home del rol que corresponda
  (`/cliente/inicio`, `/admin/dashboard` o `/superadmin/panel`) vía `destinoPorRol`.
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

- **Estado:** `user`, `loading`. **Funciones:** `login`, `loginPanelAdmin`, `register`, `logout`. **Derivados:** `isAuthenticated`, `isAdmin`, `isSuperadmin`, `isCliente`. `isSuperadmin` indica `user.rol === 'SUPERADMINISTRADOR'`.
- Usado por `Navbar`, `ProtectedRoute`, `Carrito` y todas las páginas.

### CarritoContext

- **Estado:** `items` (array de `{ producto, cantidad }`).
- **Funciones:** `agregarAlCarrito(producto, cantidad=1)`, `eliminarDelCarrito(id)`, `actualizarCantidad(id, n)` (`n<=0` elimina), `vaciarCarrito()`.
- **Derivados:** `totalItems`, `total` (suma `precio*cantidad`).
- Nota: usa `alert()` como feedback simulado.

### SucursalContext

- **Estado:** `sucursales`, `sucursalAsignada`, `pedidosPendientes`, `loading`.
- **Funciones:** `obtenerSucursales` (carga desde la API, incluidas las inactivas), `cargarSucursales` (carga y asigna la "óptima" para mostrar), `asignarSucursalOptima`, `cambiarSucursal(id)`, `agregarSucursal`, `actualizarSucursal`, `eliminarSucursal`.
- **Derivados:** `sucursalesCercanas` (solo activas), `sucursalesAbiertas` (activas y con `abiertaAhora`), `todasCerradas` y `proximaApertura` (la más cercana en el tiempo entre las cerradas).
- Las sucursales las serializa el backend con `id, nombre, direccion (objeto), latitud, longitud, telefono, horarios, horariosTexto, abiertaAhora, cierrePedidos, segundosRestantes, proximaApertura, activa`.
- La lista se refresca al volver a la pestaña y cada 2 minutos (`visibilitychange` + intervalo): `abiertaAhora` y `segundosRestantes` son una foto del backend, que igual revalida al crear el pedido y al confirmar el pago.
- **Ojo:** `sucursalAsignada` es sólo informativa para la UI (usa `services/asignacionSucursal.js` con `pedidosPendientesMock`). La sucursal real del pedido la decide el backend (más cercana abierta con stock dentro de cobertura).

### PedidoContext

- **Estado:** `pedidos` (`pedidosMock`), `pedidoActual`.
- **Funciones:** `crearPedido(datos, sucursalAsignada)` → estado inicial `'pendiente'` + historial; `confirmarPedido(id)` → PENDIENTE a CONFIRMADO (simula el pago); `cambiarEstado(id, nuevoEstado)`; `obtenerPedidosPendientes()` (devuelve los `'pendiente'` y `'confirmado'`).
- Cada pedido guarda: `id`, `cliente` (email), `productos`, `total`, `direccion`, `sucursal` (objeto completo), `estado`, `fecha`, `historialEstados` (array de `{ estado, fecha }`).

### DireccionContext

- **Estado:** `direcciones` (`direccionesMock`).
- **Funciones:** `cargarDirecciones(clienteId)` (activas de un cliente), `obtenerDireccionPrincipal(clienteId)`, `agregarDireccion(datos)`, `editarDireccion(id, datos)`, `eliminarDireccion(id)` (baja lógica a `'inactivo'`), `seleccionarDireccionPrincipal(id)`.
- **Reglas:** UNA dirección principal por cliente (al marcar/guardar una se desmarcan las demás). Si es la única activa, pasa a principal automáticamente. Las direcciones del cliente son TEXTUALES (`nombre, direccion, ciudad, codigoPostal, referencia, esPrincipal, estado`); no usan coordenadas (solo la sucursal usa `lat/lng`).

---

## 6. Capa API y datos mock remanentes

**`api/client.js`** es la base de todas las llamadas reales:

- `fetch` a `${VITE_API_URL || '/api'}` con `credentials: 'include'` (cookie de sesión).
- En `POST/PUT/PATCH/DELETE` agrega el token CSRF de doble envío (se lee del endpoint de sesión y se manda en `x-csrf-token`).
- Normaliza la respuesta a `{ success, data | error, opciones? }`.
- Si el backend responde 401, limpia la sesión local.

**Módulos de `api/`** (todos consumen el backend real salvo el indicado):

| Módulo | Uso |
|---|---|
| `auth.js` | login de cliente y de panel (ADMIN/SUPERADMIN), registro, sesión, contexto de sucursal del superadmin |
| `productos.js`, `categorias.js` | catálogo y CRUD (según rol) |
| `pedidos.js` | alta, listado, detalle, cambio de estado, `consultarDisponibilidad` y `obtenerDisponibilidadPedido` |
| `sucursales.js` | CRUD de sucursales; devuelve horarios estructurados y estado calculado |
| `direcciones.js`, `geo.js` | direcciones del cliente y geocodificación |
| `stock.js`, `insumos.js` | stock por sucursal y catálogo de insumos |
| `promociones.js`, `personalizacion.js`, `personalizacionCategorias.js` | promociones y personalización |
| `parametros.js` | parámetros del sistema (incluye `margenCierreMinutos`) |
| `resenas.js` | reseñas de productos |
| `reportes.js`, `superadmin.js`, `usuarios.js`, `perfil.js` | paneles de administración y perfil |
| `carrito.js` | **MOCK**: el carrito real vive en `CarritoContext` + `localStorage` |

**`services/seedData.js`** sólo conserva datos para las piezas mockeadas:

| Export | Detalle |
|---|---|
| `pedidosPendientesMock` | Pedidos por `sucursalId` que usa la asignación "informativa" de `SucursalContext` |
| `sucursalesMock`, `productosMock`, `categoriasMock`, `pedidosMock`, `usuariosMock`, `direccionesMock` | Restos de la etapa mock; las pantallas reales ya no los usan |

**`utils/`:**

| Módulo | Contenido |
|---|---|
| `constants.js` | `ROLES`, `ESTADOS_PEDIDO`, `ETIQUETAS_ESTADO_PEDIDO`, `VARIANTE_ESTADO_PEDIDO`, `COLOR_ESTADO_PEDIDO`, `ESTADO_SUCURSAL`, `ESTADO_DIRECCION`, `LIMITES_LAT/LNG` |
| `helpers.js` | `delay(ms)`, `generateId()`, `filterByProperty(array, prop, valor)` |
| `formatters.js` | `formatPrice` (ARS es-AR), `formatDate` (fecha larga es-AR) |
| `validators.js` | `validateEmail`, `validatePassword` (>= 6), `validateProducto` |
| `horarios.js` | `DIAS_SEMANA`, `normalizarHorarios`, `crearHorarioPorDefecto`, `corteDePedidos`, `validarHorarios`, `formatearHorarios`, `formatearProximaApertura`, `formatearCuentaRegresiva` |

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

La asignación **real** la hace el backend al crear el pedido (`POST /api/pedidos`): elige la sucursal más cercana por ruta con stock suficiente, dentro de la cobertura de la dirección y **abierta en ese momento**. Si la más cercana está cerrada, se saltea a la siguiente. El frontend ya no replica esa regla: no manda `sucursalId` y muestra la sucursal que devuelve el pedido creado.

`services/asignacionSucursal.js` (`asignarSucursalOptima`) quedó **sólo para la UI**: `SucursalContext` la usa con `pedidosPendientesMock` para mostrar una "sucursal asignada" informativa en la página de sucursales. No interviene en la creación ni en el pago.

> El cliente NO elige sucursal. En la confirmación, el detalle y el pago se muestra la sucursal que asignó el backend.

---

## 8.1 Horarios de atención (integración)

Cada sucursal tiene franjas por día (`HorarioSucursal` en el backend). El frontend **no recalcula el estado**: usa lo que devuelve la API (`abiertaAhora`, `cierrePedidos`, `segundosRestantes`, `proximaApertura`, `horariosTexto`). La regla del backend: el local cierra a la hora real de la franja y la página corta pedidos `margenCierreMinutos` antes (default 30 → 23:00 cierra, 22:30 corta).

**Dónde se ve:**

| Pantalla | Comportamiento |
|---|---|
| Catálogo (`Catalogo.jsx`) e Inicio (`Inicio.jsx`) | `<AvisoSucursalesCerradas />`: un único banner cuando **todas** las sucursales activas están cerradas, con la próxima apertura. No hay estado por producto ni chequeo por dirección. |
| Carrito (`Carrito.jsx`) | Consulta `POST /api/pedidos/disponibilidad` con la dirección elegida y los ítems. Si no hay sucursal viable, muestra el motivo y **deshabilita** confirmar. Si hay exactamente una (`unica`), muestra el contador con `ContadorCierre` (no hay a dónde reasignar) **sólo en los últimos 10 minutos** (`MINUTOS_AVISO_CIERRE`). Tras un alta rechazada, refresca la consulta. |
| Pago (`Pago.jsx`) | Consulta `GET /api/pedidos/:id/disponibilidad`. Si la sucursal cerró y hay alternativa, el panel "Tu pedido será preparado en" pasa a mostrar la sucursal nueva (se reasigna al pagar) sin aviso extra. Si no hay alternativa, muestra "La sucursal cerró", bloquea el pago; al intentar pagar (o si el evento WebSocket `sucursal_estado` avisa el cierre) el backend cancela el pedido, repone el stock y la pantalla vuelve al carrito con la notificación "La sucursal cerró". |
| Sucursales (`SucursalesCercanas.jsx`) | Muestra `horariosTexto` y el badge "Toma pedidos hasta HH:MM" / "Cerrada · abre …". |
| Superadmin → Sucursales | `EditorHorarios` edita las franjas de los siete días; `GestionSucursales` muestra la columna Horario. |
| Superadmin → Parámetros | `margenCierreMinutos` (grupo `horarios`, default 30) define el corte global. |

**Reglas que el editor replica (espejo, no autoridad):**

- `diaSemana` 1 = lunes … 7 = domingo; varias franjas por día y solapamientos permitidos.
- `apertura === cierre` es inválido y `cierre < apertura` también: cada franja tiene que cerrar dentro del mismo día (19:00–02:00 se rechaza porque pasaría al martes).
- Un día sin franjas está cerrado; para cerrar todo el local se desactiva la sucursal.
- Una franja más corta que el margen de cierre no deja ventana de pedidos: el formulario lo advierte.

**Componentes y utilidades nuevas:**

- `utils/horarios.js` — normalización a los siete días, `corteDePedidos`, validación y textos.
- `components/admin/EditorHorarios.jsx` — editor de franjas con "Copiar a todos los días".
- `components/comunes/ContadorCierre.jsx` — cuenta regresiva basada en `segundosRestantes`; avisa una vez al vencer.
- `components/comunes/AvisoSucursalesCerradas.jsx` — banner global del catálogo/inicio.

**Tiempo real:** `SucursalContext` escucha el evento `sucursal_estado` (Socket.IO) y relee `GET /api/sucursales`; el backend lo emite al crear/editar/baja una sucursal, al cambiar `margenCierreMinutos` y desde el vigía `lib/services/horarios_vigia.js` cuando vence el próximo corte o apertura. `Pago.jsx` escucha el mismo evento para re-consultar la disponibilidad y auto-cancelar si corresponde.

> Los contadores son avisos: el backend revalida el horario al crear el pedido y al confirmar el pago. Si el deadline venció, la próxima acción del cliente puede ser rechazada aunque la cuenta no haya llegado a cero.

---

## 9. Parte de cliente (detalle por pantalla)

### 9.1 Inicio (`/cliente/inicio`) — `src/pages/cliente/Inicio.jsx` + `Inicio.css`

- Hero naranja (fondo `#FF9F1C`) con texto "COMI" y "RAPI" separados y una hamburguesa flotante en el centro hecha con CSS puro, con ingredientes que vuelan (decoración animada).
- Badge "Google Play" a la izquierda y botón "ORDENAR" a la derecha.
- Sección "Nuestras Categorías": 5 círculos (Hamburguesas, Combos, Papas, Bebidas, Postres) usando placeholders de imagen.
- "Favoritos de la semana": 3 productos reutilizando `<ProductoCard />`.
- Sección "Envío a domicilio rápido": fondo naranja, texto blanco y botón "PIDE AHORA" con icono de bicicleta (SVG inline).
- Banner global `<AvisoSucursalesCerradas />` arriba del contenido: sólo aparece si ninguna sucursal activa está tomando pedidos.
- El footer oscuro lo provee el componente global `<Footer />`.

### 9.2 Catálogo (`/cliente/catalogo`) — `Catalogo.jsx` + `Catalogo.css`

- Título grande "Nuestro Catálogo".
- Banner global `<AvisoSucursalesCerradas />`: si ninguna sucursal activa está abierta, se avisa una sola vez (con la próxima apertura); el catálogo se sigue pudiendo recorrer.
- Filtros de categoría en pills (Todos + categorías de la API).
- Grid responsive de `<ProductoCard />` (md=3, lg=4 columnas).
- Aviso si no hay productos en la categoría.

### 9.3 ProductoCard — `components/cliente/ProductoCard.jsx` + `ProductoCard.css`

- Card redondeada con sombra, imagen arriba, nombre, descripción, precio destacado (`formatPrice`) y botón "Añadir" redondo naranja (100%).
- Al click llama a `agregarAlCarrito(producto, 1)` y muestra `alert`.

### 9.4 Carrito (`/cliente/carrito`) — `Carrito.jsx` + `Carrito.css`

- Título "Tu Carrito". Estado vacío con card y botón al catálogo.
- Lista de `<ItemCarrito />` más botón "Vaciar carrito".
- `<ResumenPedido onConfirmar={handleConfirmarPedido} deshabilitado={...} />`.
- Sin dirección: banner de alerta con link para agregarla y confirmar bloqueado.
- **Disponibilidad** (aviso previo, no reserva): con la dirección elegida y los ítems consulta `POST /api/pedidos/disponibilidad`.
  - `disponible: false` → `Alert` con el motivo (todas cerradas / sin stock), botón "Sin sucursal disponible" deshabilitado.
  - `unica: true` → aviso con `ContadorCierre` y el corte de pedidos: es la única sucursal viable, no hay a dónde reasignar. El aviso aparece sólo en los últimos 10 minutos.
  - Si el alta falla, refresca la consulta para que el aviso refleje la situación real.
- Confirmación (flujo real):
  1. `crearPedido({ direccionId, productos, medioPago?, ... })` → `POST /api/pedidos`; el backend asigna sucursal (más cercana abierta con stock y cobertura).
  2. El pedido queda `pendiente`; se navega a la pantalla de pago (`/cliente/pago`).
  3. `vaciarCarrito()` recién cuando el pago se confirma.
- Si hay un pago pendiente y el carrito cambió, ofrece actualizar el pedido antes de pagar.

### 9.5 ItemCarrito — `components/cliente/ItemCarrito.jsx` + `ItemCarrito.css`

- Card con imagen, nombre, precio unitario, input de cantidad (1-20), subtotal y botón circular de eliminar (SVG de cruz inline).
- Las cantidades se actualizan con `actualizarCantidad`.

### 9.6 ResumenPedido — `components/cliente/ResumenPedido.jsx` + `ResumenPedido.css`

- Props: `onConfirmar`, `items`, `total`, `costoEnvio`, `sucursal`, `botonTexto`, `descuento`, `detalleDescuento`, `promociones`, `fija`, `deshabilitado`.
- Sin props → usa el carrito (modo carrito). En modo lectura recibe `items/total/sucursal` y el total del backend ya incluye el envío (no se recalcula).
- `deshabilitado` apaga el botón de confirmar sin quitarlo: el carrito lo usa cuando la disponibilidad dijo que no hay sucursal que pueda tomar el pedido. El motivo se explica en un `Alert` de la página.
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

### 9.12 Pago (`/cliente/pago`) — `Pago.jsx` + `Pago.css`

- Muestra el pedido `pendiente` (resumen en modo lectura) y las opciones de pago (Mercado Pago / Tarjeta); al elegir una, simula el cobro y llama a `confirmarPedido` (pendiente → confirmado).
- **Disponibilidad del pago**: `GET /api/pedidos/:id/disponibilidad`.
  - `abierta: false` + `hayAlternativa: true` → el panel de sucursal que prepara el pedido muestra directamente la alternativa (nombre y dirección): se reasigna sola al pagar, sin aviso adicional.
  - `abierta: false` + `hayAlternativa: false` → aviso corto "La sucursal cerró" y botones de pago deshabilitados. Al intentar pagar, o cuando el evento `sucursal_estado` detecta el cierre, se cancela el pedido (el backend repone el stock) y se vuelve al carrito con los productos.
  - `abierta: true` + sin alternativa → `ContadorCierre` ("última chance"), sólo en los últimos 10 minutos.
- Si la confirmación falla por stock, se revalida la disponibilidad y el pedido sigue `pendiente`. Si el backend responde 409 con `cancelado: true`, el pedido ya quedó cancelado y se vuelve al carrito.

### 9.13 Sucursales (`/cliente/sucursales`) — `SucursalesCercanas.jsx`

- Tarjetas de sucursales activas con dirección, teléfono y `horariosTexto`.
- Badge de estado calculado por el backend: "Toma pedidos hasta HH:MM" o "Cerrada · abre …" (`proximaApertura`).
- Aclara que la asignación final la hace el sistema al confirmar el pedido (cercanía, cobertura, stock y horario).

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

### 10.6 GestionSucursales (`/superadmin/sucursales`) — `GestionSucursales.jsx`

- Tabla con ID, Nombre, Dirección, Teléfono, Horario y Estado (Badge según `activa`).
- La columna **Horario** muestra `horariosTexto` y un badge de estado: "Abierta · hasta HH:MM" o "Cerrada", calculado por el backend (`abiertaAhora`, `cierrePedidos`).
- Carga con `useSucursal().obtenerSucursales()` (contexto), con Spinner.
- "Agregar nueva sucursal" → `/superadmin/sucursal/nuevo`.
- "Eliminar" con confirmación y mensaje de resultado.
- Mensajes de éxito con `Alert` dismissible.

### 10.7 EditarSucursal (`/superadmin/sucursal/nuevo` | `/superadmin/sucursal/editar/:id`)

- Obtiene la sucursal a editar del contexto (`useSucursal`) por id.
- En modo creación o edición delega en `<FormularioSucursal />`.
- Al guardar llama a `agregarSucursal` o `actualizarSucursal` del contexto y navega de vuelta a `/superadmin/sucursales`. Muestra errores con `Alert` (incluidas las opciones de desambiguación de dirección).

### 10.8 FormularioSucursal — `components/admin/FormularioSucursal.jsx`

- Campos: Nombre\*, Dirección\* (con preview/geocodificación del backend), Horario, Teléfono y Estado (Activa/Inactiva). Ya no se cargan latitud/longitud a mano.
- **Horario**: `<EditorHorarios />` con los siete días. Cada día tiene una o más franjas (`apertura`–`cierre`); "Agregar franja" y eliminar por franja. Al guardar se envía `horarios: [{ diaSemana, franjas: [{ apertura, cierre }] }]`.
- `margenMinutos` (parámetro global) se usa para mostrar el corte de pedidos y validar que una franja no dure menos que el margen.
- `normalizarHorarios` / `crearHorarioPorDefecto` (10:00–23:00) precargan el horario de una sucursal nueva.
- Botones Guardar / Cancelar (cancelar vuelve a sucursales).

### 10.9 Auth admin

- AdminLogin (`/admin-login`) con estilo Comi-Rapi (`Login.css`).
- AdminRegister (`/admin-registro`) layout básico de Bootstrap.

### 10.10 Parámetros del sistema (`/superadmin/parametros`) — `Parametros.jsx` + `FormularioParametros.jsx`

- Edita el catálogo de parámetros globales (`GET /api/parametros` / `PUT /api/superadmin/parametros`).
- `ParametrosContext` guarda los valores y expone `margenCierreMinutos` (default 30) para que las pantallas muestren el corte de pedidos sin duplicar la regla.
- Grupo **Horarios**: `margenCierreMinutos` (0–120). Cambiarlo mueve el corte de todas las sucursales: el local cierra a la hora de la franja y la página deja de tomar pedidos esos minutos antes.

---

## 11. Navegación y estilo global

**Navbar (`comunes/Navbar.jsx` + `Navbar.css`):**
- Barra sticky con degradado naranja (`linear-gradient 90deg #f07f10 -> #ff9f1c -> #ffb347`) y sombra.
- Marca "Comi-Rapi" (`FaHamburger`) que rota un poco al hover; click va a la home del rol.
- Enlaces por rol con iconos react-icons (`FaHome`, `FaUtensils`, `FaShoppingCart`, `FaReceipt`, `FaMapMarkerAlt` para cliente; `FaTachometerAlt`, `FaHamburger`, `FaReceipt`, `FaStore` para admin).
- Hover animado: pill translúcido, subrayado animado, icono que rota, leve elevación. Página activa: pill blanco con texto naranja oscuro (`#b55d00`) vía `NavLink.isActive`.
- Zona de usuario: `FaUserCircle` + nombre, botón "Cerrar sesión" pill (`btn-logout-comirapi`) que hace logout y navega a `/login`.

**Footer (`comunes/Footer.jsx`):** superficie crema de marca con logo, contacto y redes.
No muestra horarios: el estado de atención vive en la ficha de cada sucursal y en los
avisos del catálogo, carrito y pago.

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
