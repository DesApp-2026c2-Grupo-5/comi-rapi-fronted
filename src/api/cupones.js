/**
 * Propósito: Servicio de cupones y emisiones para el SUPERADMINISTRADOR.
 * Contenido: obtenerCupones, obtenerCuponPorId, cambiarActivoCupon,
 *   obtenerCuponesCliente (para "Mis cupones" del CLIENTE),
 *   previewDestinatarios, crearEmision, cuponesEmiciones,
 *   obtenerEmisionPorId, obtenerCuponesDeEmision, reenviarEmision.
 * Dependencias: client.js (apiGet/apiPost/apiPatch).
 * Uso: import { crearEmision, obtenerCupones } from '../api/cupones';
 *
 * Todas las funciones aceptan `opciones.signal` para que TanStack Query pueda
 * cancelar la petición, y propagan `motivo` en los errores de negocio.
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

const fallo = (result) => ({
  success: false,
  error: result.error,
  motivo: result.motivo || null,
  status: result.status,
});

/** Lista de cupones con filtros opcionales (emisionId, estado, activo, pagina, limite). */
export const obtenerCupones = async (filtros = {}, opciones = {}) => {
  const { emisionId, estado, activo, pagina, limite } = filtros;
  const result = await apiGet(
    conQuery('/cupones', { emisionId, estado, activo, pagina, limite }),
    opciones
  );
  if (result.success) return { success: true, data: result.data };
  return fallo(result);
};

/** Detalle de un cupón por ID. */
export const obtenerCuponPorId = async (id, opciones = {}) => {
  const result = await apiGet(`/cupones/${encodeURIComponent(id)}`, opciones);
  if (result.success) return { success: true, data: result.data };
  return fallo(result);
};

/** Cambia el estado activo/inactivo de un cupón (baja individual). */
export const cambiarActivoCupon = async (id, activo, opciones = {}) => {
  const result = await apiPatch(
    `/cupones/${encodeURIComponent(id)}/activo`,
    { activo },
    opciones
  );
  if (result.success) return { success: true, data: result.data };
  return fallo(result);
};

/** Cupones del cliente autenticado (para "Mis cupones"). */
export const obtenerCuponesCliente = async (opciones = {}) => {
  const result = await apiGet('/cupones/mios', opciones);
  if (result.success) return { success: true, data: result.data };
  return fallo(result);
};

/**
 * Preview de destinatarios elegibles sin persistir nada.
 * Body: configuración de la emisión (nombre, descuento, productos, categorías,
 * período, máximo, etc.).
 */
export const previewDestinatarios = async (datos, opciones = {}) => {
  const result = await apiPost('/cupones/preview', datos, opciones);
  if (result.success) return { success: true, data: result.data };
  return fallo(result);
};

/** Crea una emisión y emite los cupones para los destinatarios aprobados. */
export const crearEmision = async (datos, opciones = {}) => {
  const result = await apiPost('/cupones/emisiones', datos, opciones);
  if (result.success) return { success: true, data: result.data };
  return fallo(result);
};

/** Listado de emisiones con filtros (estado, desde, hasta, pagina, limite). */
export const cuponesEmiciones = async (filtros = {}, opciones = {}) => {
  const { estado, desde, hasta, pagina, limite } = filtros;
  const result = await apiGet(
    conQuery('/cupones/emisiones', { estado, desde, hasta, pagina, limite }),
    opciones
  );
  if (result.success) return { success: true, data: result.data };
  return fallo(result);
};

/** Datos propios de una emisión, sin cupones. */
export const obtenerEmisionPorId = async (id, opciones = {}) => {
  const result = await apiGet(
    `/cupones/emisiones/${encodeURIComponent(id)}`,
    opciones
  );
  if (result.success) return { success: true, data: result.data };
  return fallo(result);
};

/** Cupones de una emisión con los datos complementarios del detalle. */
export const obtenerCuponesDeEmision = async (id, opciones = {}) => {
  const result = await apiGet(
    `/cupones/emisiones/${encodeURIComponent(id)}/cupones`,
    opciones
  );
  if (result.success) return { success: true, data: result.data };
  return fallo(result);
};

/** Reintenta envíos fallidos/pendientes de una emisión. */
export const reenviarEmision = async (id, opciones = {}) => {
  const result = await apiPost(
    `/cupones/emisiones/${encodeURIComponent(id)}/reenviar`,
    undefined,
    opciones
  );
  if (result.success) return { success: true, data: result.data };
  return fallo(result);
};
