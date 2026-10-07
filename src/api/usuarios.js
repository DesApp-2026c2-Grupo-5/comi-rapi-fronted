/**
 * Propósito: Servicio de usuarios (listado de clientes del administrador y
 *            gestión de administradores del superadministrador).
 * Contenido: obtenerClientes, obtenerClientePorId, obtenerAdministradores,
 *            crearUsuarioPanel, actualizarUsuarioPanel.
 * Dependencias: client.js (apiGet, apiPost, apiPut).
 * Uso: import { obtenerClientes, crearUsuarioPanel } from '../api/usuarios';
 */

import { apiGet, apiPost, apiPut } from './client';

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

/**
 * Obtiene los usuarios administrativos (rol ADMINISTRADOR y SUPERADMINISTRADOR),
 * con búsqueda opcional por nombre, apellido o email (la filtra el backend).
 * Es para el panel del SUPERADMINISTRADOR (el admin nunca ve a otros
 * administradores).
 * @param {object} [opciones]
 * @param {string} [opciones.buscar=''] Texto a buscar.
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerAdministradores = async (opciones = {}) => {
  const { buscar = '' } = opciones;
  const armar = (rolFiltro) => {
    const params = new URLSearchParams({ rol: rolFiltro });
    if (buscar.trim()) params.set('buscar', buscar.trim());
    return `/usuarios?${params.toString()}`;
  };
  const [admins, supers] = await Promise.all([
    apiGet(armar('ADMINISTRADOR')),
    apiGet(armar('SUPERADMINISTRADOR')),
  ]);
  const fallidos = [admins, supers].filter((r) => !r.success);
  if (fallidos.length > 0) {
    return { success: false, error: fallidos[0].error };
  }
  const data = [...admins.data, ...supers.data].sort((a, b) => a.id - b.id);
  return { success: true, data };
};

/**
 * Crea un usuario (CLIENTE, ADMINISTRADOR o SUPERADMINISTRADOR) desde el panel
 * del superadmin.
 * @param {object} datos - { nombre, apellido?, email, password, rol,
 *   sucursalId? (obligatorio si es ADMINISTRADOR), telefono?, activo? }.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const crearUsuarioPanel = async (datos) => {
  const result = await apiPost('/usuarios', datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Actualiza los datos gestionables de un usuario (nombre, email, rol, sucursal,
 * activo…). La contraseña no se edita acá: no la acepta el backend.
 * @param {number|string} id - Id del usuario.
 * @param {object} datos - Campos a actualizar.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const actualizarUsuarioPanel = async (id, datos) => {
  const result = await apiPut(`/usuarios/${id}`, datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};
