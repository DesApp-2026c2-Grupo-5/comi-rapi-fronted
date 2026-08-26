/**
 * Propósito: Servicio mock para obtener categorías de productos.
 * Contenido: obtenerCategorias.
 * Dependencias: seedData.js (categoriasMock).
 * Uso: import { obtenerCategorias } from '../api/categorias';
 */

import { categoriasMock } from '../services/seedData';
import { delay } from '../utils/helpers';

/**
 * Obtiene todas las categorías disponibles.
 * @returns {Promise<Array>} Lista de categorías.
 */
export const obtenerCategorias = async () => {
  await delay(200);
  return { success: true, data: [...categoriasMock] };
};
