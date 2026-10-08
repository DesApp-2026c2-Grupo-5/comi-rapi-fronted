/**
 * Propósito: Servicio de parámetros de negocio del backend.
 * Contenido: obtenerParametros (GET público) y actualizarParametros
 *   (PUT /superadmin/parametros, exclusivo del SUPERADMINISTRADOR).
 * Dependencias: client.js (apiGet/apiPut).
 * Uso: import { obtenerParametros, actualizarParametros } from '../api/parametros';
 */

import { apiGet, apiPut } from './client';

/**
 * Trae el catálogo de parámetros con su valor vigente.
 * Es de lectura pública: el frontend lo usa para no duplicar reglas de negocio
 * (límites del carrito, envío, promociones, etc.).
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 *   data: [{ clave, valor, valorPorDefecto, tipo, grupo, unidad, descripcion, minimo, maximo }].
 */
export const obtenerParametros = async () => {
  const result = await apiGet('/parametros');
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Actualiza uno o varios parámetros (mapa { clave: valor }).
 * Solo lo puede ejecutar el SUPERADMINISTRADOR (el backend lo exige).
 * @param {Object} cambios - { clave: valor } de los parámetros a cambiar.
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 *   data: catálogo completo actualizado.
 */
export const actualizarParametros = async (cambios) => {
  const result = await apiPut('/superadmin/parametros', cambios);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};