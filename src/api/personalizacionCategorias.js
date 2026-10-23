/**
 * Propósito: Servicio de plantillas de personalización por categoría.
 * Contenido: obtenerPlantillas, obtenerPlantillaPorId, crearPlantilla,
 *            actualizarPlantilla y eliminarPlantilla.
 * Dependencias: client.js (apiGet/apiPost/apiPut/apiDelete).
 * Uso: import { obtenerPlantillas } from '../api/personalizacionCategorias';
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

const BASE = '/personalizacion/categorias';

// `activa=false` es sólo una señal para que el backend incluya las inactivas
// cuando la sesión es de gestión; para clientes sigue devolviendo sólo activas.
export const obtenerPlantillas = async () => apiGet(`${BASE}?activa=false`);

export const obtenerPlantillaPorId = async (id) =>
  apiGet(`${BASE}/${id}`);

export const crearPlantilla = async (datos) => apiPost(BASE, datos);

export const actualizarPlantilla = async (id, datos) =>
  apiPut(`${BASE}/${id}`, datos);

export const eliminarPlantilla = async (id) => apiDelete(`${BASE}/${id}`);
