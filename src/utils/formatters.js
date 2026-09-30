/**
 * Propósito: Funciones de formateo de precios, fechas y otros datos para presentación.
 * Contenido: formatPrice, formatDate, formatDateOnly, calcularEdad, obtenerIniciales,
 *            nombreCompleto.
 * Dependencias: Ninguna.
 * Uso: import { formatPrice, formatDate } from '../utils/formatters';
 */

/**
 * Formatea un precio numérico a formato de moneda argentina.
 * @param {number} precio - Precio a formatear.
 * @returns {string} Precio formateado (ej: "$1.500,00").
 */
export const formatPrice = (precio) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(precio);
};

/**
 * Formatea una fecha a formato legible en español.
 * @param {string|Date} fecha - Fecha a formatear.
 * @returns {string} Fecha formateada (ej: "25 de agosto de 2026").
 */
export const formatDate = (fecha) => {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(fecha));
};

/**
 * Formatea una fecha que viene como texto YYYY-MM-DD (columna DATEONLY).
 *
 * No usa `new Date(fecha)` a propósito: el motor la interpreta como UTC y en
 * Argentina (UTC-3) una fecha de medianoche se mostraría del día anterior. Se
 * descompone y se arma en hora local, que es lo que la persona ve en su perfil.
 *
 * @param {string} fecha - Fecha en formato "YYYY-MM-DD".
 * @returns {string} Fecha formateada, o cadena vacía si no hay fecha.
 */
export const formatDateOnly = (fecha) => {
  if (!fecha) return '';
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return '';
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(anio, mes - 1, dia));
};

/**
 * Calcula la edad en años a partir de una fecha de nacimiento.
 * @param {string} fecha - Fecha en formato "YYYY-MM-DD".
 * @returns {number|null} Edad entera, o null si no hay fecha o es inconsistente.
 */
export const calcularEdad = (fecha) => {
  if (!fecha) return null;
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
  if (!anio) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - anio;
  const mesActual = hoy.getMonth() + 1;
  // Todavía no cumplió: falta el mes, o el día dentro del mismo mes.
  if (mesActual < mes || (mesActual === mes && hoy.getDate() < dia)) {
    edad -= 1;
  }
  return edad >= 0 ? edad : null;
};

/**
 * Devuelve las iniciales de una persona para usar como avatar de respaldo.
 * @param {string} nombre - Nombre.
 * @param {string} [apellido] - Apellido (opcional).
 * @returns {string} Iniciales en mayúsculas (ej: "AG"), o cadena vacía.
 */
export const obtenerIniciales = (nombre, apellido) => {
  const inicial = (texto) => String(texto || '').trim().charAt(0).toUpperCase();
  return `${inicial(nombre)}${inicial(apellido)}`;
};

/**
 * Junta nombre y apellido omitiendo las partes vacías.
 * @param {string} nombre - Nombre.
 * @param {string} [apellido] - Apellido.
 * @returns {string} Nombre completo (ej: "Ana Gómez"), o cadena vacía.
 */
export const nombreCompleto = (nombre, apellido) =>
  [nombre, apellido]
    .map((parte) => String(parte || '').trim())
    .filter(Boolean)
    .join(' ');
