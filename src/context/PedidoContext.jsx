/**
 * Propósito: Contexto global de pedidos que maneja la lista de pedidos, el pedido actual
 *            y las transiciones de estado (PENDIENTE → CONFIRMADO → ... → ENTREGADO / CANCELADO).
 * Contenido: PedidoProvider, PedidoContext, con funciones crearPedido, confirmarPedido,
 *            cambiarEstado y obtenerPedidosPendientes.
 * Dependencias: React (createContext, useState, useCallback, useMemo), utils/constants.js,
 *               services/seedData.js (pedidosMock).
 * Uso: <PedidoProvider> envuelve la app en App.jsx. Consumir con usePedidos().
 */

import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { ESTADOS_PEDIDO } from '../utils/constants';
import { pedidosMock } from '../services/seedData';
import * as pedidosApi from '../api/pedidos';

// Se crea el contexto
export const PedidoContext = createContext(null);

/**
 * Proveedor del contexto de pedidos.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const PedidoProvider = ({ children }) => {
  // Todos los pedidos de la app (mock inicial hasta cargar la API real)
  const [pedidos, setPedidos] = useState(pedidosMock);
  // Pedido recién creado/confirmado (se muestra en la página de confirmación)
  const [pedidoActual, setPedidoActual] = useState(null);
  // Carga inicial desde la API (quedan los mock si la API no responde)
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
   * Crea un nuevo pedido: intenta persistirlo en la API real (Postgres) y
   * cae a mock local si la API no responde (dev). Devuelve el pedido creado.
   * @param {object} datosPedido - { cliente, productos, total, costoEnvio, direccion }.
   * @param {object} sucursalAsignada - Sucursal asignada automáticamente.
   */
  const crearPedido = useCallback(async (datosPedido, sucursalAsignada) => {
  const crearMockLocal = () => {
      // Fallback local (sin backend o con error): mismo shape que antes
      const fecha = new Date().toISOString();
      const nuevoPedido = {
        id: Date.now(),
        cliente: datosPedido.cliente,
        productos: datosPedido.productos,
        total: datosPedido.total,
        costoEnvio: datosPedido.costoEnvio || 0,
        direccion: datosPedido.direccion,
        sucursal: sucursalAsignada,
        estado: ESTADOS_PEDIDO.PENDIENTE,
        fecha,
        historialEstados: [{ estado: ESTADOS_PEDIDO.PENDIENTE, fecha }],
      };
      setPedidos((prev) => [...prev, nuevoPedido]);
      setPedidoActual(nuevoPedido);
      return nuevoPedido;
    };
    try {
      const res = await pedidosApi.crearPedido(datosPedido, sucursalAsignada);
      if (res.success) {
        setPedidos((prev) => [...prev, res.data]);
        setPedidoActual(res.data);
        return res.data;
      }
      // Error real del backend (no de red): avisar, no tragarlo en silencio
      if (!res._mock) {
        alert(`No se pudo guardar el pedido en la base de datos: ${res.error}`);
      }
    } catch {
      // Sin backend: sigue con mock local
    }
    return crearMockLocal();
  }, []);

  /**
   * Confirma el pago: PENDIENTE → CONFIRMADO en la API real, con fallback local.
   * @param {number} pedidoId - ID del pedido a confirmar.
   */
  const confirmarPedido = useCallback(async (pedidoId) => {
    try {
      const res = await pedidosApi.confirmarPedido(pedidoId);
      if (res.success) {
        setPedidos((prev) =>
          prev.map((p) => (p.id === pedidoId ? res.data : p))
        );
        setPedidoActual((current) =>
          current && current.id === pedidoId ? res.data : current
        );
        setSenalPedido((n) => n + 1);
        return res.data;
      }
    } catch {
      // cae al fallback local de abajo
    }
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
    setSenalPedido((n) => n + 1);
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