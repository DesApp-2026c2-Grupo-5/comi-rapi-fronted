/**
 * Propósito: Simular asignación automática de sucursal al cliente según menor carga de pedidos pendientes.
 *            Se ejecuta SOLO al confirmar el carrito (sin intervención del cliente).
 * Contenido: Función asignarSucursalOptima que recibe sucursales y pedidos pendientes,
 *            y devuelve la sucursal con menos pedidos pendientes.
 * Dependencias: Ninguna.
 * Uso: import { asignarSucursalOptima } from '../services/asignacionSucursal';
 *
 * Ejemplo:
 *   const optima = asignarSucursalOptima(sucursalesActivas, pedidosPendientes);
 */

/**
 * Asigna la sucursal con menos pedidos pendientes al cliente.
 * En caso de empate, devuelve la primera de la lista (ordenada por ID).
 * @param {Array} sucursales - Array de objetos sucursal (se filtran las activas internamente).
 * @param {Array} [pedidosPendientes] - Array de pedidos pendientes/confirmados con 'sucursalId'
 *                                      o 'sucursal.id'. Si no se provee, se usa la propiedad
 *                                      'pedidosPendientes' de cada sucursal.
 * @returns {object|null} Sucursal asignada o null si no hay sucursales.
 */
export const asignarSucursalOptima = (sucursales, pedidosPendientes = []) => {
  if (!sucursales || sucursales.length === 0) {
    return null;
  }

  // 1. Filtrar solo sucursales activas
  const sucursalesActivas = sucursales.filter((s) => s.estado === 'activo');

  if (sucursalesActivas.length === 0) {
    return sucursales[0];
  }

  // Ordenar por ID para que el empate se resuelva a favor de la primera (menor ID)
  const ordenadas = [...sucursalesActivas].sort((a, b) => a.id - b.id);

  // Contar pedidos pendientes: por 'sucursalId'/'sucursal.id' si se reciben pedidos,
  // o por propiedad 'pedidosPendientes' de la sucursal si es un fallback.
  const contarPendientes = (sucursal) => {
    if (pedidosPendientes.length > 0) {
      return pedidosPendientes.filter(
        (p) => (p.sucursalId ?? p.sucursal?.id) === sucursal.id
      ).length;
    }
    return sucursal.pedidosPendientes || 0;
  };

  // 2-3. Encontrar la sucursal con MENOS pedidos pendientes (acumulando empates a favor del primero)
  return ordenadas.reduce((menor, actual) => {
    return contarPendientes(actual) < contarPendientes(menor) ? actual : menor;
  });
};