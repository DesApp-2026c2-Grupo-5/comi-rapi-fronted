# Comi-Rapi — Frontend

Interfaz de Comi-Rapi, una aplicación de delivery de comida con tres roles: cliente, administrador de sucursal y superadministrador. Consume la API de `comi-rapi-backend` y el canal de tiempo real por Socket.IO.

## Tecnologías

- React 18
- Vite 5
- React Router 6
- Bootstrap 5 y React Bootstrap
- React Icons
- Leaflet y React Leaflet
- Socket.IO Client
- PropTypes
- ESLint

## Instalación

Requiere Node.js 18 o superior y el backend levantado en el puerto 3000.

```shell
npm install

npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Horarios de atención

Las sucursales tienen horario estructurado por día y franja, y el backend decide si están
tomando pedidos en este momento (horario real menos el margen global `margenCierreMinutos`,
default 30). El frontend no recalcula esa regla: muestra `abiertaAhora`, `cierrePedidos`,
`segundosRestantes` y `proximaApertura` que vienen en `GET /api/sucursales`.

- Catálogo e inicio: un único aviso (`AvisoSucursalesCerradas`) cuando **todas** las
  sucursales activas están cerradas.
- Carrito: consulta la disponibilidad para la dirección e ítems; bloquea la confirmación
  si ninguna sucursal puede tomar el pedido y muestra el contador sólo si hay una sola
  viable (`POST /api/pedidos/disponibilidad`).
- Pago: avisa si la sucursal cerró y hay reasignación, o bloquea si no hay alternativa
  (`GET /api/pedidos/:id/disponibilidad`).
- Superadmin: `/superadmin/sucursales` edita las franjas (`EditorHorarios`) y
  `/superadmin/parametros` ajusta `margenCierreMinutos`.

El detalle funcional está en `documentacion.md` (§8.1).

## Centro de notificaciones y menú de cuenta

- **Campanita del cliente**: visible solo para el rol CLIENTE, en la fila superior del
  móvil y en la zona de escritorio del header. Muestra el contador de no leídas
  (`9+` a partir de diez) y abre un drawer lateral derecho con filtros Todas / Pedidos /
  Reclamos, estados de carga, vacío y error, y paginación "Ver más".
- **Persistencia real**: el listado y el contador salen de `/api/notificaciones` y el
  estado leído se guarda en la base, así que es el mismo desde cualquier dispositivo.
  El socket solo avisa `notificacion_creada`; los datos se releen por REST.
- **Menú de cuenta**: con sesión, el logo de Comi-Rapi es un botón que abre un menú con
  foto, nombre, correo, las opciones Editar direcciones (`/cliente/perfil?direcciones=1`),
  Configurar perfil (`/cliente/perfil`) y Cerrar sesión, más el interruptor de modo
  oscuro. El perfil, el logout y el nombre del cliente ya no están a la derecha del
  header. En móvil el menú se muestra como hoja inferior que tapa la barra de navegación;
  en escritorio cae debajo del logo. Para invitados el logo sigue siendo el enlace al
  inicio. El panel **no** usa el `Dropdown` de Bootstrap: sus clases
  (`.dropdown-item.active`) pintaban de azul el ítem de la ruta actual y, como `NavLink`
  ignora el query string, en `/cliente/perfil` marcaban las dos opciones a la vez. El
  estado activo se calcula comparando `pathname` + `search`, y el panel se monta en un
  portal sobre `<body>` para quedar por encima de la barra inferior del teléfono (mismo
  `z-index` que el header). Cierra con clic afuera y Escape; el foco queda contenido en
  el panel y las flechas recorren las opciones.
- **Interruptor de tema**: `SelectorTema.jsx` es un switch día/noche (sol con nube / luna
  con estrellas y cráteres) con dos variantes. La compacta vive en la barra de escritorio
  y, para el invitado, en la fila superior del móvil; la variante `fila` va dentro del
  menú de cuenta, donde además aparece "Seguir el tema del sistema" cuando la preferencia
  no es `SISTEMA`. El estado se expone con `role="switch"` y `aria-checked`.
- **Tiempo real**: el contexto del centro se conecta al socket del backend y refresca el
  badge al recibir el evento, sin reemplazar al listado REST.

El detalle del backend está en `comi-rapi-backend/docs/notificaciones.md`.
