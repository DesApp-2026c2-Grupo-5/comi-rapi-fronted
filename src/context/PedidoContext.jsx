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
import {
  conectarSocket,
  desconectarSocket,
  EVENTOS_SOCKET,
  suscribirPedido,
} from '../services/socket';

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

  // Último estado conocido por pedido (para detectar transiciones)
  const estadosPreviosRef = useRef({});

  const detectarCambios = useCallback(
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

  // Las rooms viven en el servidor, así que hay que volver a suscribirse
  // cuando cambia el conjunto de pedidos (p. ej. al crear uno nuevo). Se usa un
  // string de ids como dependencia para no re-suscribir en cada cambio de estado.
  const idsPedidos = useMemo(
    () => pedidos.map((p) => p.id).sort((a, b) => a - b).join(','),
    [pedidos]
  );

  /**
   * Vuelve a leer la lista de pedidos por REST y la deja en el estado.
   *
   * El socket no trae datos: solo avisa. Por eso, ante cualquier evento, la
   * fuente de verdad sigue siendo `GET /api/pedidos`.
   * @returns {Promise<void>}
   */
  const refrescarPedidos = useCallback(async () => {
    try {
      const res = await pedidosApi.obtenerPedidos();
      if (!res.success || !Array.isArray(res.data)) return;
      const lista = filtrarPorRol(res.data);
      detectarCambios(lista);
      setPedidos(lista);
      // La página de confirmación vive en pedidoActual, que solo existe en
      // memoria: si no se actualiza, queda mostrando el estado viejo.
      setPedidoActual((current) => {
        if (!current) return current;
        return lista.find((p) => p.id === current.id) || current;
      });
    } catch {
      // refresco silencioso: no se molesta al usuario con banners de error
    }
  }, [filtrarPorRol, detectarCambios]);

  // Avisos en tiempo real: reemplaza al refresco periódico de 3 s.
  //   - admin:   recibe pedido_actualizado de cualquier pedido, sin suscribirse.
  //   - cliente: recibe pedido_actualizado de los pedidos a los que se suscribió.
  // No hay aviso al crear un pedido: el admin solo lo necesita cuando se
  // confirma, y el cliente ya tiene la respuesta de su propio POST.
  // El evento solo trae el pedidoId: los datos se releen por REST.
  useEffect(() => {
    if (!hydrated || !emailSesion) return undefined;
    const ids = idsPedidos ? idsPedidos.split(',').map(Number) : [];
    const instancia = conectarSocket();

    // Las rooms pertenecen al socket: al reconectar hay un socket.id nuevo y
    // la suscripción se perdió. Por eso se re-suscribe en cada 'connect'.
    // El admin no necesita rooms individuales: ya está en la room 'admins'.
    const alConectar = () => {
      if (!isAdmin) ids.forEach((id) => { suscribirPedido(id); });
      // Si se perdió un cambio mientras no había conexión, el aviso no llegó.
      // Como el socket es solo un aviso, se resincroniza por REST.
      refrescarPedidos();
    };
    const alCambiarPedido = () => { refrescarPedidos(); };

    instancia.on('connect', alConectar);
    instancia.on(EVENTOS_SOCKET.PEDIDO_ACTUALIZADO, alCambiarPedido);
    alConectar(); // por si la conexión ya venía abierta de una instancia previa

    return () => {
      instancia.off('connect', alConectar);
      instancia.off(EVENTOS_SOCKET.PEDIDO_ACTUALIZADO, alCambiarPedido);
    };
  }, [hydrated, emailSesion, idsPedidos, isAdmin, refrescarPedidos]);

  // Al cerrar sesión se cierra el canal: con otra cookie, el backend rechazaría
  // el handshake de todas formas, y dejarlo abierto sería una conexión muerta.
  useEffect(() => {
    if (hydrated && !emailSesion) desconectarSocket();
  }, [hydrated, emailSesion]);

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
    // El backend ya devuelve un mensaje escrito para el cliente (por ejemplo,
    // el de stock insuficiente), así que se muestra tal cual: prefixarlo con
    // "No se pudo guardar el pedido en la base de datos" sólo le agregaba ruido.
    notificar(res.error || 'No se pudo guardar el pedido.', 'danger');
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
    // Igual que en `crearPedido`: el backend ya devuelve un mensaje para el
    // cliente y este wrapper sólo lo pisaría con el prefijo y el id del pedido.
    notificar(res.error || 'No se pudo confirmar el pedido.', 'danger');
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
