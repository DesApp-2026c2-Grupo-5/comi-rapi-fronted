/**
 * Propósito: Servicio de autenticación (mock) para login y registro de clientes y admins.
 * Contenido: loginCliente, loginAdmin, registroCliente, registroAdmin.
 * Dependencias: seedData.js (usuariosMock), constants.js (ROLES).
 * Uso: import { loginCliente, registroCliente } from '../api/auth';
 * Nota: Estas funciones simulan llamadas a la API. En producción, reemplazar con fetch/axios.
 */

import { usuariosMock } from '../services/seedData';
import { ROLES } from '../utils/constants';
import { delay } from '../utils/helpers';

/**
 * Simula login de cliente.
 * @param {string} email - Email del cliente.
 * @param {string} password - Contraseña del cliente.
 * @returns {Promise<object>} Datos del usuario o error.
 */
export const loginCliente = async (email, password) => {
  await delay(500);
  const usuario = usuariosMock.find(
    (u) => u.email === email && u.password === password && u.rol === ROLES.CLIENTE
  );
  if (usuario) {
    return { success: true, user: { ...usuario, password: undefined } };
  }
  return { success: false, error: 'Credenciales incorrectas' };
};

/**
 * Simula login de administrador.
 * @param {string} email - Email del admin.
 * @param {string} password - Contraseña del admin.
 * @returns {Promise<object>} Datos del usuario o error.
 */
export const loginAdmin = async (email, password) => {
  await delay(500);
  const usuario = usuariosMock.find(
    (u) => u.email === email && u.password === password && u.rol === ROLES.ADMIN
  );
  if (usuario) {
    return { success: true, user: { ...usuario, password: undefined } };
  }
  return { success: false, error: 'Credenciales incorrectas' };
};

/**
 * Simula registro de cliente.
 * @param {object} datos - { nombre, email, password }.
 * @returns {Promise<object>} Datos del usuario registrado.
 */
export const registroCliente = async (datos) => {
  await delay(500);
  const nuevoUsuario = {
    id: Date.now(),
    nombre: datos.nombre,
    email: datos.email,
    rol: ROLES.CLIENTE,
  };
  return { success: true, user: nuevoUsuario };
};

/**
 * Simula registro de administrador.
 * @param {object} datos - { nombre, email, password }.
 * @returns {Promise<object>} Datos del usuario registrado.
 */
export const registroAdmin = async (datos) => {
  await delay(500);
  const nuevoUsuario = {
    id: Date.now(),
    nombre: datos.nombre,
    email: datos.email,
    rol: ROLES.ADMIN,
  };
  return { success: true, user: nuevoUsuario };
};
