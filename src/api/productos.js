/**
 * Propósito: Servicio de productos contra el backend REAL (API REST).
 * Contenido: obtenerProductos, obtenerProductoPorId, crearProducto, editarProducto, eliminarProducto.
 * Dependencias: client.js (request).
 * Uso: import { obtenerProductos, crearProducto } from '../api/productos';
 */

import { request } from './client';

export const obtenerProductos = async () => request('/productos');

export const obtenerProductoPorId = async (id) => request(`/productos/${id}`);

export const crearProducto = async (nuevoProducto) =>
  request('/productos', {
    method: 'POST',
    body: JSON.stringify(nuevoProducto),
  });

export const editarProducto = async (id, datosActualizados) =>
  request(`/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datosActualizados),
  });

export const eliminarProducto = async (id) =>
  request(`/productos/${id}`, { method: 'DELETE' });