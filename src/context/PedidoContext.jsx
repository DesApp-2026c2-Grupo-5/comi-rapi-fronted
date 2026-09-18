/**
 * Propósito: Contexto global de pedidos que maneja la lista de pedidos, el pedido actual
 *            y las transiciones de estado (PENDIENTE → CONFIRMADO → ... → ENTREGADO / CANCELADO).
 * Contenido: PedidoProvider, PedidoContext, con funciones crearPedido, confirmarPedido,
 *            cambiarEstado y obtenerPedidosPendientes.
 * Dependencias: React (createContext, useState, useCallback, useMemo, useEffect),
 *               utils/constants.js, api/pedidos.js.
 * Uso: <PedidoProvider> envuelve la app en App.jsx. Consumir con usePedidos().
 *
 * NOTA: Sin mocks ni fallbacks. Todos los datos provienen de la API real
 * (Postgres): si la API falla, el error se muestra y no se simula nada.
 */

import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { ESTADOS_PEDIDO } from '../utils/constants';
import * as pedidosApi from '../api/pedidos';

// Se crea el contexto
export const PedidoContext = createContext(null);

/**
 * Proveedor del contexto de pedidos.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const PedidoProvider = ({ children }) => {
  // Todos los pedidos del usuario autenticado (desde la API real)
  const [pedidos, setPedidos] = useState([]);
  // Pedido recién creado/confirmado (se muestra en la página de confirmación)
  const [pedidoActual, setPedidoActual] = useState(null);
  // Carga inicial desde la API
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  // Se incrementa al confirmar un pago: el Navbar lo usa para animar "Mis Pedidos"
  const [senalPedido, setSenalPedido] = useState(0);

  useEffect(() => {
    let vivo = true;
    (async () => {
      setCargandoPedidos(true);
      try {
        const res = await pedidosApi.obtenerPedidos();
        if (vivo && res.success && Array.isArray(res.data)) {
          setPedidos(res.data);
        }
      } finally {
        if (vivo) setCargandoPedidos(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  // Inserta un pedido al inicio (recientes primero), sin duplicar por id
  const insertarPrimero = (lista, pedido) => [
    pedido,
    ...lista.filter((p) => p.id !== pedido.id),
  ];

  /**
   * Crea un nuevo pedido persistiéndolo en la API real (Postgres).
   * Si la API falla, muestra el error y devuelve null (no se simula nada).
   * @param {object} datosPedido - { productos, total, costoEnvio, direccion }.
   * @param {object} sucursalAsignada - Sucursal asignada automáticamente.
   */
  const crearPedido = useCallback(async (datosPedido, sucursalAsignada) => {
      const res = await pedidosApi.crearPedido(datosPedido, sucursalAsignada);
      if (res.success) {
        setPedidos((prev) => insertarPrimero(prev, res.data));
        setPedidoActual(res.data);
        return res.data;
      }
    alert(`No se pudo guardar el pedido en la base de datos: ${res.error}`);
    return null;
  }, []);

  /**
   * Confirma el pago: PENDIENTE → CONFIRMADO en la API real.
   * Si la API falla, muestra el error y devuelve null (no se simula nada).
   * @param {number} pedidoId - ID del pedido a confirmar.
   */
  const confirmarPedido = useCallback(async (pedidoId) => {
    const res = await pedidosApi.confirmarPedido(pedidoId);
    if (res.success && res.data) {
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? res.data : p))
      );
      setPedidoActual((current) =>
        current && current.id === pedidoId ? res.data : current
      );
      setSenalPedido((n) => n + 1);
      return res.data;
    }
    alert(`No se pudo confirmar el pedido #${pedidoId}: ${res.error}`);
    return null;
  }, []);

  /**
   * Cambia el estado de un pedido contra la API real (usado por el admin).
   * Actualiza el estado y el historial desde la respuesta mapeada; si la API
   * falla, no cambia nada en memoria.
   * @param {number} pedidoId - ID del pedido.
   * @param {string} nuevoEstado - Nuevo estado (debe ser una transición válida).
   * @returns {Promise<object|null>} Pedido actualizado o null si falla.
   */
  const cambiarEstado = useCallback(async (pedidoId, nuevoEstado) => {
    try {
      const res = await pedidosApi.cambiarEstado(pedidoId, nuevoEstado);
      if (res.success && res.data) {
        setPedidos((prev) =>
          prev.map((p) => (p.id === pedidoId ? res.data : p))
        );
        setPedidoActual((current) =>
          current && current.id === pedidoId ? res.data : current
        );
        return res.data;
      }
      alert(`No se pudo cambiar el estado del pedido #${pedidoId}: ${res.error}`);
      return null;
    } catch (error) {
      alert(`No se pudo cambiar el estado del pedido #${pedidoId}: ${error.message}`);
      return null;
    }
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
      cargandoPedidos,
      senalPedido,
      crearPedido,
      confirmarPedido,
      cambiarEstado,
      obtenerPedidosPendientes,
    }),
    [pedidos, pedidoActual, cargandoPedidos, senalPedido, crearPedido, confirmarPedido, cambiarEstado, obtenerPedidosPendientes]
  );

  return <PedidoContext.Provider value={value}>{children}</PedidoContext.Provider>;
};
