/**
 * Propósito: Servicio de cupones y emisiones para el SUPERADMINISTRADOR.
 * Contenido: obtenerCupones, obtenerCuponPorId, cambiarActivoCupon,
 *   obtenerCuponesCliente (para "Mis cupones" del CLIENTE),
 *   previewDestinatarios, crearEmision, cuponesEmiciones,
 *   obtenerEmisionPorId, obtenerCuponesDeEmision, reenviarEmision.
 * Dependencias: client.js (apiGet/apiPost/apiPatch).
 * Uso: import { crearEmision, obtenerCupones } from '../api/cupones';
 */

import { apiGet, apiPost, apiPatch } from './client';

const conQuery = (ruta, parametros = {}) => {
  const query = new URLSearchParams();
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null || valor === '') return;
    query.set(clave, String(valor));
  });
  const qs = query.toString();
  return qs ? `${ruta}?${qs}` : ruta;
};

/** Lista de cupones con filtros opcionales (emisionId, estado, activo, pagina, limite). */
export const obtenerCupones = async (filtros = {}) => {
  const { emisionId, estado, activo, pagina, limite } = filtros;
  const result = await apiGet(
    conQuery('/cupones', { emisionId, estado, activo, pagina, limite })
  );
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/** Detalle de un cupón por ID. */
export const obtenerCuponPorId = async (id) => {
  const result = await apiGet(`/cupones/${encodeURIComponent(id)}`);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/** Cambia el estado activo/inactivo de un cupón (baja individual). */
export const cambiarActivoCupon = async (id, activo) => {
  const result = await apiPatch(`/cupones/${encodeURIComponent(id)}/activo`, { activo });
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/** Cupones del cliente autenticado (para "Mis cupones"). */
export const obtenerCuponesCliente = async () => {
  const result = await apiGet('/cupones/mios');
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/**
 * Preview de destinatarios elegibles sin persistir nada.
 * Body: configuración de la emisión (nombre, descuento, productos, categorías,
 * período, máximo, etc.).
 */
export const previewDestinatarios = async (datos) => {
  const result = await apiPost('/cupones/preview', datos);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/** Crea una emisión y emite los cupones para los destinatarios aprobados. */
export const crearEmision = async (datos) => {
  const result = await apiPost('/cupones/emisiones', datos);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/** Listado de emisiones con filtros (estado, desde, hasta, pagina, limite). */
export const cuponesEmiciones = async (filtros = {}) => {
  const { estado, desde, hasta, pagina, limite } = filtros;
  const result = await apiGet(
    conQuery('/cupones/emisiones', { estado, desde, hasta, pagina, limite })
  );
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/** Datos propios de una emisión, sin cupones. */
export const obtenerEmisionPorId = async (id) => {
  const result = await apiGet(`/cupones/emisiones/${encodeURIComponent(id)}`);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/** Cupones de una emisión con los datos complementarios del detalle. */
export const obtenerCuponesDeEmision = async (id) => {
  const result = await apiGet(
    `/cupones/emisiones/${encodeURIComponent(id)}/cupones`
  );
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};

/** Reintenta envíos fallidos/pendientes de una emisión. */
export const reenviarEmision = async (id) => {
  const result = await apiPost(
    `/cupones/emisiones/${encodeURIComponent(id)}/reenviar`
  );
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
};
