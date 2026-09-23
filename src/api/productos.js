/**
 * Propósito: Servicio de productos que consume el backend real (CRUD de administradores).
 * Contenido: obtenerProductos, obtenerProductoPorId, crearProducto, editarProducto, eliminarProducto.
 * Dependencias: client.js (apiGet/apiPost/apiPut/apiDelete).
 * Uso: import { obtenerProductos, editarProducto } from '../api/productos';
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

/**
 * Obtiene todos los productos activos.
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerProductos = async () => {
  const result = await apiGet('/productos');
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Obtiene un producto por su ID.
 * @param {number|string} id - ID del producto.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerProductoPorId = async (id) => {
  const result = await apiGet(`/productos/${id}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Crea un nuevo producto.
 * @param {object} nuevoProducto - { nombre, precio, categoriaId, tipo, imagen?, descripcion? }.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const crearProducto = async (nuevoProducto) => {
  const result = await apiPost('/productos', nuevoProducto);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Edita un producto existente.
 * @param {number|string} id - ID del producto a editar.
 * @param {object} datosActualizados - Campos a actualizar.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const editarProducto = async (id, datosActualizados) => {
  const result = await apiPut(`/productos/${id}`, datosActualizados);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Elimina (baja lógica) un producto.
 * @param {number|string} id - ID del producto a eliminar.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const eliminarProducto = async (id) => {
  const result = await apiDelete(`/productos/${id}`);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error };
};
