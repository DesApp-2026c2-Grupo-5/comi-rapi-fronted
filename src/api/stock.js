/**
 * Propósito: Servicio de stock por sucursal para el administrador.
 * Contenido: obtenerStock, obtenerStockDeProducto, crearStock, actualizarStock,
 *            eliminarStock, obtenerDisponibilidad, obtenerMaximosDeCombos.
 * Dependencias: client.js (apiGet/apiPost/apiPut/apiDelete).
 * Uso: import { obtenerStock, actualizarStock } from '../api/stock';
 *
 * El stock es a nivel producto terminado por sucursal (DER §2.10): una fila es
 * el par (sucursalId, productoId). En un combo la cantidad NO se edita: sale del
 * stock de sus componentes, y el backend la devuelve ya calculada. Por eso
 * `actualizarStock` sólo cambia `disponible` en un combo, y `obtenerMaximosDeCombos`
 * existe para mostrárselo al admin mientras arma la receta.
 *
 * Todo esto es del admin: el cliente nunca escribe stock.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

const envolver = (resultado) => ({
  success: resultado.success,
  data: resultado.data,
  error: resultado.error,
});

/**
 * Lista el stock. Sin filtros devuelve la matriz completa.
 * @param {{sucursalId?: number|string, productoId?: number|string}} [filtros]
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerStock = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.sucursalId) params.append('sucursalId', filtros.sucursalId);
  if (filtros.productoId) params.append('productoId', filtros.productoId);
  const query = params.toString();
  return envolver(await apiGet(`/stock${query ? `?${query}` : ''}`));
};

/**
 * Stock de un producto en una sucursal.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerStockDeProducto = async (sucursalId, productoId) =>
  envolver(await apiGet(`/stock/${sucursalId}/${productoId}`));

/**
 * Da de alta el producto en el catálogo de la sucursal (fila en 0 y disponible).
 * Si la fila ya existe no la pisa.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const crearStock = async (sucursalId, productoId) =>
  envolver(await apiPost(`/stock/${sucursalId}/${productoId}`));

/**
 * Ajusta la cantidad y/o la disponibilidad.
 * En un combo la `cantidad` se ignora: sale del stock de sus componentes. Ahí lo
 * único que se cambia es `disponible`.
 * @param {{cantidad?: number, disponible?: boolean}} cambios
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const actualizarStock = async (sucursalId, productoId, cambios) =>
  envolver(await apiPut(`/stock/${sucursalId}/${productoId}`, cambios));

/**
 * Saca el producto del catálogo de la sucursal.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const eliminarStock = async (sucursalId, productoId) => {
  const resultado = await apiDelete(`/stock/${sucursalId}/${productoId}`);
  return envolver(resultado);
};

/**
 * Cuántas unidades se pueden vender de verdad. Para un combo devuelve el máximo
 * derivado de los componentes, que es su `cantidad`.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerDisponibilidad = async (sucursalId, productoId) =>
  envolver(await apiGet(`/stock/${sucursalId}/${productoId}/disponibilidad`));

/**
 * Máximo de combos que se pueden armar en cada sucursal activa, con el detalle de
 * qué producto frena a cada una. Es el helper del formulario de combo: mientras
 * el admin carga la receta, muestra cuántos combos salen de cada sucursal.
 * @param {Array<{productoId: number, cantidad: number}>} componentes
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerMaximosDeCombos = async (componentes) =>
  envolver(
    await apiPost('/stock/maximos-de-combos', {
      componentes: (componentes || [])
        .map((c) => ({
          productoId: Number(c.productoId),
          cantidad: Number(c.cantidad),
        }))
        .filter((c) => Number.isInteger(c.productoId) && c.productoId > 0 && c.cantidad > 0),
    })
  );
