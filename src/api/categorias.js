/**
 * Propósito: Servicio de categorías contra el backend REAL (API REST).
 * Contenido: obtenerCategorias, crearCategoria, editarCategoria, eliminarCategoria.
 * Dependencias: client.js (request).
 * Uso: import { obtenerCategorias, crearCategoria } from '../api/categorias';
 */

import { request } from './client';

export const obtenerCategorias = async () => request('/categorias');

export const crearCategoria = async (datos) =>
  request('/categorias', {
    method: 'POST',
    body: JSON.stringify(datos),
  });

export const editarCategoria = async (id, datos) =>
  request(`/categorias/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });

export const eliminarCategoria = async (id) =>
  request(`/categorias/${id}`, { method: 'DELETE' });