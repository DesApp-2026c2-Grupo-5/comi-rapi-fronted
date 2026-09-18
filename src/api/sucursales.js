/**
 * Propósito: Servicio de sucursales que consume el backend real.
 * Contenido: obtenerSucursales, obtenerSucursalPorId.
 * Dependencias: client.js (apiGet).
 * Uso: import { obtenerSucursales } from '../api/sucursales';
 *
 * NOTA: El backend aún no expone endpoints de escritura (ABM de sucursales
 * pendiente de un sprint futuro). El CRUD simulado del panel admin se maneja
 * en el contexto (SucursalContext), en memoria.
 */

import { apiGet } from './client';

/**
 * Obtiene las sucursales del backend.
 * Por defecto el backend devuelve solo sucursales activas (listado público).
 * Pasando incluirInactivas=true (ADMIN autenticado) se piden todas con ?activa=false.
 * @param {object} [opciones]
 * @param {boolean} [opciones.incluirInactivas=false]
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerSucursales = async (opciones = {}) => {
  const { incluirInactivas = false } = opciones;
  const query = incluirInactivas ? '?activa=false' : '';
  const result = await apiGet(`/sucursales${query}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Obtiene una sucursal por su ID.
 * @param {number|string} id - ID de la sucursal.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>} Resultado de la operación.
 */
export const obtenerSucursalPorId = async (id) => {
  const result = await apiGet(`/sucursales/${id}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};
