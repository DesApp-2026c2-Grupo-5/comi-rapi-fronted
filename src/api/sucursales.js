/**
 * Propósito: Servicio de sucursales que consume el backend real (CRUD de administradores).
 * Contenido: obtenerSucursales, obtenerSucursalPorId, crearSucursal, actualizarSucursal, eliminarSucursal.
 * Dependencias: client.js (apiGet/apiPost/apiPut/apiDelete).
 * Uso: import { obtenerSucursales, crearSucursal } from '../api/sucursales';
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

/**
 * Obtiene sucursales del backend.
 * Por defecto devuelve solo las activas (listado público).
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
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerSucursalPorId = async (id) => {
  const result = await apiGet(`/sucursales/${id}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Crea una nueva sucursal.
 * @param {object} datos - { nombre, direccion, latitud?, longitud?, telefono?, horarios?, activa? }.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const crearSucursal = async (datos) => {
  const result = await apiPost('/sucursales', datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Actualiza una sucursal existente (campos parciales; activa=true para reactivar).
 * @param {number|string} id - ID de la sucursal.
 * @param {object} datos - Campos a actualizar.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const actualizarSucursal = async (id, datos) => {
  const result = await apiPut(`/sucursales/${id}`, datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Elimina (baja lógica) una sucursal: activa pasa a false.
 * @param {number|string} id - ID de la sucursal.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const eliminarSucursal = async (id) => {
  const result = await apiDelete(`/sucursales/${id}`);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error };
};