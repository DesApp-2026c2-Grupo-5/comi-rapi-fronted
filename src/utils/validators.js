/**
 * Propósito: Funciones de validación para formularios (login, registro, producto, etc.).
 * Contenido: validateEmail, validatePassword, validateProducto.
 * Dependencias: Ninguna.
 * Uso: import { validateEmail, validatePassword } from '../utils/validators';
 */

/**
 * Valida que un email tenga un formato correcto.
 * @param {string} email - Email a validar.
 * @returns {boolean} true si es válido, false si no.
 */
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida que una contraseña tenga al menos 6 caracteres.
 * @param {string} password - Contraseña a validar.
 * @returns {boolean} true si es válida, false si no.
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Valida los campos de un formulario de producto.
 * @param {object} producto - Objeto con nombre, precio, categoria.
 * @returns {object} Objeto con errores (vacío si no hay errores).
 */
export const validateProducto = (producto) => {
  const errores = {};
  if (!producto.nombre || producto.nombre.trim() === '') {
    errores.nombre = 'El nombre es obligatorio';
  }
  if (!producto.precio || producto.precio <= 0) {
    errores.precio = 'El precio debe ser mayor a 0';
  }
  if (!producto.categoria || producto.categoria.trim() === '') {
    errores.categoria = 'La categoría es obligatoria';
  }
  return errores;
};
