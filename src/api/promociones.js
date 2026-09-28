/**
 * Propósito: Servicio de promociones que consume el backend real (ABM de administradores).
 * Contenido: obtenerPromociones, obtenerPromocionPorId, crearPromocion,
 *   editarPromocion, eliminarPromocion, obtenerProductosDePromocion,
 *   asignarProducto, quitarProducto.
 * Dependencias: client.js (apiGet/apiPost/apiPut/apiDelete).
 * Uso: import { obtenerPromociones, crearPromocion } from '../api/promociones';
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

/**
 * Obtiene promociones del backend.
 * Por defecto devuelve solo las activas (listado público).
 * Pasando incluirInactivas=true (ADMIN autenticado) se piden todas con ?activa=false.
 * @param {object} [opciones]
 * @param {boolean} [opciones.incluirInactivas=false]
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerPromociones = async (opciones = {}) => {
  const { incluirInactivas = false } = opciones;
  const query = incluirInactivas ? '?activa=false' : '';
  const result = await apiGet(`/promociones${query}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Obtiene una promoción por su ID.
 * @param {number|string} id - ID de la promoción.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerPromocionPorId = async (id) => {
  const result = await apiGet(`/promociones/${id}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Crea una nueva promoción.
 * @param {object} nuevaPromocion - { nombre, descripcion?, tipo, valor, fechaInicio?, fechaFin? }.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const crearPromocion = async (nuevaPromocion) => {
  const result = await apiPost('/promociones', nuevaPromocion);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Edita una promoción existente (campos parciales; activa=false para dar de baja).
 * @param {number|string} id - ID de la promoción a editar.
 * @param {object} datosActualizados - Campos a actualizar.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const editarPromocion = async (id, datosActualizados) => {
  const result = await apiPut(`/promociones/${id}`, datosActualizados);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Elimina (baja lógica) una promoción: activa pasa a false.
 * @param {number|string} id - ID de la promoción a eliminar.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const eliminarPromocion = async (id) => {
  const result = await apiDelete(`/promociones/${id}`);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error };
};

/**
 * Obtiene los productos alcanzados por una promoción.
 * @param {number|string} id - ID de la promoción.
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerProductosDePromocion = async (id) => {
  const result = await apiGet(`/promociones/${id}/productos`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Asigna un producto a una promoción.
 * @param {number|string} id - ID de la promoción.
 * @param {number|string} productoId - ID del producto a asignar.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const asignarProducto = async (id, productoId) => {
  const result = await apiPost(`/promociones/${id}/productos`, { productoId });
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Quita un producto de una promoción.
 * @param {number|string} id - ID de la promoción.
 * @param {number|string} productoId - ID del producto a quitar.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const quitarProducto = async (id, productoId) => {
  const result = await apiDelete(`/promociones/${id}/productos/${productoId}`);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error };
};
