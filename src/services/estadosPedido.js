/**
 * Propósito: Lógica de transición de estados de pedido según el flujo definido.
 * Contenido: puedeTransicionar (valida si un estado puede pasar a otro) y obtenerEstadosSiguientes.
 * Dependencias: utils/constants.js (ESTADOS_PEDIDO).
 * Uso: import { puedeTransicionar, obtenerEstadosSiguientes } from '../services/estadosPedido';
 *
 * Flujo permitido:
 *   pendiente        → confirmado | cancelado
 *   confirmado       → en_preparacion | cancelado
 *   en_preparacion   → listo_para_entregar | cancelado
 *   listo_para_entregar → en_camino | cancelado
 *   en_camino        → entregado | cancelado
 *   entregado        → (estado final, sin transiciones)
 *   cancelado        → (estado final, sin transiciones)
 */

import { ESTADOS_PEDIDO } from '../utils/constants';

// Mapa de transiciones válidas por estado actual.
const transiciones = {
  [ESTADOS_PEDIDO.PENDIENTE]: [ESTADOS_PEDIDO.CONFIRMADO, ESTADOS_PEDIDO.CANCELADO],
  [ESTADOS_PEDIDO.CONFIRMADO]: [ESTADOS_PEDIDO.EN_PREPARACION, ESTADOS_PEDIDO.CANCELADO],
  [ESTADOS_PEDIDO.EN_PREPARACION]: [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR, ESTADOS_PEDIDO.CANCELADO],
  [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR]: [ESTADOS_PEDIDO.EN_CAMINO, ESTADOS_PEDIDO.CANCELADO],
  [ESTADOS_PEDIDO.EN_CAMINO]: [ESTADOS_PEDIDO.ENTREGADO, ESTADOS_PEDIDO.CANCELADO],
  [ESTADOS_PEDIDO.ENTREGADO]: [],
  [ESTADOS_PEDIDO.CANCELADO]: [],
};

/**
 * Indica si un pedido puede pasar de un estado actual a un nuevo estado.
 * @param {string} estadoActual - Estado actual del pedido.
 * @param {string} nuevoEstado - Estado al que se quiere pasar.
 * @returns {boolean} true si la transición está permitida.
 */
export const puedeTransicionar = (estadoActual, nuevoEstado) => {
  return transiciones[estadoActual]?.includes(nuevoEstado) || false;
};

/**
 * Devuelve los estados a los que puede transicionar un estado actual.
 * @param {string} estadoActual - Estado actual del pedido.
 * @returns {Array<string>} Lista de estados siguientes permitidos.
 */
export const obtenerEstadosSiguientes = (estadoActual) => {
  return transiciones[estadoActual] || [];
};