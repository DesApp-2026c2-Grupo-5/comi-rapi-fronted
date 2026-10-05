/**
 * Propósito: Servicio de usuarios para la lista de clientes del administrador.
 * Contenido: obtenerClientes, obtenerClientePorId (solo lectura; no hay
 *            alta/baja de usuarios en el backend).
 * Dependencias: client.js (apiGet).
 * Uso: import { obtenerClientes, obtenerClientePorId } from '../api/usuarios';
 */

import { apiGet } from './client';

/**
 * Obtiene los clientes (rol CLIENTE), con búsqueda opcional por
 * nombre, apellido o email (la filtra el backend).
 * @param {object} [opciones]
 * @param {string} [opciones.buscar=''] Texto a buscar.
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerClientes = async (opciones = {}) => {
  const { buscar = '' } = opciones;
  const params = new URLSearchParams({ rol: 'CLIENTE' });
  if (buscar.trim()) params.set('buscar', buscar.trim());
  const result = await apiGet(`/usuarios?${params.toString()}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Obtiene un cliente por su ID (formato administración: sin sensibles,
 * con cantidadPedidos).
 * @param {number|string} id - ID del usuario.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerClientePorId = async (id) => {
  const result = await apiGet(`/usuarios/${id}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};
