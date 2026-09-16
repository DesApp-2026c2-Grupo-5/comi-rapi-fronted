/**
 * Propósito: Servicio de autenticación que consume el backend real (sesiones + CSRF).
 * Contenido: obtenerUsuarioActual, loginCliente, loginAdmin, registroCliente, registroAdmin, logout.
 * Dependencias: client.js (apiGet/apiPost), constants.js (ROLES).
 * Uso: import { loginCliente, registroCliente } from '../api/auth';
 */

import { apiGet, apiPost } from './client';
import { ROLES } from '../utils/constants';

/**
 * Obtiene los datos públicos del usuario autenticado (GET /api/auth/me).
 * Se usa al iniciar la app para restaurar la sesión server-side.
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export const obtenerUsuarioActual = async () => {
  const result = await apiGet('/auth/me');
  if (result.success) {
    return { success: true, user: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Login común: llama al backend y valida el rol esperado.
 * Si el usuario autenticado no tiene el rol pedido, cierra la sesión y devuelve error.
 * @param {string} email
 * @param {string} password
 * @param {string} rolEsperado - ROLES.CLIENTE o ROLES.ADMIN.
 */
const loginComun = async (email, password, rolEsperado) => {
  const result = await apiPost('/auth/login', { email, password });
  if (!result.success) {
    return { success: false, error: result.error };
  }
  const usuario = result.data;
  if (usuario.rol !== rolEsperado) {
    await apiPost('/auth/logout', {});
    return {
      success: false,
      error:
        rolEsperado === ROLES.ADMIN
          ? 'Las credenciales no corresponden a un administrador'
          : 'Las credenciales no corresponden a un cliente',
    };
  }
  return { success: true, user: usuario };
};

/**
 * Inicia sesión como cliente (requiere rol CLIENTE).
 */
export const loginCliente = (email, password) =>
  loginComun(email, password, ROLES.CLIENTE);

/**
 * Inicia sesión como administrador (requiere rol ADMINISTRADOR).
 */
export const loginAdmin = (email, password) =>
  loginComun(email, password, ROLES.ADMIN);

/**
 * Registro común: crea un usuario con el rol indicado.
 * @param {object} datos - { nombre, apellido?, email, password, telefono? }.
 * @param {string} rol - ROLES.CLIENTE o ROLES.ADMIN.
 */
const registroComun = async (datos, rol) => {
  const result = await apiPost('/auth/registro', { ...datos, rol });
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, user: result.data };
};

/**
 * Registra un cliente.
 */
export const registroCliente = (datos) => registroComun(datos, ROLES.CLIENTE);

/**
 * Registra un administrador.
 */
export const registroAdmin = (datos) => registroComun(datos, ROLES.ADMIN);

/**
 * Cierra la sesión en el backend.
 */
export const logout = async () => {
  const result = await apiPost('/auth/logout', {});
  return { success: result.success };
};
