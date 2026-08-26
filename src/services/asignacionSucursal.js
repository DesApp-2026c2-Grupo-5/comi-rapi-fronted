/**
 * Propósito: Simular asignación automática de sucursal al cliente según menor carga de pedidos.
 * Contenido: Función asignarSucursal que recibe un array de sucursales y devuelve la óptima.
 * Dependencias: Ninguna.
 * Uso: import { asignarSucursal } from '../services/asignacionSucursal';
 */

/**
 * Asigna la sucursal con menos pedidos pendientes al cliente.
 * En caso de empate, devuelve la primera sucursal encontrada.
 * @param {Array} sucursales - Array de objetos sucursal con propiedad 'pedidosPendientes'.
 * @returns {object} Objeto de sucursal asignada.
 */
export const asignarSucursal = (sucursales) => {
  if (!sucursales || sucursales.length === 0) {
    return null;
  }

  // Filtrar solo sucursales activas
  const sucursalesActivas = sucursales.filter((s) => s.estado === 'activo');

  if (sucursalesActivas.length === 0) {
    return sucursales[0];
  }

  // Encontrar la sucursal con menos pedidos pendientes
  return sucursalesActivas.reduce((menor, actual) => {
    return actual.pedidosPendientes < menor.pedidosPendientes ? actual : menor;
  });
};
