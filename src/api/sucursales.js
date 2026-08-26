/**
 * Propósito: Servicio mock para obtener sucursales y operaciones relacionadas.
 * Contenido: obtenerSucursales.
 * Dependencias: seedData.js (sucursalesMock).
 * Uso: import { obtenerSucursales } from '../api/sucursales';
 */

import { sucursalesMock } from '../services/seedData';
import { delay } from '../utils/helpers';

/**
 * Obtiene todas las sucursales disponibles.
 * @returns {Promise<Array>} Lista de sucursales.
 */
export const obtenerSucursales = async () => {
  await delay(200);
  return { success: true, data: [...sucursalesMock] };
};
