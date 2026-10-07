/**
 * Propósito: Servicio de autenticación que consume el backend real (sesiones + CSRF).
 * Contenido: obtenerUsuarioActual, loginCliente, loginAdmin, registroCliente, logout.
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
 * Login común: llama al backend y valida uno (o varios) roles aceptados.
 * Si el usuario autenticado no tiene ninguno de los roles pedidos, cierra la
 * sesión y devuelve error.
 * @param {string} email
 * @param {string} password
 * @param {string|string[]} rolesAceptados - ROLES.CLIENTE, ROLES.ADMIN, ROLES.SUPERADMIN…
 */
const loginComun = async (email, password, rolesAceptados) => {
  const roles = Array.isArray(rolesAceptados) ? rolesAceptados : [rolesAceptados];
  const result = await apiPost('/auth/login', { email, password });
  if (!result.success) {
    return { success: false, error: result.error };
  }
  const usuario = result.data;
  if (!roles.includes(usuario.rol)) {
    await apiPost('/auth/logout', {});
    let error;
    if (roles.includes(ROLES.CLIENTE)) {
      error = 'Las credenciales no corresponden a un cliente';
    } else if (
      roles.includes(ROLES.ADMIN) ||
      roles.includes(ROLES.SUPERADMIN)
    ) {
      error = 'Las credenciales no corresponden a un administrador';
    } else {
      error = 'Este rol no puede iniciar sesión acá';
    }
    return { success: false, error };
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
 * Inicia sesión en el panel de administración (ADMINISTRADOR o
 * SUPERADMINISTRADOR): el mismo login sirve para los dos roles y la redirección
 * al panel correspondiente la decide cada página con `destinoPorRol`.
 */
export const loginPanel = (email, password) =>
  loginComun(email, password, [ROLES.ADMIN, ROLES.SUPERADMIN]);

/**
 * Registra un cliente. El backend fuerza el rol CLIENTE: el registro público
 * no puede crear administradores ni superadministradores.
 * @param {object} datos - { nombre, apellido?, email, password, telefono? }.
 */
export const registroCliente = async (datos) => {
  const result = await apiPost('/auth/registro', datos);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, user: result.data };
};

/**
 * Cierra la sesión en el backend.
 */
export const logout = async () => {
  const result = await apiPost('/auth/logout', {});
  return { success: result.success };
};

/**
 * Solicita un enlace de recuperación de contraseña (POST /api/auth/forgot-password).
 *
 * El backend responde SIEMPRE con el mismo mensaje, exista o no la cuenta, para
 * no permitir enumerar emails. Por eso esta función devuelve `success: true`
 * tanto si el email existe como si no: la UI no debe insinuar la diferencia.
 *
 * @param {string} email
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const solicitarRecuperacion = async (email) => {
  const result = await apiPost('/auth/forgot-password', { email });
  if (result.success) {
    return { success: true, message: result.data.message };
  }
  return { success: false, error: result.error };
};

/**
 * Establece una contraseña nueva con el token del enlace
 * (POST /api/auth/reset-password).
 *
 * El backend responde con un único mensaje para token inexistente, expirado,
 * usado o invalidado. Por eso la UI no puede (ni debe) distinguir esos casos:
 * `error` siempre significa "el enlace no sirve".
 *
 * @param {string} token - Token en texto plano tomado de la query string.
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const restablecerPassword = async (token, password, confirmPassword) => {
  const result = await apiPost('/auth/reset-password', {
    token,
    password,
    confirmPassword,
  });
  if (result.success) {
    return { success: true, message: result.data.message };
  }
  return { success: false, error: result.error };
};
