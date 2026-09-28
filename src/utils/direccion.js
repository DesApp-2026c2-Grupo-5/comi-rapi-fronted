/**
 * Propósito: Utilidades para la entidad Direccion (Der: Usuario 1:N Direccion, Sucursal 1:1 Direccion).
 * Contenido: formatearDireccion.
 * Uso: import { formatearDireccion } from '../utils/direccion';
 */

/**
 * Formatea una dirección (objeto del DER) como texto legible.
 * Ej: { calle: 'Av. Principal', altura: 123, localidad: 'CABA' } → 'Av. Principal 123, CABA'.
 * Acepta strings (compatibilidad con datos mock/legacy) y objetos con direccion como string.
 * @param {object|string} [direccion] - Objeto Direccion o string.
 * @returns {string} Dirección formateada o '' si no hay datos.
 */
export const formatearDireccion = (direccion) => {
  if (!direccion) return '';
  if (typeof direccion === 'string') return direccion;
  if (typeof direccion.direccion === 'string') return direccion.direccion;
  const domicilio = [direccion.calle, direccion.altura]
    .filter(Boolean)
    .join(' ');
  const extras = [
    direccion.localidad || direccion.ciudad,
    direccion.codigoPostal,
  ].filter(Boolean);
  if (!domicilio) return extras.join(', ');
  return extras.length ? `${domicilio}, ${extras.join(', ')}` : domicilio;
};
