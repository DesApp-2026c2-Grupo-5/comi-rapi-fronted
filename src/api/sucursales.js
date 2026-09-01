/**
 * Propósito: Servicio mock para obtener y operar sucursales (CRUD simulado).
 * Contenido: obtenerSucursales, crearSucursal, actualizarSucursal, eliminarSucursal.
 * Dependencias: seedData.js (sucursalesMock), utils/helpers.js (delay, generateId).
 * Uso: import { obtenerSucursales, crearSucursal } from '../api/sucursales';
 *
 * NOTA MOCK: Las operaciones modifican una copia local en memoria. En producción
 * estas funciones deberían llamar a endpoints HTTP reales (GET/POST/PUT/DELETE).
 */

import { sucursalesMock } from '../services/seedData';
import { delay } from '../utils/helpers';

// Copia mutable de las sucursales mock (MOCK - reemplazar por API real)
let sucursales = [...sucursalesMock];

/**
 * Obtiene todas las sucursales disponibles.
 * @returns {Promise<{success: boolean, data: Array}>} Resultado de la operación.
 */
export const obtenerSucursales = async () => {
  await delay(200);
  return { success: true, data: [...sucursales] };
};

/**
 * Obtiene una sucursal por su ID.
 * @param {number} id - ID de la sucursal.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>} Resultado de la operación.
 */
export const obtenerSucursalPorId = async (id) => {
  await delay(200);
  const sucursal = sucursales.find((s) => s.id === Number(id));
  if (sucursal) {
    return { success: true, data: { ...sucursal } };
  }
  return { success: false, error: 'Sucursal no encontrada' };
};

/**
 * Crea una nueva sucursal.
 * @param {object} nuevaSucursal - Datos de la sucursal a crear.
 * @returns {Promise<{success: boolean, data: object}>} Resultado de la operación.
 */
export const crearSucursal = async (nuevaSucursal) => {
  await delay(400);
  const sucursalCreada = {
    id: Date.now(),
    ...nuevaSucursal,
  };
  sucursales.push(sucursalCreada);
  return { success: true, data: { ...sucursalCreada } };
};

/**
 * Actualiza una sucursal existente.
 * @param {number} id - ID de la sucursal a actualizar.
 * @param {object} datosActualizados - Nuevos datos de la sucursal.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>} Resultado de la operación.
 */
export const actualizarSucursal = async (id, datosActualizados) => {
  await delay(400);
  const index = sucursales.findIndex((s) => s.id === Number(id));
  if (index !== -1) {
    sucursales[index] = { ...sucursales[index], ...datosActualizados };
    return { success: true, data: { ...sucursales[index] } };
  }
  return { success: false, error: 'Sucursal no encontrada' };
};

/**
 * Elimina una sucursal por su ID.
 * @param {number} id - ID de la sucursal a eliminar.
 * @returns {Promise<{success: boolean, error?: string}>} Resultado de la operación.
 */
export const eliminarSucursal = async (id) => {
  await delay(400);
  const index = sucursales.findIndex((s) => s.id === Number(id));
  if (index !== -1) {
    sucursales.splice(index, 1);
    return { success: true };
  }
  return { success: false, error: 'Sucursal no encontrada' };
};