/**
 * Propósito: Lógica de transición de estados de pedido según el flujo definido.
 * Contenido: puedeTransicionar (valida si un estado puede pasar a otro) y obtenerEstadosSiguientes.
 * Dependencias: utils/constants.js (ESTADOS_PEDIDO).
 * Uso: import { puedeTransicionar, obtenerEstadosSiguientes } from '../services/estadosPedido';
 *
 * Flujo permitido (espejo del backend lib/services/estados_pedido.js):
 *   pendiente        → confirmado (vía pago/confirmación) | cancelado
 *   confirmado       → en_preparacion | cancelado
 *   en_preparacion   → listo_para_entregar
 *   listo_para_entregar → en_camino
 *   en_camino        → entregado
 *   entregado        → (estado final, sin transiciones)
 *   cancelado        → (estado final, sin transiciones)
 *
 * Regla: un pedido solo puede cancelarse ANTES de iniciar la preparación
 * (pendiente y confirmado). Una vez que comenzó a prepararse, no se cancela.
 */

import { ESTADOS_PEDIDO } from '../utils/constants';

// Mapa de transiciones válidas por estado actual (alineado con el backend).
// Regla: solo se cancela antes de iniciar la preparación (pendiente/confirmado).
// PENDIENTE → CONFIRMADO se ejecuta vía confirmarPedido (pago), no desde el stepper admin.
const transiciones = {
  [ESTADOS_PEDIDO.PENDIENTE]: [ESTADOS_PEDIDO.CONFIRMADO, ESTADOS_PEDIDO.CANCELADO],
  [ESTADOS_PEDIDO.CONFIRMADO]: [ESTADOS_PEDIDO.EN_PREPARACION, ESTADOS_PEDIDO.CANCELADO],
  [ESTADOS_PEDIDO.EN_PREPARACION]: [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR],
  [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR]: [ESTADOS_PEDIDO.EN_CAMINO],
  [ESTADOS_PEDIDO.EN_CAMINO]: [ESTADOS_PEDIDO.ENTREGADO],
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