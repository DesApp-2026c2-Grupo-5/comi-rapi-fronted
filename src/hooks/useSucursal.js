/**
 * Propósito: Custom hook para consumir el SucursalContext de forma sencilla.
 * Contenido: Función useSucursal que retorna el contexto de sucursal.
 * Dependencias: React (useContext), context/SucursalContext.js.
 * Uso: const { sucursalAsignada, cambiarSucursal } = useSucursal();
 */

import { useContext } from 'react';
import { SucursalContext } from '../context/SucursalContext';

/**
 * Hook para acceder al contexto de sucursal.
 * @returns {object} Valores y funciones del SucursalContext.
 * @throws Error si se usa fuera de un SucursalProvider.
 */
export const useSucursal = () => {
  const context = useContext(SucursalContext);
  if (!context) {
    throw new Error('useSucursal debe ser usado dentro de un SucursalProvider');
  }
  return context;
};
