/**
 * Propósito: Servicio mock para crear y consultar pedidos.
 * Contenido: crearPedido, obtenerPedidos, obtenerPedidoPorId, confirmarPedido.
 * Dependencias: seedData.js (pedidosMock).
 * Uso: import { crearPedido, obtenerPedidos } from '../api/pedidos';
 */

import { pedidosMock } from '../services/seedData';
import { delay } from '../utils/helpers';

// Copia mutable de pedidos mock
let pedidos = [...pedidosMock];

/**
 * Crea un nuevo pedido.
 * @param {object} datosPedido - Datos del pedido { productos, total, sucursal }.
 * @returns {Promise<object>} Pedido creado con ID y estado.
 */
export const crearPedido = async (datosPedido) => {
  await delay(400);
  const nuevoPedido = {
    id: Date.now(),
    cliente: datosPedido.cliente || { nombre: 'Cliente', email: 'test@test.com' },
    productos: datosPedido.productos,
    total: datosPedido.total,
    estado: 'Confirmado',
    sucursal: datosPedido.sucursal || 'Sucursal Centro',
  };
  pedidos.push(nuevoPedido);
  return { success: true, data: { ...nuevoPedido } };
};

/**
 * Obtiene todos los pedidos.
 * @returns {Promise<Array>} Lista de pedidos.
 */
export const obtenerPedidos = async () => {
  await delay(300);
  return { success: true, data: [...pedidos] };
};

/**
 * Obtiene un pedido por su ID.
 * @param {number} id - ID del pedido.
 * @returns {Promise<object>} Pedido encontrado.
 */
export const obtenerPedidoPorId = async (id) => {
  await delay(200);
  const pedido = pedidos.find((p) => p.id === Number(id));
  if (pedido) {
    return { success: true, data: { ...pedido } };
  }
  return { success: false, error: 'Pedido no encontrado' };
};

/**
 * Confirma un pedido (cambia estado a "Confirmado").
 * @param {number} id - ID del pedido.
 * @returns {Promise<object>} Pedido actualizado.
 */
export const confirmarPedido = async (id) => {
  await delay(300);
  const index = pedidos.findIndex((p) => p.id === Number(id));
  if (index !== -1) {
    pedidos[index] = { ...pedidos[index], estado: 'Confirmado' };
    return { success: true, data: { ...pedidos[index] } };
  }
  return { success: false, error: 'Pedido no encontrado' };
};
