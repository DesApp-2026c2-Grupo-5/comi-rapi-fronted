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
