# Plan — Carrito persistente por usuario (sobrevive recarga)

Fecha: 2026-09-18
Alcance: solo frontend (`comi-rapi-fronted/`). Sin backend, sin dependencias nuevas.

## 1. Diagnóstico

- `src/context/CarritoContext.jsx:8` usa `useState([])` puro: al recargar la página todo se pierde.
- Los items son 100% serializables (producto plano, personalización plana,
  cantidades, `idLinea` string), así que `localStorage` alcanza. El DER define
  el carrito como temporal no persistido: no corresponde tabla en Postgres.
- Patrón ya usado en el proyecto: persistencia local simple con clave
  versionada y saneado al hidratar.

## 2. Diseño elegido: por usuario (email)

- Clave versionada: `comirapi:carrito:v1:<email>` (email normalizado en
  minúsculas y sin espacios; invitados no logueados: `:invitado`).
- Al loguearse, el carrito de invitado **migra** al del usuario (merge por
  `idLinea`, sumando cantidades ante duplicados) y se borra la clave invitado.
- Al confirmar pedido (éxito) o vaciar manual: se borra la clave del usuario.
- Al logout: **no** se borra (cada usuario retoma lo suyo al volver).

## 3. Cambios

### 3.1 Nuevo `src/utils/carritoStorage.js`

Helpers puros y testeables manualmente:

- `claveCarrito(email)` → `comirapi:carrito:v1:<email|invitado>`.
- `leerCarrito(email)` → array saneado o `[]` (try/catch ante JSON corrupto).
- `guardarCarrito(email, items)` → `localStorage.setItem` con try/catch
  (modo privado / cuota llena no deben romper la app).
- `limpiarCarrito(email)` → `removeItem`.
- `migrarCarritoInvitado(email)` → merge invitado → usuario + borra invitado.
- `sanearItems(items)` → conserva solo líneas con `producto.id`,
  `producto.nombre`, `producto.precio` numérico y `cantidad >= 1`; descarta el
  resto.

### 3.2 `src/context/CarritoContext.jsx`

- Init lazy: `useState(() => sanearItems(leerCarrito(email)))` +
  **recálculo** de `precioUnitarioPersonalizado` con
  `calcularPrecioUnitario` (la config de precios puede haber cambiado entre
  sesiones; nunca se confía en el precio guardado).
- `useEffect`: persiste `items` en cada cambio.
- `vaciarCarrito` y flujo post-pago: limpian la clave del usuario.
- Listener del evento `storage`: sincroniza pestañas abiertas del mismo
  navegador (opcional, ~5 líneas).
- Expone `migrarCarritoAlLoguearse(email)` para invocar desde el login, una
  vez que el email del usuario esté disponible en contexto.

## 4. Casos borde

| Caso | Comportamiento |
| ---- | -------------- |
| Storage con texto inválido | Se ignora, arranca `[]` |
| Item sin `producto.id` / precio | Descartado por `sanearItems` |
| Precios del catálogo cambiaron | Se recalculan al hidratar; el total final lo define el backend al confirmar |
| Dos usuarios, mismo navegador | Claves separadas, sin fugas |
| Invitado agrega y luego se loguea | Merge a su clave, conserva todo |
| Cuota llena / modo privado | try/catch, la app sigue en memoria |

## 5. Verificación

- `npx eslint src/utils/carritoStorage.js src/context/CarritoContext.jsx`
  (el frontend no tiene runner de tests).
- Manual:
  1. Agregar items → recargar → persisten con totales correctos.
  2. Pagar → carrito vacío tras confirmación.
  3. Corromper la clave en DevTools → recarga sin errores, carrito vacío.
  4. Invitado agrega → login → conserva items en su clave.
  5. Login con otro usuario → ve su propio carrito.
  6. Dos pestañas: agregar en una se refleja en la otra.

## 6. Email del auth a pedidos + carrito (incluido en esta tarea)

El auth ahora es contra backend real sin `localStorage 'user'`, por lo que
`leerUsuarioMock()` en `src/api/pedidos.js` siempre da null y
`obtenerPedidos()` sin email devuelve `success:false`: el historial queda
vacío. Como el carrito por usuario también necesita el email, se resuelve
junto (sin tocar el login: `AuthProvider` envuelve a ambos providers y expone
`user?.email` y `hydrated` vía `useAuth()`).

- `src/api/pedidos.js`: `obtenerPedidos(email)`,
  `obtenerPedidoPorId(id, email)`, `confirmarPedido(id, email)` aceptan email
  opcional solo para la sesión silenciosa; `crearPedido` ya lo extrae de
  `datosPedido.cliente`; se elimina `leerUsuarioMock()` obsoleto.
- `src/context/PedidoContext.jsx`: lee `user?.email` y `hydrated`; la carga
  inicial espera `hydrated` y usa el email (sin usuario → lista vacía).
- `src/context/CarritoContext.jsx`: clave según `user?.email`; ante cambio
  de email migra invitado → usuario y cambia de clave.
