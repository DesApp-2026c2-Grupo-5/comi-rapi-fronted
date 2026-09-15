/**
 * Propósito: Servicio de autenticación contra el backend real.
 * Contenido: loginCliente, loginAdmin, registroCliente, registroAdmin, logout, getCurrentUser.
 * Dependencias: client.js (request).
 * Uso: import { loginCliente, getCurrentUser } from '../api/auth';
 *
 * La sesión vive en el servidor (cookie HttpOnly). El frontend solo recibe datos
 * públicos (sin password) en cada respuesta.
 */

import { request } from './client';
import { ROLES } from '../utils/constants';

const ROL_BACKEND_ADMIN = 'ADMINISTRADOR';

/**
 * Traduce el rol del backend ('ADMINISTRADOR') al convenio del frontend ('ADMIN').
 * @param {object} usuario - Datos públicos devueltos por la API.
 * @returns {object} Usuario normalizado.
 */
const normalizarRol = (usuario) => {
  if (usuario && usuario.rol === ROL_BACKEND_ADMIN) {
    return { ...usuario, rol: ROLES.ADMIN };
  }
  return usuario;
};

/**
 * Inicia sesión con credenciales y exige el rol indicado.
 * @param {string} email
 * @param {string} password
 * @param {string} rolEsperado - ROLES.CLIENTE o ROLES.ADMIN.
 * @returns {Promise<object>} { success, user?, error? }.
 */
const loginConRol = async (email, password, rolEsperado) => {
  const result = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (!result.success) {
    return result;
  }
  const user = normalizarRol(result.data);
  if (user.rol !== rolEsperado) {
    return { success: false, error: 'No autorizado para este acceso.' };
  }
  return { success: true, user };
};

/**
 * Registra un usuario y lo deja autenticado.
 * @param {object} datos - { nombre, apellido, email, telefono, fechaNacimiento?, password, rol? }.
 * @returns {Promise<object>} { success, user?, error? }.
 */
const registroConRol = async (datos, rol) => {
  const result = await request('/auth/registro', {
    method: 'POST',
    body: {
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email,
      telefono: datos.telefono,
      fechaNacimiento: datos.fechaNacimiento,
      password: datos.password,
      rol: rol === ROLES.ADMIN ? ROL_BACKEND_ADMIN : ROLES.CLIENTE,
    },
  });
  if (!result.success) {
    return result;
  }
  return { success: true, user: normalizarRol(result.data) };
};

/**
 * Simula login de cliente.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Datos del usuario o error.
 */
export const loginCliente = async (email, password) =>
  loginConRol(email, password, ROLES.CLIENTE);

/**
 * Simula login de administrador.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Datos del usuario o error.
 */
export const loginAdmin = async (email, password) =>
  loginConRol(email, password, ROLES.ADMIN);

/**
 * Registra un nuevo cliente.
 * @param {object} datos - { nombre, apellido, email, telefono, fechaNacimiento?, password }.
 * @returns {Promise<object>} Datos del usuario registrado.
 */
export const registroCliente = async (datos) =>
  registroConRol(datos, ROLES.CLIENTE);

/**
 * Registra un nuevo administrador.
 * @param {object} datos - { nombre, apellido, email, telefono, fechaNacimiento?, password }.
 * @returns {Promise<object>} Datos del usuario registrado.
 */
export const registroAdmin = async (datos) => registroConRol(datos, ROLES.ADMIN);

/**
 * Cierra la sesión en el servidor.
 * @returns {Promise<object>} Resultado de la operación.
 */
export const logout = async () => request('/auth/logout', { method: 'POST' });

/**
 * Recupera los datos del usuario autenticado (hidratación al cargar la app).
 * @returns {Promise<object|null>} Usuario autenticado o null.
 */
export const getCurrentUser = async () => {
  const result = await request('/auth/me');
  if (!result.success) {
    return null;
  }
  return normalizarRol(result.data);
};