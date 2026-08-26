/**
 * Propósito: Custom hook para consumir el CarritoContext de forma sencilla.
 * Contenido: Función useCarrito que retorna el contexto del carrito.
 * Dependencias: React (useContext), context/CarritoContext.js.
 * Uso: const { items, total, agregarAlCarrito, vaciarCarrito } = useCarrito();
 */

import { useContext } from 'react';
import { CarritoContext } from '../context/CarritoContext';

/**
 * Hook para acceder al contexto del carrito.
 * @returns {object} Valores y funciones del CarritoContext.
 * @throws Error si se usa fuera de un CarritoProvider.
 */
export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe ser usado dentro de un CarritoProvider');
  }
  return context;
};
