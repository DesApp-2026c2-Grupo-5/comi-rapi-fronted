/**
 * Propósito: Servicio del catálogo de insumos (extras y condimentos).
 * Contenido: obtenerInsumos, obtenerInsumoPorId, crearInsumo, actualizarInsumo,
 *            eliminarInsumo.
 * Dependencias: client.js (apiGet/apiPost/apiPut/apiDelete).
 * Uso: import { obtenerInsumos, crearInsumo } from '../api/insumos';
 *
 * Un insumo es una entidad propia (no un producto): tiene nombre, tipo
 * (extra/condimento), precio y baja lógica. Su stock por sucursal se opera
 * desde /api/stock/insumos, no desde acá.
 *
 * La lectura es pública (sólo activos); el SUPERADMINISTRADOR puede pedir
 * `activo` para ver también los dados de baja.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

const BASE = '/insumos';

const envolver = (resultado) => ({
  success: resultado.success,
  data: resultado.data,
  error: resultado.error,
});

/**
 * Lista insumos del backend.
 * @param {{tipo?: 'extra'|'condimento', activo?: boolean, q?: string}} [filtros]
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerInsumos = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.tipo) params.append('tipo', filtros.tipo);
  if (filtros.activo !== undefined) params.append('activo', filtros.activo);
  if (filtros.q) params.append('q', filtros.q);
  const query = params.toString();
  return envolver(await apiGet(`${BASE}${query ? `?${query}` : ''}`));
};

/**
 * Obtiene un insumo por id.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerInsumoPorId = async (id) =>
  envolver(await apiGet(`${BASE}/${id}`));

/**
 * Da de alta un insumo. El backend crea sus filas de stock en 0 en las
 * sucursales activas.
 * @param {{nombre: string, tipo: 'extra'|'condimento', precio?: number, activo?: boolean}} datos
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const crearInsumo = async (datos) =>
  envolver(await apiPost(BASE, datos));

/**
 * Actualiza un insumo. No permite cambiar el tipo si ya está vinculado a
 * elementos o plantillas de personalización.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const actualizarInsumo = async (id, datos) =>
  envolver(await apiPut(`${BASE}/${id}`, datos));

/**
 * Baja lógica: el insumo deja de ofrecerse y conserva el histórico.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const eliminarInsumo = async (id) =>
  envolver(await apiDelete(`${BASE}/${id}`));
