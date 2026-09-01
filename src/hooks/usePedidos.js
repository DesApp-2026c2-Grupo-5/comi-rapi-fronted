/**
 * Propósito: Custom hook para consumir el PedidoContext de forma sencilla.
 * Contenido: Función usePedidos que retorna el contexto de pedidos.
 * Dependencias: React (useContext), context/PedidoContext.jsx.
 * Uso: const { pedidos, crearPedido, confirmarPedido } = usePedidos();
 */

import { useContext } from 'react';
import { PedidoContext } from '../context/PedidoContext';

/**
 * Hook para acceder al contexto de pedidos.
 * @returns {object} Valores y funciones del PedidoContext.
 * @throws Error si se usa fuera de un PedidoProvider.
 */
export const usePedidos = () => {
  const context = useContext(PedidoContext);
  if (!context) {
    throw new Error('usePedidos debe ser usado dentro de un PedidoProvider');
  }
  return context;
};