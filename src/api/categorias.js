/**
 * Propósito: Servicio de categorías que consume el backend real.
 * Contenido: obtenerCategorias, obtenerCategoriaPorId, crearCategoria, editarCategoria, eliminarCategoria.
 * Dependencias: client.js (apiGet/apiPost/apiPut/apiDelete).
 * Uso: import { obtenerCategorias, crearCategoria } from '../api/categorias';
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

/**
 * Obtiene categorías del backend.
 * Por defecto el backend devuelve solo categorías activas (listado público).
 * Pasando incluirInactivas=true (ADMIN autenticado) se piden todas con ?activa=false.
 * @param {object} [opciones]
 * @param {boolean} [opciones.incluirInactivas=false]
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerCategorias = async (opciones = {}) => {
  const { incluirInactivas = false } = opciones;
  const query = incluirInactivas ? '?activa=false' : '';
  const result = await apiGet(`/categorias${query}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Obtiene una categoría por su ID.
 * @param {number|string} id - ID de la categoría.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerCategoriaPorId = async (id) => {
  const result = await apiGet(`/categorias/${id}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Crea una nueva categoría.
 * @param {object} datos - { nombre, descripcion? }.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const crearCategoria = async (datos) => {
  const result = await apiPost('/categorias', datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Edita una categoría. Puede incluir activa (true) para reactivar.
 * @param {number|string} id - ID de la categoría.
 * @param {object} datos - { nombre?, descripcion?, activa? }.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const editarCategoria = async (id, datos) => {
  const result = await apiPut(`/categorias/${id}`, datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Elimina (baja lógica) una categoría: activa pasa a false.
 * No borra físicamente ni elimina productos asociados.
 * @param {number|string} id - ID de la categoría.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const eliminarCategoria = async (id) => {
  const result = await apiDelete(`/categorias/${id}`);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error };
};
