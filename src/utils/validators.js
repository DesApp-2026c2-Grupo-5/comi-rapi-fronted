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

const TIPOS_PERSONALIZACION = ['extra', 'personalizar', 'acompanar', 'condimento'];

// Reglas comunes al elemento de un producto y a la plantilla de una categoría.
const validarReglasElemento = ({
  tipo,
  nombre,
  precio,
  insumoId,
  productoReferenciaId,
  minimo,
  maximo,
  productos,
  productoId,
}) => {
  const errores = {};
  if (!tipo || !TIPOS_PERSONALIZACION.includes(tipo)) errores.tipo = 'Tipo inválido';

  // Rango de cantidad por elemento (mínimo 0, máximo 1 por defecto).
  const min = minimo === undefined || minimo === '' ? 0 : Number(minimo);
  const max = maximo === undefined || maximo === '' ? 1 : Number(maximo);
  if (!Number.isInteger(min) || min < 0) errores.minimo = 'El mínimo debe ser un entero mayor o igual a 0';
  else if (!Number.isInteger(max) || max < 1) errores.maximo = 'El máximo debe ser un entero mayor o igual a 1';
  else if (max < min) errores.maximo = 'El máximo no puede ser menor que el mínimo';

  if (tipo === 'acompanar') {
    if (!productoReferenciaId) errores.productoReferenciaId = 'El producto a ofrecer es obligatorio';
    else if (productoId && String(productoReferenciaId) === String(productoId)) errores.productoReferenciaId = 'No podés ofrecer el mismo producto';
    else if (productos && !productos.find((p) => String(p.id) === String(productoReferenciaId))) errores.productoReferenciaId = 'Producto referenciado no encontrado';
    if (precio == null || precio === '' || Number(precio) < 0) errores.precio = 'El precio debe ser >= 0';
  } else if (tipo === 'extra') {
    if (!insumoId) errores.insumoId = 'Elegí un insumo para el extra';
    if (!nombre || nombre.trim().length < 2) errores.nombre = 'Nombre requerido (2+ caracteres)';
    if (precio == null || precio === '' || Number(precio) <= 0) errores.precio = 'Precio requerido > 0 para Extra';
  } else if (tipo === 'personalizar' || tipo === 'condimento') {
    if (tipo === 'condimento' && !insumoId) {
      errores.insumoId = 'Elegí un insumo para el condimento';
    }
    if (!nombre || nombre.trim().length < 2) errores.nombre = 'Nombre requerido (2+ caracteres)';
  }
  return errores;
};

export const validatePersonalizacionElemento = ({ productoId, ...resto }) => {
  const errores = {};
  if (!productoId) errores.productoId = 'El producto es obligatorio';
  else if (resto.productos && !resto.productos.find((p) => String(p.id) === String(productoId))) errores.productoId = 'Producto no encontrado';
  return { ...errores, ...validarReglasElemento({ ...resto, productoId }) };
};

export const validatePlantillaCategoria = ({ categoriaId, ...resto }) => {
  const errores = {};
  if (!categoriaId) errores.categoriaId = 'La categoría es obligatoria';
  return { ...errores, ...validarReglasElemento(resto) };
};
