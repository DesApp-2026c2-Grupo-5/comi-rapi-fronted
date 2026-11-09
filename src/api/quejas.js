/**
 * Propósito: Servicio de reclamos (quejas) contra el backend real.
 * Contenido: crearQueja, obtenerMisQuejas, obtenerQuejas, actualizarQueja,
 *            responderQueja, cerrarQueja.
 * Dependencias: client.js (apiGet/apiPost/apiPut).
 * Uso: import { crearQueja, obtenerMisQuejas } from '../api/quejas';
 */

import { apiGet, apiPost, apiPut } from './client';

/**
 * Crea el reclamo de un pedido propio entregado.
 * @param {{pedidoId: number|string, motivo: string, detalle: string}} datos
 */
export const crearQueja = async (datos) => {
  const result = await apiPost('/quejas', datos);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Quejas del cliente autenticado, opcionalmente acotadas a un pedido.
 * @param {number|string} [pedidoId]
 */
export const obtenerMisQuejas = async (pedidoId) => {
  const query = pedidoId ? `?pedidoId=${pedidoId}` : '';
  const result = await apiGet(`/quejas/mias${query}`);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Bandeja paginada para ADMINISTRADOR (su sucursal) o SUPERADMINISTRADOR.
 * @param {{estado?: string, q?: string, sucursalId?: number|string,
 *   pagina?: number, limite?: number}} [filtros]
 */
export const obtenerQuejas = async (filtros = {}) => {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      params.append(clave, valor);
    }
  });
  const query = params.toString();
  const result = await apiGet(`/quejas${query ? `?${query}` : ''}`);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Responde o cambia el estado de una queja.
 * @param {number|string} id
 * @param {{estado?: string, respuesta?: string}} datos
 */
export const actualizarQueja = async (id, datos) => {
  const result = await apiPut(`/quejas/${id}`, datos);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Suma un mensaje del negocio al hilo sin mover el estado del reclamo.
 * El backend lo distingue por la ausencia de `estado` en el cuerpo.
 * @param {number|string} id
 * @param {string} contenido
 */
export const enviarMensajeQueja = async (id, contenido) => {
  const result = await apiPut(`/quejas/${id}`, { respuesta: contenido });
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Respuesta del cliente en el hilo del reclamo.
 * @param {number|string} id
 * @param {string} contenido
 */
export const responderQueja = async (id, contenido) => {
  const result = await apiPost(`/quejas/${id}/mensajes`, { contenido });
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Cierre del reclamo por el cliente. Es final.
 * @param {number|string} id
 */
export const cerrarQueja = async (id) => {
  const result = await apiPost(`/quejas/${id}/cerrar`);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};
