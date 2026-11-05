/**
 * Propósito: Conexión única al canal de tiempo real del backend (Socket.IO).
 * Contenido: conectarSocket, desconectarSocket, suscribirPedido,
 *            desuscribirPedido, onPedidoEvento, EVENTOS_SOCKET.
 * Dependencias: socket.io-client.
 * Uso: import { conectarSocket, EVENTOS_SOCKET } from '../services/socket';
 *
 * El socket NO reemplaza a la API REST: es solo un aviso de que un pedido
 * cambió. Cada evento trae únicamente el `pedidoId`; los datos se van a leer
 * con `api/pedidos.js`, que es la fuente de verdad.
 *
 * Autenticación por sesión: la conexión viaja con la misma cookie HttpOnly
 * `comirapi.sid` que el resto de la API (`withCredentials: true`). No hay JWT.
 *
 * Roles: el admin entra de forma automática a la room `sucursal:{id}` de su
 * local (tras el rol jerárquico) y el SUPERADMINISTRADOR a la room global
 * `admins`; el cliente se suscribe a cada uno de sus pedidos con
 * `suscribirPedido`. El backend verifica la autorización: pedir la room de un
 * pedido ajeno falla.
 *
 * Eventos de servidor (espejo de lib/realtime/eventos.js):
 *   - pedido_actualizado: un pedido cambió de estado/reasignación. El evento
 *     solo trae el pedidoId; los datos se leen por REST.
 *   - catalogo_actualizado: un producto/categoría/promoción fue creado,
 *     editado o eliminado (broadcast a todos los conectados).
 *   - parametros_actualizados: un parámetro del sistema cambió (broadcast).
 *   - stock_actualizado: cambió el stock de una sucursal. Solo se emite a la
 *     room de esa sucursal, así que llega únicamente a su administrador.
 * No existe aviso al crear un pedido: todo pedido nace `pendiente` y el panel
 * de administración no muestra los pendientes, así que el admin se entera
 * recién al confirmarse el pago. Para el cliente, su propio POST ya le devolvió
 * el pedido.
 */

import { io } from 'socket.io-client';

/** Origen del servidor de tiempo real; sin VITE_SOCKET_URL se deriva de la API. */
const ORIGEN_SOCKET =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL
    ? new URL(import.meta.env.VITE_API_URL).origin
    : window.location.origin);

/** Nombres de evento, espejo de `lib/realtime/eventos.js` del backend. */
export const EVENTOS_SOCKET = {
  SUSCRIBIR_PEDIDO: 'suscribir_pedido',
  DESUSCRIBIR_PEDIDO: 'desuscribir_pedido',
  PEDIDO_ACTUALIZADO: 'pedido_actualizado',
  CATALOGO_ACTUALIZADO: 'catalogo_actualizado',
  PARAMETROS_ACTUALIZADOS: 'parametros_actualizados',
  STOCK_ACTUALIZADO: 'stock_actualizado',
};

/**
 * @type {import('socket.io-client').Socket|null}
 * Instancia única. Vive fuera de React para que StrictMode monte-desmonte-
 * monte no abra ni cierre conexiones duplicadas.
 */
let socket = null;

/**
 * Abre (o reutiliza) la conexión con el backend.
 *
 * Es idempotente: si ya hay una instancia, la devuelve sin tocar nada.
 *
 * @returns {import('socket.io-client').Socket} Instancia conectada o en reconexión.
 */
export const conectarSocket = () => {
  if (socket) return socket;
  socket = io(ORIGEN_SOCKET, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    // Reconexión automática con backoff: si se cae la red o se reinicia el
    // backend, el socket vuelve solo. Cada reconexión dispara 'connect' de
    // nuevo, que es donde hay que volver a suscribirse (las rooms viven en el
    // servidor y se pierden al cambiar de socket.id).
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  // Los avisos de catálogo/parámetros/stock los consume RealtimeBridge, que
  // invalida las claves de TanStack Query. `pedido_actualizado` lo maneja
  // PedidoContext. El socket sigue siendo sólo un aviso; no lee datos.
  return socket;
};

/** Cierra la conexión y descarta la instancia. */
export const desconectarSocket = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};

/** @returns {boolean} Si hay una conexión viva en este momento. */
export const socketConectado = () => Boolean(socket && socket.connected);

/**
 * Se registra en la room privada de un pedido.
 *
 * El backend decide: si el usuario no es el dueño y no es admin, responde con
 * `{ success: false, error: 'Acceso denegado' }` y no entra a la room.
 *
 * @param {number} pedidoId - Pedido al que querer escuchar cambios.
 * @returns {Promise<{success: boolean, pedidoId?: number, error?: string}>} Ack del backend.
 */
export const suscribirPedido = (pedidoId) =>
  new Promise((resolve) => {
    if (!socket) return resolve({ success: false, error: 'Sin conexión' });
    return socket.emit(
      EVENTOS_SOCKET.SUSCRIBIR_PEDIDO,
      { pedidoId },
      (respuesta) => resolve(respuesta || { success: false, error: 'Sin respuesta' })
    );
  });

/**
 * Sale de la room privada de un pedido.
 * @param {number} pedidoId - Pedido que dejó de interesa.
 */
export const desuscribirPedido = (pedidoId) => {
  if (!socket) return;
  socket.emit(EVENTOS_SOCKET.DESUSCRIBIR_PEDIDO, { pedidoId });
};

/**
 * Atajo tipado para escuchar un evento de pedido.
 * @param {string} evento - Nombre del evento.
 * @param {(payload: {pedidoId: number}) => void} handler - Manejador.
 * @returns {import('socket.io-client').Socket} La misma instancia.
 */
export const onPedidoEvento = (evento, handler) => {
  if (!socket) return null;
  return socket.on(evento, handler);
};

/**
 * Registra un handler para las RECONEXIONES del socket, ignorando la primera
 * conexión de la sesión.
 *
 * Las pantallas ya cargan sus datos al montar; el evento `connect` también se
 * emite en la primera conexión, así que sin este guard se duplicaba cada carga
 * completa de página. Solo las reconexiones (red caída, reinicio del backend)
 * necesitan resincronizar por REST, porque el aviso se perdió mientras no había
 * canal.
 *
 * @param {import('socket.io-client').Socket} instancia - Socket ya conectado o en curso.
 * @param {() => void} handler - Acción a ejecutar al reconectar.
 * @returns {() => void} Cleanup para el `useEffect`.
 */
export const alReconectar = (instancia, handler) => {
  if (!instancia) return () => {};
  // Si la instancia ya está conectada al registrar el handler, la primera
  // conexión de la sesión ya ocurrió: el próximo `connect` es una reconexión y
  // sí debe resincronizar. Si todavía está conectando, se ignora la primera.
  let primeraConexion = !instancia.connected;
  const listener = () => {
    if (primeraConexion) {
      primeraConexion = false;
      return;
    }
    handler();
  };
  instancia.on('connect', listener);
  return () => instancia.off('connect', listener);
};
