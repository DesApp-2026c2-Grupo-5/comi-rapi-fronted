/**
 * Propósito: Servicio de reportes y estadísticas del negocio.
 * Contenido: obtenerReportes (GET /reportes) con período y sucursal opcional.
 * Dependencias: client.js (apiGet).
 * Uso: import { obtenerReportes } from '../api/reportes';
 *
 * El backend resuelve el alcance por rol: un ADMINISTRADOR siempre ve su
 * sucursal (el `sucursalId` se ignora) y el SUPERADMINISTRADOR puede filtrar
 * por una sucursal o pedir el consolidado de todas.
 */

import { apiGet } from './client';

/**
 * Trae el reporte completo de un período.
 * @param {object} [opciones]
 * @param {string} [opciones.desde] - `YYYY-MM-DD`.
 * @param {string} [opciones.hasta] - `YYYY-MM-DD`.
 * @param {number|string} [opciones.sucursalId] - Solo aplica al SUPERADMINISTRADOR.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerReportes = async ({ desde, hasta, sucursalId } = {}) => {
  const params = new URLSearchParams();
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  if (sucursalId) params.set('sucursalId', sucursalId);
  const query = params.toString();

  const result = await apiGet(`/reportes${query ? `?${query}` : ''}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};
