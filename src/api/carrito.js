/**
 * Propósito: Servicio mock para operaciones del carrito de compras.
 * Contenido: agregarAlCarrito, obtenerCarrito, vaciarCarrito.
 * Dependencias: Ninguna.
 * Uso: import { agregarAlCarrito, vaciarCarrito } from '../api/carrito';
 */

import { delay } from '../utils/helpers';

/**
 * Simula agregar un producto al carrito.
 * @param {object} producto - Producto a agregar { id, nombre, precio }.
 * @param {number} cantidad - Cantidad a agregar.
 * @returns {Promise<object>} Confirmación.
 */
export const agregarAlCarrito = async (producto, cantidad = 1) => {
  await delay(200);
  return {
    success: true,
    data: {
      producto,
      cantidad,
      subtotal: producto.precio * cantidad,
    },
  };
};

/**
 * Simula obtener el carrito actual.
 * @returns {Promise<object>} Datos del carrito.
 */
export const obtenerCarrito = async () => {
  await delay(200);
  return { success: true, data: { items: [], total: 0 } };
};

/**
 * Simula vaciar el carrito.
 * @returns {Promise<object>} Confirmación.
 */
export const vaciarCarrito = async () => {
  await delay(200);
  return { success: true, message: 'Carrito vaciado' };
};
