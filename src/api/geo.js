/**
 * Propósito: Servicio del catálogo territorial (iteración 3) que consume el
 *            proxy del backend (/api/geo), único punto de contacto con
 *            Georef Argentina (cache del lado del backend).
 * Contenido: obtenerDepartamentos, obtenerLocalidades, buscarCalles,
 *            obtenerZonas y previsualizarDireccion.
 * Dependencias: client.js (apiGet/apiPost).
 * Uso: import { obtenerDepartamentos } from '../api/geo';
 *
 * Los selects en cascada del formulario usan estos endpoints; el preview
 * resuelve la ambigüedad de la dirección ANTES de guardar (el backend no
 * persiste ni valida cobertura en el preview).
 */

import { apiGet, apiPost } from './client';

function construirQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && String(valor).trim()) {
      search.set(clave, String(valor).trim());
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

/**
 * Partidos (Buenos Aires) / comunas (CABA) de una provincia.
 * @param {string} provincia - Nombre oficial de la provincia.
 * @returns {Promise<{success: boolean, data?: Array<{id, nombre}>, error?: string}>}
 */
export const obtenerDepartamentos = async (provincia) => {
  const result = await apiGet(
    `/geo/departamentos${construirQuery({ provincia })}`
  );
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
};

/**
 * Localidades (BAHRA; en CABA son los barrios) de una provincia,
 * opcionalmente filtradas por partido/comuna.
 * @param {object} datos - { provincia, departamento? }.
 * @returns {Promise<{success: boolean, data?: Array<{id, nombre}>, error?: string}>}
 */
export const obtenerLocalidades = async (datos) => {
  const result = await apiGet(`/geo/localidades${construirQuery(datos)}`);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
};

/**
 * Autocompletado de calles por nombre parcial.
 * @param {object} datos - { provincia, departamento?, localidad?, nombre }.
 * @returns {Promise<{success: boolean, data?: Array<{id, nombre, categoria}>, error?: string}>}
 */
export const buscarCalles = async (datos) => {
  const result = await apiGet(`/geo/calles${construirQuery(datos)}`);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
};

/**
 * Zonas de operación (misma configuración que usa la validación real de
 * cobertura del backend): para el aviso al seleccionar la provincia.
 * @returns {Promise<{success: boolean, data?: Array<{nombre, provincias}>, error?: string}>}
 */
export const obtenerZonas = async () => {
  const result = await apiGet('/geo/zonas');
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
};

/**
 * Preview de dirección: geocodifica sin persistir. Devuelve el estado de la
 * resolución para que el formulario confirme la dirección (y resuelva la
 * ambigüedad) ANTES de guardar.
 * Iteración 5: con `opciones.cobertura` el backend agrega al `data` el
 * resultado de la validación real de cobertura (zona + sucursal activa a
 * ≤5 km por ruta). Solo el formulario del cliente lo pide: el de
 * administrador no valida cobertura comercial.
 * @param {object} datos - { calle, altura, provincia, departamento?, localidad? }.
 * @param {object} [opciones] - { cobertura = false }.
 * @returns {Promise<{success: boolean, data?: { estado: 'unica'|'ambigua'|'no_encontrada', resultado?: object, opciones?: Array, cobertura?: object }, error?: string, status?: number}>}
 */
export const previsualizarDireccion = async (datos, { cobertura = false } = {}) => {
  const result = await apiPost('/geo/preview', { ...datos, cobertura });
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error, status: result.status };
};
