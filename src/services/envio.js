/**
 * Propósito: Reglas de cálculo del costo de envío de un pedido.
 * Contenido: calcularCostoEnvio (gratis desde un monto mínimo) y calcularTotalConEnvio.
 * Dependencias: Ninguna.
 * Uso: import { calcularCostoEnvio, calcularTotalConEnvio } from '../services/envio';
 */

// MOCK - reemplazar por reglas del backend cuando exista (monto mínimo para envío gratis).
export const ENVIO_GRATIS_DESDE = 10000;
export const COSTO_ENVIO_FIJO = 350;

/**
 * Calcula el costo de envío según el subtotal del pedido.
 * @param {number} subtotal - Subtotal de productos (sin envío).
 * @returns {number} Costo de envío (0 si es gratis).
 */
export const calcularCostoEnvio = (subtotal = 0) => {
  return subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO_FIJO;
};

/**
 * Calcula el total del pedido incluyendo el costo de envío.
 * @param {number} subtotal - Subtotal de productos (sin envío).
 * @returns {number} Total con envío.
 */
export const calcularTotalConEnvio = (subtotal = 0) => {
  return subtotal + calcularCostoEnvio(subtotal);
};