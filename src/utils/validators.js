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

export const validatePersonalizacionElemento = ({ productoId, tipo, nombre, precio, productoReferenciaId, productos }) => {
  const errores = {};
  if (!productoId) errores.productoId = 'El producto es obligatorio';
  else if (productos && !productos.find((p) => String(p.id) === String(productoId))) errores.productoId = 'Producto no encontrado';
  const tiposValidos = ['extra', 'personalizar', 'acompanar', 'condimento'];
  if (!tipo || !tiposValidos.includes(tipo)) errores.tipo = 'Tipo inválido';
  if (tipo === 'acompanar') {
    if (!productoReferenciaId) errores.productoReferenciaId = 'El producto a ofrecer es obligatorio';
    else if (String(productoReferenciaId) === String(productoId)) errores.productoReferenciaId = 'No podés ofrecer el mismo producto';
    else if (productos && !productos.find((p) => String(p.id) === String(productoReferenciaId))) errores.productoReferenciaId = 'Producto referenciado no encontrado';
    if (precio == null || precio === '' || Number(precio) < 0) errores.precio = 'El precio debe ser >= 0';
  } else if (tipo === 'extra') {
    if (!nombre || nombre.trim().length < 2) errores.nombre = 'Nombre requerido (2+ caracteres)';
    if (precio == null || precio === '' || Number(precio) <= 0) errores.precio = 'Precio requerido > 0 para Extra';
  } else if (tipo === 'personalizar' || tipo === 'condimento') {
    if (!nombre || nombre.trim().length < 2) errores.nombre = 'Nombre requerido (2+ caracteres)';
  }
  return errores;
};
