/**
 * Propósito: Funciones de formateo de precios, fechas y otros datos para presentación.
 * Contenido: formatPrice (formatea a moneda local), formatDate (formatea fechas).
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
