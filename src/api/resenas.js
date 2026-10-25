/**
 * Propósito: Servicio de reseñas de productos y combos contra el backend real.
 * Contenido: obtenerResenasDeProducto, obtenerProductosElegiblesParaResenar,
 *            obtenerMisResenas, crearResena, actualizarResena, eliminarResena.
 * Dependencias: client.js (apiGet/apiPost/apiPut/apiDelete).
 * Uso: import { obtenerResenasDeProducto } from '../api/resenas';
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

/**
 * Listado público y paginado de reseñas de un producto.
 * @param {number|string} productoId
 * @param {{pagina?: number, limite?: number}} [opciones]
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerResenasDeProducto = async (
  productoId,
  { pagina = 1, limite = 10 } = {}
) => {
  const result = await apiGet(
    `/productos/${productoId}/resenas?pagina=${pagina}&limite=${limite}`
  );
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Productos y combos que el cliente ya compró y recibió, y todavía no reseñó.
 * @param {number|string} [pedidoId] - Acota a un pedido puntual.
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerProductosElegiblesParaResenar = async (pedidoId) => {
  const query = pedidoId ? `?pedidoId=${pedidoId}` : '';
  const result = await apiGet(`/resenas/elegibles${query}`);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Reseñas del cliente autenticado, con el producto al que pertenecen.
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerMisResenas = async () => {
  const result = await apiGet('/resenas/mias');
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Crea la reseña de un producto comprado y entregado.
 * @param {{productoId: number|string, puntuacion: number, comentario?: string}} datos
 */
export const crearResena = async (datos) => {
  const result = await apiPost('/resenas', datos);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Edita la reseña propia.
 * @param {number|string} id
 * @param {{puntuacion: number, comentario?: string}} datos
 */
export const actualizarResena = async (id, datos) => {
  const result = await apiPut(`/resenas/${id}`, datos);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Elimina la reseña propia.
 * @param {number|string} id
 */
export const eliminarResena = async (id) => {
  const result = await apiDelete(`/resenas/${id}`);
  if (result.success) return { success: true };
  return { success: false, error: result.error };
};
