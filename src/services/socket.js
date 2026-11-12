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
 *   - sucursal_actualizado: se creó, editó o dio de baja una sucursal. Es
 *     público (la lista de activas la usan clientes e invitados) y trae el
 *     elemento afectado para actualizar la caché sin GET.
 *   - queja_actualizada: se creó o cambió un reclamo. Llega a los
 *     administradores de la sucursal del pedido y al superadministrador; el
 *     badge de reclamos pendientes se reconsulta por REST.
 *   - notificacion_creada: el usuario tiene una fila nueva en su centro de
 *     notificaciones. Va sólo a su room privada `usuario:{id}`; el listado y el
 *     contador se reconsultan por REST.
 * No existe aviso al crear un pedido: todo pedido nace `pendiente` y el panel
 * de administración no muestra los pendientes, así que el admin se entera
 * recién al confirmarse el pago. Para el cliente, su propio POST ya le devolvió
 * el pedido.
 */

import { io } from 'socket.io-client';

/** Exponer singleton global para debugging/testing (solo desarrollo) */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__getSocketInstance = () => socket;
}

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
  SUCURSAL_ACTUALIZADO: 'sucursal_actualizado',
  SUCURSAL_ESTADO: 'sucursal_estado',
  QUEJA_ACTUALIZADA: 'queja_actualizada',
  NOTIFICACION_CREADA: 'notificacion_creada',
  PERSONALIZACION_ACTUALIZADO: 'personalizacion_actualizado',
  PERSONALIZACION_CATEGORIA_ACTUALIZADA: 'personalizacion_categoria_actualizada',
};

/**
 * @type {import('socket.io-client').Socket|null}
 * Instancia única. Vive fuera de React para que StrictMode monte-desmonte-
 * monte no abra ni cierre conexiones duplicadas.
 */
let socket = null;

/**
 * Marca la próxima conexión como INTENCIONAL (cambio de contexto de sucursal),
 * no como una recuperación tras una caída del canal. Los listeners registrados
 * con `alReconectar` la ignoran: al cambiar de contexto los datos que dependen
 * de la sucursal se recargan por sus propias claves y no hace falta invalidar
 * toda la caché ni repetir consultas globales.
 */
let reconexionIntencional = false;

/**
 * Indica si la reconexión que se está procesando fue forzada por un cambio de
 * contexto. Sólo tiene sentido consultarlo dentro de un handler registrado con
 * `alReconectar`.
 * @returns {boolean}
 */
export const esReconexionIntencional = () => reconexionIntencional;

/**
 * Abre (o reutiliza) la conexión con el backend.
 *
 * Es idempotente: si ya hay una instancia viva, la devuelve.
 * Si existe pero está desconectada, fuerza una reconexión para renegociar
 * el handshake con la cookie de sesión actual.
 *
 * @returns {import('socket.io-client').Socket} Instancia conectada o en reconexión.
 */
export const conectarSocket = () => {
  if (socket) {
    if (socket.connected) {
      console.log('[DIAG] Socket: reutilizando instancia existente', { connected: true, id: socket.id });
      return socket;
    }
    // Instancia existe pero está desconectada: forzar reconexión con cookie actual
    console.log('[DIAG] Socket: instancia desconectada, forzando reconexión...', { id: socket.id });
    socket.connect();
    return socket;
  }
  console.log('[DIAG] Socket: creando nueva conexión...');
  socket = io(ORIGEN_SOCKET, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('[DIAG] Socket: conectado', { id: socket.id });
  });
  socket.on('disconnect', (reason) => {
    console.log('[DIAG] Socket: desconectado', { reason });
  });
  socket.on('connect_error', (error) => {
    console.log('[DIAG] Socket: error de conexión', { message: error.message });
  });

  return socket;
};

/**
 * Fuerza una reconexión inmediata del singleton manteniendo los listeners.
 * Útil cuando la sesión cambió (ej. SUPERADMIN elige sucursal) y hay que
 * renegociar el handshake con la nueva cookie sin destruir la instancia.
 *
 * @returns {import('socket.io-client').Socket} La misma instancia, reconectando.
 */
export const forzarReconexion = () => {
  if (!socket) {
    console.log('[DIAG] forzarReconexion: no hay instancia, creando nueva...');
    return conectarSocket();
  }
  reconexionIntencional = true;
  const limpiarMarca = () => {
    reconexionIntencional = false;
    socket.off('connect', limpiarMarca);
    socket.off('connect_error', limpiarMarca);
  };
  // Se registran al final para que los listeners de `alReconectar` ya
  // registrados vean la marca durante este mismo evento `connect`.
  socket.once('connect', limpiarMarca);
  socket.once('connect_error', limpiarMarca);
  if (socket.connected) {
    console.log('[DIAG] forzarReconexion: desconectando para renegociar handshake...');
    socket.disconnect();
  }
  // socket.connect() usa la cookie actual (ya actualizada por refrescarUsuario)
  console.log('[DIAG] forzarReconexion: conectando con nueva sesión...');
  socket.connect();
  return socket;
};

/** Cierra la conexión y descarta la instancia (solo para logout). */
export const desconectarSocket = () => {
  if (!socket) return;
  console.log('[DIAG] desconectarSocket: cerrando instancia singleton (logout)');
  socket.removeAllListeners(); // Limpio total al cerrar sesión
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
 * conexión de la sesión y las reconexiones INTENCIONALES (cambio de contexto
 * de sucursal) disparadas con `forzarReconexion`.
 *
 * Las pantallas ya cargan sus datos al montar; el evento `connect` también se
 * emite en la primera conexión, así que sin este guard se duplicaba cada carga
 * completa de página. Solo las reconexiones reales (red caída, reinicio del
 * backend) necesitan resincronizar por REST, porque el aviso se perdió mientras
 * no había canal. El cambio de contexto renegocia el handshake pero no pierde
 * avisos: no debe invalidar toda la caché.
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
    if (reconexionIntencional) return;
    handler();
  };
  instancia.on('connect', listener);
  return () => instancia.off('connect', listener);
};
