/**
 * Propósito: Servicio de direcciones del cliente que consume el backend real.
 * Contenido: obtenerDirecciones, obtenerDireccionPorId, crearDireccion,
 *            actualizarDireccion, eliminarDireccion.
 * Dependencias: client.js (apiGet/apiPost/apiPut/apiDelete).
 * Uso: import { obtenerDirecciones, crearDireccion } from '../api/direcciones';
 *
 * El backend scopea por sesión: cada cliente solo ve/gestiona sus propias
 * direcciones (Der: Usuario 1:N Direccion). Iteración 1-geo: obligatorios
 * calle, altura y provincia (partido además en Buenos Aires); localidad y
 * codigoPostal opcionales (los determina/normaliza el backend con Georef;
 * latitud/longitud nunca se ingresan manualmente).
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

/**
 * Obtiene las direcciones activas del cliente autenticado.
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerDirecciones = async () => {
  const result = await apiGet('/direcciones');
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Obtiene una dirección por su ID.
 * @param {number|string} id - ID de la dirección.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerDireccionPorId = async (id) => {
  const result = await apiGet(`/direcciones/${id}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Obtiene las direcciones activas de un cliente con su cobertura vigente
 * (sucursal asignada por cercanía). Solo administradores.
 * @param {number|string} usuarioId - ID del cliente.
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerDireccionesDeCliente = async (usuarioId) => {
  const params = new URLSearchParams({
    usuarioId: String(usuarioId),
    cobertura: 'true',
  });
  const result = await apiGet(`/direcciones?${params.toString()}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Crea una nueva dirección para el cliente autenticado.
 * Iteración 1-geo: obligatorios calle, altura y provincia; el partido
 * (`departamento`) es obligatorio para Buenos Aires; localidad y código
 * postal opcionales (el backend determina la localidad con Georef; el CP
 * no lo provee Georef). Un 409 incluye `opciones` para desambiguar.
 * @param {object} datos - { calle, altura, provincia, departamento?, localidad?, codigoPostal?, referencia?, alias? }.
 * @returns {Promise<{success: boolean, data?: object, error?: string, opciones?: Array}>}
 */
export const crearDireccion = async (datos) => {
  const result = await apiPost('/direcciones', datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Iteración 5: status (funcional vs técnico) y detalle (distancia de la
  // sucursal más cercana en los 422 de cobertura).
  return {
    success: false,
    error: result.error,
    status: result.status,
    detalle: result.detalle,
    opciones: result.opciones,
  };
};

/**
 * Actualiza una dirección existente del cliente (campos parciales).
 * Iteración 1-geo: un 409 incluye `opciones` para desambiguar.
 * @param {number|string} id - ID de la dirección.
 * @param {object} datos - Campos a actualizar.
 * @returns {Promise<{success: boolean, data?: object, error?: string, opciones?: Array}>}
 */
export const actualizarDireccion = async (id, datos) => {
  const result = await apiPut(`/direcciones/${id}`, datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Iteración 5: status (funcional vs técnico) y detalle de cobertura.
  return {
    success: false,
    error: result.error,
    status: result.status,
    detalle: result.detalle,
    opciones: result.opciones,
  };
};

/**
 * Elimina (baja lógica) una dirección: activa pasa a false.
 * @param {number|string} id - ID de la dirección.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const eliminarDireccion = async (id) => {
  const result = await apiDelete(`/direcciones/${id}`);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error };
};
