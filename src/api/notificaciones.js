/**
 * Propósito: Servicio del centro de notificaciones contra el backend real.
 * Contenido: obtenerNotificaciones, obtenerNoLeidas, marcarLeida y
 *            marcarTodasLeidas.
 * Dependencias: client.js (apiGet/apiPut).
 * Uso: import { obtenerNotificaciones } from '../api/notificaciones';
 *
 * El backend persiste el estado leído, así que el contador es el mismo en
 * cualquier dispositivo. El canal de tiempo real sólo avisa que hay algo nuevo:
 * la verdad se lee por REST.
 */

import { apiGet, apiPut } from './client';

/**
 * Listado paginado del usuario autenticado.
 *
 * @param {{ tipo?: string, soloNoLeidas?: boolean, pagina?: number,
 *   limite?: number }} [opciones]
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerNotificaciones = async ({
  tipo,
  soloNoLeidas,
  pagina,
  limite,
} = {}) => {
  const params = new URLSearchParams();
  if (tipo) params.set('tipo', tipo);
  if (soloNoLeidas) params.set('noLeidas', '1');
  if (pagina) params.set('pagina', String(pagina));
  if (limite) params.set('limite', String(limite));
  const query = params.toString();
  const result = await apiGet(`/notificaciones${query ? `?${query}` : ''}`);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Cantidad de notificaciones no leídas (badge del header).
 * @returns {Promise<{success: boolean, data?: {noLeidas: number}, error?: string}>}
 */
export const obtenerNoLeidas = async () => {
  const result = await apiGet('/notificaciones/no-leidas');
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Marca una notificación como leída.
 * @param {number|string} id
 */
export const marcarLeida = async (id) => {
  const result = await apiPut(`/notificaciones/${id}/leida`);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Marca todas las notificaciones pendientes como leídas.
 */
export const marcarTodasLeidas = async () => {
  const result = await apiPut('/notificaciones/leidas');
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};
