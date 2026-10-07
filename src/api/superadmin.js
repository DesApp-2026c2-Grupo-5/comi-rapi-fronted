/**
 * Propósito: Servicio del panel de SUPERADMINISTRADOR.
 * Contenido: obtenerResumen (métricas globales agregadas del negocio).
 * Dependencias: client.js (apiGet).
 * Uso: import { obtenerResumen } from '../api/superadmin';
 */

import { apiGet } from './client';

/**
 * Trae el resumen agregado del negocio (GET /api/superadmin/resumen).
 * Solo lo puede ver el SUPERADMINISTRADOR (el backend lo exige).
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 *   data: { pedidos, porEstado, porSucursal, porDia, operacion }.
 */
export const obtenerResumen = async () => {
  const result = await apiGet('/superadmin/resumen');
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};