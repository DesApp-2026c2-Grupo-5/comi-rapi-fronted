/**
 * Propósito: Funciones auxiliares generales que no encajan en otras categorías específicas.
 * Contenido: generateId (genera un ID pseudo-único), delay (simula un delay de red).
 * Dependencias: Ninguna.
 * Uso: import { generateId, delay } from '../utils/helpers';
 */

/**
 * Genera un ID numérico pseudo-único basado en timestamp.
 * @returns {number} ID generado.
 */
export const generateId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

/**
 * Simula un delay de red (útil para mockeos de loading).
 * @param {number} ms - Milisegundos de espera.
 * @returns {Promise} Promise que se resuelve después del delay.
 */
export const delay = (ms = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Filtra un array por una propiedad y valor dados.
 * @param {Array} array - Array a filtrar.
 * @param {string} propiedad - Nombre de la propiedad.
 * @param {*} valor - Valor a buscar.
 * @returns {Array} Array filtrado.
 */
export const filterByProperty = (array, propiedad, valor) => {
  return array.filter((item) => item[propiedad] === valor);
};
