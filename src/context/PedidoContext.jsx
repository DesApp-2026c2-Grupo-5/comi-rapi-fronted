/**
 * Propósito: Contexto global de pedidos que maneja la lista de pedidos, el pedido actual
 *            y las transiciones de estado (PENDIENTE → CONFIRMADO → ... → ENTREGADO / CANCELADO).
 * Contenido: PedidoProvider, PedidoContext, con funciones crearPedido, confirmarPedido,
 *            cambiarEstado y obtenerPedidosPendientes.
 * Dependencias: React (createContext, useState, useCallback, useMemo), utils/constants.js,
 *               services/seedData.js (pedidosMock).
 * Uso: <PedidoProvider> envuelve la app en App.jsx. Consumir con usePedidos().
 */

import React, { createContext, useState, useCallback, useMemo } from 'react';
import { ESTADOS_PEDIDO } from '../utils/constants';
import { pedidosMock } from '../services/seedData';

// Se crea el contexto
export const PedidoContext = createContext(null);

/**
 * Proveedor del contexto de pedidos.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const PedidoProvider = ({ children }) => {
  // Todos los pedidos de la app (MOCK - reemplazar por la API real)
  const [pedidos, setPedidos] = useState(pedidosMock);
  // Pedido recién creado/confirmado (se muestra en la página de confirmación)
  const [pedidoActual, setPedidoActual] = useState(null);

  // Registra una entrada en el historial de estados de un pedido
  const agregarHistorial = (pedido, nuevoEstado, fecha = new Date().toISOString()) => {
    return {
      ...pedido,
      estado: nuevoEstado,
      historialEstados: [
        ...(pedido.historialEstados || []),
        { estado: nuevoEstado, fecha },
      ],
    };
  };

  /**
   * Crea un nuevo pedido con sucursal asignada y estado inicial PENDIENTE.
   * @param {object} datosPedido - Datos del pedido { cliente, productos, total, direccion }.
   * @param {object} sucursalAsignada - Sucursal asignada automáticamente.
   * @returns {object} Pedido creado.
   */
  const crearPedido = useCallback((datosPedido, sucursalAsignada) => {
    const fecha = new Date().toISOString();
    const nuevoPedido = {
      id: Date.now(), // MOCK - el ID real vendría del backend
      cliente: datosPedido.cliente,
      productos: datosPedido.productos,
      total: datosPedido.total,
      direccion: datosPedido.direccion,
      sucursal: sucursalAsignada,
      estado: ESTADOS_PEDIDO.PENDIENTE,
      fecha,
      historialEstados: [{ estado: ESTADOS_PEDIDO.PENDIENTE, fecha }],
    };
    setPedidos((prev) => [...prev, nuevoPedido]);
    setPedidoActual(nuevoPedido);
    return nuevoPedido;
  }, []);

  /**
   * Simula el pago: pasa el pedido de PENDIENTE a CONFIRMADO automáticamente.
   * @param {number} pedidoId - ID del pedido a confirmar.
   */
  const confirmarPedido = useCallback((pedidoId) => {
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId ? agregarHistorial(p, ESTADOS_PEDIDO.CONFIRMADO) : p
      )
    );
    setPedidoActual((current) =>
      current && current.id === pedidoId
        ? agregarHistorial(current, ESTADOS_PEDIDO.CONFIRMADO)
        : current
    );
  }, []);

  /**
   * Cambia el estado de un pedido (usado por el admin o simulación).
   * @param {number} pedidoId - ID del pedido.
   * @param {string} nuevoEstado - Nuevo estado (debe ser una transición válida).
   */
  const cambiarEstado = useCallback((pedidoId, nuevoEstado) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? agregarHistorial(p, nuevoEstado) : p))
    );
  }, []);

  /**
   * Devuelve los pedidos pendientes (PENDIENTE y CONFIRMADO) usados por la
   * lógica de asignación de sucursal.
   * @returns {Array} Pedidos pendientes/confirmados.
   */
  const obtenerPedidosPendientes = useCallback(() => {
    return pedidos.filter(
      (p) =>
        p.estado === ESTADOS_PEDIDO.PENDIENTE ||
        p.estado === ESTADOS_PEDIDO.CONFIRMADO
    );
  }, [pedidos]);

  // Valor del contexto
  const value = useMemo(
    () => ({
      pedidos,
      pedidoActual,
      crearPedido,
      confirmarPedido,
      cambiarEstado,
      obtenerPedidosPendientes,
    }),
    [pedidos, pedidoActual, crearPedido, confirmarPedido, cambiarEstado, obtenerPedidosPendientes]
  );

  return <PedidoContext.Provider value={value}>{children}</PedidoContext.Provider>;
};