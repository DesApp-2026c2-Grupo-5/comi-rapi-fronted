/**
 * Propósito: Servicio del catálogo de ingredientes (materias primas).
 * Contenido: obtenerIngredientes, obtenerIngredientePorId, crearIngrediente,
 *            actualizarIngrediente, eliminarIngrediente.
 * Dependencias: client.js (apiGet/apiPost/apiPut/apiDelete).
 * Uso: import { obtenerIngredientes, crearIngrediente } from '../api/ingredientes';
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

const BASE = '/ingredientes';

const envolver = (resultado) => ({
  success: resultado.success,
  data: resultado.data,
  error: resultado.error,
});

export const obtenerIngredientes = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.activo !== undefined) params.append('activo', filtros.activo);
  if (filtros.q) params.append('q', filtros.q);
  const query = params.toString();
  return envolver(await apiGet(`${BASE}${query ? `?${query}` : ''}`));
};

export const obtenerIngredientePorId = async (id) =>
  envolver(await apiGet(`${BASE}/${id}`));

export const crearIngrediente = async (datos) =>
  envolver(await apiPost(BASE, datos));

export const actualizarIngrediente = async (id, datos) =>
  envolver(await apiPut(`${BASE}/${id}`, datos));

export const eliminarIngrediente = async (id) =>
  envolver(await apiDelete(`${BASE}/${id}`));
