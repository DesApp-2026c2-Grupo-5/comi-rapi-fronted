/**
 * Propósito: Reglas de cálculo del costo de envío de un pedido.
 * Contenido: calcularCostoEnvio (gratis desde un monto mínimo) y calcularTotalConEnvio.
 * Dependencias: Ninguna.
 * Uso: import { calcularCostoEnvio, calcularTotalConEnvio } from '../services/envio';
 *
 * Los valores vigentes los expone el backend (GET /api/parametros) y viajan por
 * el ParametrosContext; estas funciones los reciben como segundo argumento para
 * no duplicar la regla. Las constantes quedan solo como respaldo (mismo valor
 * por defecto del catálogo del backend) para tests o usos sin contexto.
 */

export const ENVIO_GRATIS_DESDE = 10000;
export const COSTO_ENVIO_FIJO = 350;

/**
 * Calcula el costo de envío según el subtotal del pedido.
 * @param {number} subtotal - Subtotal de productos (sin envío).
 * @param {object} [parametros] - Valores vigentes { montoMinimoEnvioGratis, costoEnvioFijo }.
 * @returns {number} Costo de envío (0 si es gratis).
 */
export const calcularCostoEnvio = (subtotal = 0, parametros = {}) => {
  const envioGratisDesde =
    parametros.montoMinimoEnvioGratis ?? ENVIO_GRATIS_DESDE;
  const costoFijo = parametros.costoEnvioFijo ?? COSTO_ENVIO_FIJO;
  return subtotal >= envioGratisDesde ? 0 : costoFijo;
};

/**
 * Calcula el total del pedido incluyendo el costo de envío.
 * @param {number} subtotal - Subtotal de productos (sin envío).
 * @param {object} [parametros] - Valores vigentes { montoMinimoEnvioGratis, costoEnvioFijo }.
 * @returns {number} Total con envío.
 */
export const calcularTotalConEnvio = (subtotal = 0, parametros = {}) => {
  return subtotal + calcularCostoEnvio(subtotal, parametros);
};