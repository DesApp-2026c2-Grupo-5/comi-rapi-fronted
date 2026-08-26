/**
 * Propósito: Servicio mock para operaciones CRUD de productos (para administradores).
 * Contenido: obtenerProductos, obtenerProductoPorId, crearProducto, editarProducto, eliminarProducto.
 * Dependencias: seedData.js (productosMock).
 * Uso: import { obtenerProductos, editarProducto } from '../api/productos';
 */

import { productosMock } from '../services/seedData';
import { delay } from '../utils/helpers';

// Copia mutable de los productos mock
let productos = [...productosMock];

/**
 * Obtiene todos los productos.
 * @returns {Promise<Array>} Lista de productos.
 */
export const obtenerProductos = async () => {
  await delay(300);
  return { success: true, data: [...productos] };
};

/**
 * Obtiene un producto por su ID.
 * @param {number} id - ID del producto.
 * @returns {Promise<object>} Producto encontrado.
 */
export const obtenerProductoPorId = async (id) => {
  await delay(200);
  const producto = productos.find((p) => p.id === Number(id));
  if (producto) {
    return { success: true, data: { ...producto } };
  }
  return { success: false, error: 'Producto no encontrado' };
};

/**
 * Crea un nuevo producto.
 * @param {object} nuevoProducto - Datos del producto.
 * @returns {Promise<object>} Producto creado.
 */
export const crearProducto = async (nuevoProducto) => {
  await delay(400);
  const productoCreado = {
    id: Date.now(),
    ...nuevoProducto,
  };
  productos.push(productoCreado);
  return { success: true, data: { ...productoCreado } };
};

/**
 * Edita un producto existente.
 * @param {number} id - ID del producto a editar.
 * @param {object} datosActualizados - Nuevos datos.
 * @returns {Promise<object>} Producto actualizado.
 */
export const editarProducto = async (id, datosActualizados) => {
  await delay(400);
  const index = productos.findIndex((p) => p.id === Number(id));
  if (index !== -1) {
    productos[index] = { ...productos[index], ...datosActualizados };
    return { success: true, data: { ...productos[index] } };
  }
  return { success: false, error: 'Producto no encontrado' };
};

/**
 * Elimina un producto.
 * @param {number} id - ID del producto a eliminar.
 * @returns {Promise<object>} Resultado de la operación.
 */
export const eliminarProducto = async (id) => {
  await delay(400);
  const index = productos.findIndex((p) => p.id === Number(id));
  if (index !== -1) {
    productos.splice(index, 1);
    return { success: true };
  }
  return { success: false, error: 'Producto no encontrado' };
};
