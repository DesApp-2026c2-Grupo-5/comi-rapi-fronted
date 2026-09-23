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

import React, { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ESTADOS_PEDIDO } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { useNotificaciones } from '../hooks/useNotificaciones';
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
  const { user, hydrated, isAdmin } = useAuth();
  const { notificar } = useNotificaciones();
  const navigate = useNavigate();
  const emailSesion = user?.email;

  // El admin solo ve pedidos CONFIRMADO y posteriores; los PENDIENTE (sin pagar)
  // no le interesan y quedan fuera de su lista, del badge y del polling.
  const filtrarPorRol = useCallback(
    (lista) => {
      if (!isAdmin) return lista;
      return (lista || []).filter((p) => p.estado !== ESTADOS_PEDIDO.PENDIENTE);
    },
    [isAdmin]
  );

  // Carga inicial y ante cambios de sesión: el backend scopea por su propia
  // cookie, acá solo se espera a la hidratación y se limpia al salir.
  useEffect(() => {
    if (!hydrated) return;
    let vivo = true;
    (async () => {
      setCargandoPedidos(true);
      try {
        if (!emailSesion) {
          if (vivo) setPedidos([]);
          return;
        }
        const res = await pedidosApi.obtenerPedidos();
        if (vivo && res.success && Array.isArray(res.data)) {
          setPedidos(filtrarPorRol(res.data));
        }
      } finally {
        if (vivo) setCargandoPedidos(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [hydrated, emailSesion, filtrarPorRol]);

  // Refresco silencioso periódico (~casi tiempo real): permite que el admin
  // (y el cliente) vean al instante en el Navbar/lista los pedidos que cambian
  // desde otra sesión: cancelaciones, cambios de estado y pedidos recién creados.
  // También avisa con un banner global cuando cambia algo relevante:
  //   - cliente: su pedido pasa a "en camino", o el admin canceló su pedido;
  //   - admin: un cliente canceló un pedido (esté donde esté en la app).
  const REFRESCO_PEDIDOS_MS = 3000;
  // Último estado conocido por pedido (para detectar transiciones en el polling)
  const estadosPreviosRef = useRef({});

  const detectarCambiosPolling = useCallback(
    (lista) => {
      const previos = estadosPreviosRef.current;
      const snapshot = {};
      (lista || []).forEach((pedido) => {
        snapshot[pedido.id] = pedido.estado;
        const previo = previos[pedido.id];

        // Transición → EN_CAMINO: avisa al cliente dueño del pedido.
        if (
          pedido.estado === ESTADOS_PEDIDO.EN_CAMINO &&
          previo &&
          previo !== ESTADOS_PEDIDO.EN_CAMINO
        ) {
          notificar('Tu pedido está en camino.', 'info');
          return;
        }

        // Transición → ENTREGADO (fallback admin que simula al repartidor):
        // avisa a ambas partes para que el admin lo vea sin recargar.
        if (
          pedido.estado === ESTADOS_PEDIDO.ENTREGADO &&
          previo &&
          previo !== ESTADOS_PEDIDO.ENTREGADO
        ) {
          if (isAdmin) {
            notificar(`El pedido #${pedido.id} fue entregado.`, 'success');
          } else {
            notificar(`Tu pedido #${pedido.id} fue entregado.`, 'success');
          }
          return;
        }

        // Transición → CANCELADO hecha por otra persona: al admin si la canceló
        // un cliente; al cliente si la canceló el admin.
        if (
          pedido.estado === ESTADOS_PEDIDO.CANCELADO &&
          previo &&
          previo !== ESTADOS_PEDIDO.CANCELADO
        ) {
          const registroCancelacion = (pedido.historialEstados || []).find(
            (h) => h.estado === ESTADOS_PEDIDO.CANCELADO
          );
          const esCancelacionPropia =
            Boolean(registroCancelacion?.usuarioId) &&
            registroCancelacion.usuarioId === user?.id;
          if (esCancelacionPropia) return; // la hizo este usuario: no se auto-avisa
          if (isAdmin) {
            // Si el pedido seguía en PENDIENTE no se informa: no estaba pagado y
            // cancelarlo no requiere atención del admin. Solo avisa a partir de
            // CONFIRMADO, que es cuando el pedido ya quedó registrado.
            if (previo === ESTADOS_PEDIDO.PENDIENTE) return;
            // Al hacer clic en el banner, el admin va a /admin/pedidos con foco en
            // ese pedido (PedidosPendientes hace scroll y lo resalta).
            notificar(`El cliente canceló el pedido #${pedido.id}.`, 'danger', 5000, () =>
              navigate('/admin/pedidos', { state: { pedidoFoco: pedido.id } })
            );
          } else {
            // El cliente ve el detalle del pedido cancelado por el admin.
            notificar(`Tu pedido #${pedido.id} fue cancelado.`, 'danger', 5000, () =>
              navigate(`/cliente/pedido/${pedido.id}`)
            );
          }
        }
      });
      estadosPreviosRef.current = snapshot;
    },
    [notificar, user, isAdmin, navigate]
  );

  useEffect(() => {
    if (!hydrated || !emailSesion) return undefined;
    const intervalo = setInterval(async () => {
      try {
        const res = await pedidosApi.obtenerPedidos();
        if (res.success && Array.isArray(res.data)) {
          const lista = filtrarPorRol(res.data);
          detectarCambiosPolling(lista);
          setPedidos(lista);
        }
      } catch {
        // refresco silencioso: no se molesta al usuario con banners de error
      }
    }, REFRESCO_PEDIDOS_MS);
    return () => clearInterval(intervalo);
  }, [hydrated, emailSesion, detectarCambiosPolling, filtrarPorRol]);

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
    notificar(`No se pudo guardar el pedido en la base de datos: ${res.error}`, 'danger');
    return null;
  }, [notificar]);

  /**
   * Confirma el pago: PENDIENTE → CONFIRMADO en la API real, persistiendo el
   * medio de pago elegido en el pedido.
   * Si la API falla, muestra el error y devuelve null (no se simula nada).
   * @param {number} pedidoId - ID del pedido a confirmar.
   * @param {string} [medioPago] - Medio de pago ('MERCADO_PAGO' | 'TARJETA').
   */
  const confirmarPedido = useCallback(async (pedidoId, medioPago) => {
    const res = await pedidosApi.confirmarPedido(pedidoId, medioPago);
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
    notificar(`No se pudo confirmar el pedido #${pedidoId}: ${res.error}`, 'danger');
    return null;
  }, [notificar]);

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
      notificar(`No se pudo cambiar el estado del pedido #${pedidoId}: ${res.error}`, 'danger');
      return null;
    } catch (error) {
      notificar(`No se pudo cambiar el estado del pedido #${pedidoId}: ${error.message}`, 'danger');
      return null;
    }
  }, [notificar]);

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
