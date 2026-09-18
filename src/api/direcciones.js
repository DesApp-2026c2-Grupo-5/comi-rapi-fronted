/**
 * Propósito: Servicio de direcciones del cliente que consume el backend real.
 * Contenido: obtenerDirecciones, obtenerDireccionPorId, crearDireccion,
 *            actualizarDireccion, eliminarDireccion.
 * Dependencias: client.js (apiGet/apiPost/apiPut/apiDelete).
 * Uso: import { obtenerDirecciones, crearDireccion } from '../api/direcciones';
 *
 * El backend scopea por sesión: cada cliente solo ve/gestiona sus propias
 * direcciones (Der: Usuario 1:N Direccion). latitud/longitud son opcionales.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

/**
 * Obtiene las direcciones activas del cliente autenticado.
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerDirecciones = async () => {
  const result = await apiGet('/direcciones');
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Obtiene una dirección por su ID.
 * @param {number|string} id - ID de la dirección.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerDireccionPorId = async (id) => {
  const result = await apiGet(`/direcciones/${id}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Crea una nueva dirección para el cliente autenticado.
 * @param {object} datos - { calle, altura?, ciudad?, codigoPostal?, referencia?, alias?, latitud?, longitud? }.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const crearDireccion = async (datos) => {
  const result = await apiPost('/direcciones', datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Actualiza una dirección existente del cliente (campos parciales).
 * @param {number|string} id - ID de la dirección.
 * @param {object} datos - Campos a actualizar.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const actualizarDireccion = async (id, datos) => {
  const result = await apiPut(`/direcciones/${id}`, datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Elimina (baja lógica) una dirección: activa pasa a false.
 * @param {number|string} id - ID de la dirección.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const eliminarDireccion = async (id) => {
  const result = await apiDelete(`/direcciones/${id}`);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error };
};
