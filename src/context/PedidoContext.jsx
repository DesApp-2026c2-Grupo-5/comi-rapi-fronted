/**
 * Propósito: Contexto global de pedidos que maneja la lista de pedidos, el pedido actual
 *            y las transiciones de estado (PENDIENTE → CONFIRMADO → ... → ENTREGADO / CANCELADO).
 * Contenido: PedidoProvider, PedidoContext, con funciones crearPedido, confirmarPedido,
 *            cambiarEstado y obtenerPedidosPendientes.
 * Dependencias: React, @tanstack/react-query, utils/constants.js, api/pedidos.js,
 *               hooks/queries (clave y lectura de pedidos).
 * Uso: <PedidoProvider> envuelve la app en App.jsx. Consumir con usePedidos().
 *
 * NOTA: Sin mocks ni fallbacks. Todos los datos provienen de la API real
 * (Postgres): si la API falla, el error se muestra y no se simula nada.
 *
 * La lista vive en la caché privada de TanStack Query. Las mutaciones
 * (crear/confirmar/cambiar estado) actualizan esa caché con la respuesta del
 * backend, así todas las pantallas y el contexto ven el mismo pedido sin
 * volver a pedir la lista.
 */

import { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { ESTADOS_PEDIDO } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { useSucursalOperativa } from '../hooks/useSucursalOperativa';
import { useNotificaciones } from '../hooks/useNotificaciones';
import * as pedidosApi from '../api/pedidos';
import { queryKeys, usePedidosQuery } from '../hooks/queries';
import { fetchPedidos } from '../hooks/queries/fetchers';
import {
  alReconectar,
  conectarSocket,
  desconectarSocket,
  EVENTOS_SOCKET,
  suscribirPedido,
} from '../services/socket';

// Se crea el contexto
export const PedidoContext = createContext(null);

// Clave de la lista sin filtros: la misma que observa usePedidosQuery.
const CLAVE_PEDIDOS = queryKeys.private.pedidos({});

/**
 * Proveedor del contexto de pedidos.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const PedidoProvider = ({ children }) => {
  const queryClient = useQueryClient();
  // Pedido recién creado/confirmado (se muestra en la página de confirmación)
  const [pedidoActual, setPedidoActual] = useState(null);
  // Se incrementa al confirmar un pago: el Navbar lo usa para animar "Mis Pedidos"
  const [senalPedido, setSenalPedido] = useState(0);
  const { user, hydrated, isAdmin, isCliente, isSuperadmin } = useAuth();
  const { sucursalOperativaId, versionSocket } = useSucursalOperativa();
  const { notificar } = useNotificaciones();
  const navigate = useNavigate();
  const emailSesion = user?.email;
  const haySesion = hydrated && Boolean(emailSesion);

  // La lista se lee de la caché privada. El backend la scopea por su propia
  // cookie (cliente: sus pedidos; admin: su sucursal; superadmin: global).
  const pedidosQuery = usePedidosQuery({ enabled: haySesion });

  // El panel operativo no muestra pedidos PENDIENTE (sin pagar). El admin ve
  // los de su sucursal (el backend ya los scopea); el superadmin recibe la
  // lista GLOBAL de /api/pedidos, así que se la acota acá a la sucursal de su
  // contexto: sin contexto, la lista queda vacía y la pantalla muestra el
  // aviso de elegir sucursal.
  const filtrarPorRol = useCallback(
    (lista) => {
      const pedidos = lista || [];
      if (isAdmin) {
        return pedidos.filter((p) => p.estado !== ESTADOS_PEDIDO.PENDIENTE);
      }
      if (isSuperadmin) {
        if (!sucursalOperativaId) return [];
        return pedidos.filter(
          (p) =>
            p.estado !== ESTADOS_PEDIDO.PENDIENTE &&
            Number(p.sucursal?.id ?? p.sucursalId) === Number(sucursalOperativaId)
        );
      }
      return pedidos;
    },
    [isAdmin, isSuperadmin, sucursalOperativaId]
  );

  // La caché guarda la respuesta cruda del backend; el filtro por rol es un
  // derivado de la vista y se recalcula sin volver a pedir la lista.
  const pedidos = useMemo(
    () => filtrarPorRol(pedidosQuery.data),
    [filtrarPorRol, pedidosQuery.data]
  );

  const cargandoPedidos = haySesion && pedidosQuery.isLoading;

  // Último estado conocido por pedido (para detectar transiciones)
  const estadosPreviosRef = useRef({});

  // Al cambiar de sesión no se comparan estados de otra cuenta: el primer
  // listado de la sesión nueva sólo arma el snapshot.
  useEffect(() => {
    estadosPreviosRef.current = {};
  }, [emailSesion]);

  const detectarCambios = useCallback(
    (lista) => {
      // El superadministrador SIN contexto no opera una sucursal ni es dueño de
      // un pedido: no se le avisa de transiciones ajenas (su panel refresca las
      // métricas con su propio listener). CON contexto opera esa sucursal y
      // recibe los mismos avisos que su administrador.
      const esOperativo = isAdmin || (isSuperadmin && Boolean(sucursalOperativaId));
      if (!esOperativo && !isCliente) return;
      const previos = estadosPreviosRef.current;
      const snapshot = {};
      (lista || []).forEach((pedido) => {
        snapshot[pedido.id] = pedido.estado;
        const previo = previos[pedido.id];

        // Transición → EN_CAMINO: avisa a ambas partes incluyendo el número
        // de pedido (mismo criterio que ENTREGADO).
        if (
          pedido.estado === ESTADOS_PEDIDO.EN_CAMINO &&
          previo &&
          previo !== ESTADOS_PEDIDO.EN_CAMINO
        ) {
          if (esOperativo) {
            notificar(`El pedido #${pedido.id} está en camino.`, 'info');
          } else {
            notificar(`Tu pedido #${pedido.id} está en camino.`, 'info');
          }
          return;
        }

        // Transición → ENTREGADO (fallback admin que simula al repartidor):
        // avisa a ambas partes para que el admin lo vea sin recargar.
        if (
          pedido.estado === ESTADOS_PEDIDO.ENTREGADO &&
          previo &&
          previo !== ESTADOS_PEDIDO.ENTREGADO
        ) {
          if (esOperativo) {
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
          if (esOperativo) {
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
    [notificar, user, isAdmin, isCliente, isSuperadmin, sucursalOperativaId, navigate]
  );

  // Cada vez que la lista cambia (carga inicial, mutación o aviso de socket) se
  // comparan los estados contra el snapshot anterior. En la primera carga no
  // hay snapshot, así que no se dispara ningún aviso por pedidos viejos.
  useEffect(() => {
    if (!haySesion) return;
    detectarCambios(pedidos);
  }, [haySesion, pedidos, detectarCambios]);

  // La página de confirmación vive en pedidoActual, que solo existe en
  // memoria: si la lista trae una versión más nueva, se sincroniza.
  useEffect(() => {
    setPedidoActual((current) => {
      if (!current) return current;
      return pedidos.find((p) => p.id === current.id) || current;
    });
  }, [pedidos]);

  // Las rooms viven en el servidor, así que hay que volver a suscribirse
  // cuando cambia el conjunto de pedidos (p. ej. al crear uno nuevo). Se usa un
  // string de ids como dependencia para no re-suscribir en cada cambio de estado.
  const idsPedidos = useMemo(
    () => pedidos.map((p) => p.id).sort((a, b) => a - b).join(','),
    [pedidos]
  );

  /**
   * Vuelve a leer la lista de pedidos por REST y deja la respuesta en la
   * caché. El socket no trae datos: solo avisa, y la fuente de verdad sigue
   * siendo `GET /api/pedidos`.
   * @returns {Promise<void>}
   */
  const refrescarPedidos = useCallback(async () => {
    if (!haySesion) return;
    try {
      await queryClient.fetchQuery({
        queryKey: CLAVE_PEDIDOS,
        queryFn: ({ signal }) => fetchPedidos({ filtros: {}, signal }),
        // Fuerza una lectura real: el aviso del socket puede referirse a un
        // cambio ocurrido dentro de la ventana de frescura de la caché.
        staleTime: 0,
      });
    } catch {
      // refresco silencioso: no se molesta al usuario con banners de error
    }
  }, [haySesion, queryClient]);

  /**
   * Al recibir pedido_actualizado por socket, solo se trae ese pedido por REST
   * y se actualiza la caché de forma quirúrgica, sin re-fetch de toda la lista.
   * @param {number} pedidoId
   */
  const actualizarPedidoCache = useCallback(
    async (pedidoId) => {
      if (!haySesion) return;
      try {
        const res = await pedidosApi.obtenerPedidoPorId(pedidoId);
        if (res.success && res.data) {
          queryClient.setQueryData(CLAVE_PEDIDOS, (prev) =>
            Array.isArray(prev)
              ? prev.map((p) => (p.id === pedidoId ? res.data : p))
              : prev
          );
          setPedidoActual((current) =>
            current && current.id === pedidoId ? res.data : current
          );
        }
      } catch {
        // silencioso: si falla, la caché se mantiene como estaba
      }
    },
    [haySesion, queryClient]
  );

  // Avisos en tiempo real: reemplaza al refresco periódico de 3 s.
  //   - admin:      recibe pedido_actualizado de su sucursal, sin suscribirse.
  //   - cliente:    recibe pedido_actualizado de los pedidos a los que se suscribió.
  //   - superadmin: queda en la room `admins` (ReporteNegocio refresca métricas
  //                 con su propio listener); con contexto entra además a la
  //                 room de esa sucursal al conectar.
  // `versionSocket` cambia cuando el superadmin elige/limpia su contexto: la
  // conexión se reabre para que el handshake entre a la room de la sucursal
  // nueva y este efecto rearme los listeners sobre la instancia nueva.
  // No hay aviso al crear un pedido: el admin solo lo necesita cuando se
  // confirma, y el cliente ya tiene la respuesta de su propio POST.
  // El evento solo trae el pedidoId: los datos se releen por REST.
  useEffect(() => {
    if (!hydrated || !emailSesion) return undefined;
    const ids = idsPedidos ? idsPedidos.split(',').map(Number) : [];
    const instancia = conectarSocket();

    // Las rooms pertenecen al socket: al reconectar hay un socket.id nuevo y
    // la suscripción se perdió. Por eso se re-suscribe en cada 'connect'.
    // El admin no necesita rooms individuales: el backend lo ingresa solo a
    // `sucursal:{id}` (y a `admins` si es SUPERADMINISTRADOR) al conectar.
    const alConectar = () => {
      // Solo el cliente se suscribe a las rooms de sus propios pedidos: el admin
      // entra a `sucursal:{id}` y el superadmin a `admins` desde el backend al
      // conectar, así que suscribirlos acá sería redundante.
      if (isCliente) ids.forEach((id) => { suscribirPedido(id); });
    };
    // La carga inicial la hace la query al habilitarse. Solo una reconexión
    // necesita resincronizar: durante la caída del canal se pudo perder un aviso.
    const desregistrarReconexion = alReconectar(instancia, refrescarPedidos);
    const alCambiarPedido = ({ pedidoId }) => {
      actualizarPedidoCache(pedidoId);
    };

    instancia.on('connect', alConectar);
    instancia.on(EVENTOS_SOCKET.PEDIDO_ACTUALIZADO, alCambiarPedido);
    // Si la conexión ya venía abierta de una instancia previa, no habrá un
    // nuevo 'connect': las rooms se piden ahora, sin volver a pedir /pedidos.
    if (instancia.connected) alConectar();

    return () => {
      desregistrarReconexion();
      instancia.off('connect', alConectar);
      instancia.off(EVENTOS_SOCKET.PEDIDO_ACTUALIZADO, alCambiarPedido);
    };
  }, [hydrated, emailSesion, idsPedidos, isCliente, refrescarPedidos, actualizarPedidoCache, versionSocket]);

  // Track if we ever had a user session to avoid disconnecting on initial load for guests
  const hadUserRef = useRef(false);
  useEffect(() => {
    if (emailSesion) hadUserRef.current = true;
  }, [emailSesion]);

  // Al cerrar sesión se cierra el canal: con otra cookie, el backend rechazaría
  // el handshake de todas formas, y dejarlo abierto sería una conexión muerta.
  // Solo desconecta si HABÍA usuario antes y ahora no hay (evita desconectar en carga inicial para invitados).
  useEffect(() => {
    if (hydrated && hadUserRef.current && !emailSesion) {
      desconectarSocket();
    }
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
        queryClient.setQueryData(CLAVE_PEDIDOS, (prev) =>
          insertarPrimero(Array.isArray(prev) ? prev : [], res.data)
        );
        setPedidoActual(res.data);
        return res.data;
      }
    // El backend ya devuelve un mensaje escrito para el cliente (por ejemplo,
    // el de stock insuficiente), así que se muestra tal cual: prefixarlo con
    // "No se pudo guardar el pedido en la base de datos" sólo le agregaba ruido.
    notificar(res.error || 'No se pudo guardar el pedido.', 'danger');
    return null;
  }, [notificar, queryClient]);

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
      queryClient.setQueryData(CLAVE_PEDIDOS, (prev) =>
        Array.isArray(prev)
          ? prev.map((p) => (p.id === pedidoId ? res.data : p))
          : prev
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
  }, [notificar, queryClient]);

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
        queryClient.setQueryData(CLAVE_PEDIDOS, (prev) =>
          Array.isArray(prev)
            ? prev.map((p) => (p.id === pedidoId ? res.data : p))
            : prev
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
  }, [notificar, queryClient]);

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
      refrescarPedidos,
    }),
    [pedidos, pedidoActual, cargandoPedidos, senalPedido, crearPedido, confirmarPedido, cambiarEstado, obtenerPedidosPendientes, refrescarPedidos]
  );

  return <PedidoContext.Provider value={value}>{children}</PedidoContext.Provider>;
};

PedidoProvider.propTypes = {
  children: PropTypes.node,
};
