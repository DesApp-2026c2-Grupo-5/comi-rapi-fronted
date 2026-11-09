/**
 * Propósito: Contexto de sucursal para manejar la asignación de sucursal al cliente y la gestión
 *            de sucursales por parte del superadministrador.
 * Contenido: SucursalProvider, SucursalContext, con la lista de sucursales
 *            (TanStack Query), sucursales cercanas, pedidos pendientes, la
 *            sucursal asignada y funciones de gestión (CRUD contra la API).
 * Dependencias: React (createContext, useState, useCallback, useMemo, useEffect),
 *               @tanstack/react-query, hooks/queries (useSucursalesQuery),
 *               services/asignacionSucursal.js, api/sucursales.js,
 *               services/seedData.js.
 * Uso: <SucursalProvider> envuelve la app en App.jsx. Consumir con useSucursal().
 *
 * La lectura de la lista vive en la caché compartida ['public', 'sucursales']:
 * - El superadministrador la habilita al hidratar la sesión porque su selector
 *   de contexto operativo la necesita.
 * - El cliente la pide on-demand con `cargarSucursales` (pantalla Sucursales).
 * - Las mutaciones actualizan el elemento afectado en la caché (alta/edición/
 *   baja lógica) sin invalidar la lista; el evento de Socket.IO hace lo mismo
 *   en las demás sesiones. La lógica de asignación de sucursal no cambia: sigue
 *   siendo el servicio `asignarSucursalOptima`.
 */

import {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';
import {
  crearSucursal,
  actualizarSucursal,
  eliminarSucursal,
} from '../api/sucursales';
import { asignarSucursalOptima as asignarSucursalOptimaService } from '../services/asignacionSucursal';
import { pedidosPendientesMock } from '../services/seedData';
import { actualizarSucursalEnCache } from '../utils/sucursalesCache';
import { useSucursalesQuery } from '../hooks/queries';
import { proximaAperturaEntre } from '../utils/horarios';
import { conectarSocket, EVENTOS_SOCKET } from '../services/socket';
import { useAuth } from '../hooks/useAuth';

// Se crea el contexto
export const SucursalContext = createContext(null);

// Prefijo que cubre las dos variantes de la lista (activas / todas).
const CLAVE_SUCURSALES = ['public', 'sucursales'];

// Array estable para no cambiar la identidad del contexto antes de la primera
// lectura.
const LISTA_VACIA = [];

// Las sucursales ya no conservan 'direccion' como texto ni 'latitud'/'longitud' propias:
// cada sucursal tiene un registro 1:1 en Direccion (Sucursal 1:1 Direccion). El backend
// expone la dirección como objeto anidado 'direccion' (con calle, altura, provincia,
// localidad, codigoPostal, referencia, latitud, longitud) y también latitud/longitud planas
// para compatibilidad. Iteración 1-geo: obligatorios calle, altura y provincia (partido
// además en Buenos Aires); localidad/codigoPostal opcionales y normalizados por el backend.
// El estado proviene del backend como booleano 'activa'.

/**
 * Proveedor del contexto de sucursal.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const SucursalProvider = ({ children }) => {
  const queryClient = useQueryClient();
  // Pedidos pendientes usados por la lógica de asignación (MOCK - no se muta en esta versión)
  const [pedidosPendientes] = useState(pedidosPendientesMock);
  // Sucursal actualmente asignada al cliente
  const [sucursalAsignada, setSucursalAsignada] = useState(null);
  // La lista es perezosa: el superadmin la necesita al entrar y el cliente sólo
  // al abrir la pantalla de sucursales. Hasta que alguien la pide, la consulta
  // queda deshabilitada.
  const [consultaSolicitada, setConsultaSolicitada] = useState(false);
  const { hydrated, user, isSuperadmin } = useAuth();
  const emailSesion = user?.email;

  const consultaHabilitada = hydrated && (isSuperadmin || consultaSolicitada);

  const {
    data: sucursales = LISTA_VACIA,
    isPending,
    isFetching,
    isStale,
    refetch,
  } = useSucursalesQuery({
    incluirInactivas: true,
    enabled: consultaHabilitada,
  });

  // Igual que antes, 'loading' sólo representa la primera lectura: un refetch
  // en segundo plano no debe reemplazar la tabla por el skeleton.
  const loading = consultaHabilitada && isPending;

  // `refetch` es estable, pero la habilitación y los datos cambian: se leen por
  // ref para que `obtenerSucursales` conserve la misma identidad y no dispare
  // bucles en los efectos que lo usan como dependencia.
  const habilitadaRef = useRef(consultaHabilitada);
  habilitadaRef.current = consultaHabilitada;
  const sucursalesRef = useRef(sucursales);
  sucursalesRef.current = sucursales;
  const fetchingRef = useRef(isFetching);
  fetchingRef.current = isFetching;
  // Se usa para no repetir un GET cuando la lista ya está fresca en la caché
  // (p. ej. al volver a la pantalla después de crear/editar una sucursal).
  const staleRef = useRef(isStale);
  staleRef.current = isStale;

  /**
   * Carga las sucursales desde el backend (a través de TanStack Query) y
   * devuelve la lista. Si la consulta todavía no estaba habilitada, la
   * habilita: el fetch arranca y el resultado llega al estado del hook. Si ya
   * hay una lectura en curso se reutiliza en vez de cancelarla y repetirla. Si
   * la caché está fresca no se pide de nuevo: las altas/ediciones ya se
   * aplicaron localmente.
   */
  const obtenerSucursalesFn = useCallback(async () => {
    setConsultaSolicitada(true);
    if (!habilitadaRef.current) return sucursalesRef.current;
    if (fetchingRef.current) return sucursalesRef.current;
    if (!staleRef.current) return sucursalesRef.current;
    const resultado = await refetch();
    return resultado.data || LISTA_VACIA;
  }, [refetch]);

  // Se dispara cuando `cargarSucursales` pidió asignar la óptima y la lista
  // recién llega (primer fetch del cliente, que antes era una promesa directa).
  const [asignacionPendiente, setAsignacionPendiente] = useState(false);

  /**
   * Refresco en segundo plano (socket, pestaña visible, intervalo). Sólo actúa
   * si la lista ya fue solicitada alguna vez: nunca habilita la consulta por sí
   * solo, para no romper la carga perezosa del cliente ni sumar GETs
   * innecesarios. A diferencia de `obtenerSucursalesFn`, fuerza la relectura
   * porque estos eventos indican que el estado del backend cambió.
   */
  const refrescarSucursalesEnSegundoPlano = useCallback(async () => {
    if (!habilitadaRef.current) return;
    await refetch();
  }, [refetch]);

  /**
   * Carga las sucursales y asigna la óptima al cliente (lógica interna).
   */
  const cargarSucursales = useCallback(async () => {
    setAsignacionPendiente(true);
    await obtenerSucursalesFn();
  }, [obtenerSucursalesFn]);

  useEffect(() => {
    if (!asignacionPendiente || !consultaHabilitada) return;
    if (sucursales.length === 0) return;
    setSucursalAsignada(
      asignarSucursalOptimaService(sucursales, pedidosPendientesMock)
    );
    setAsignacionPendiente(false);
  }, [asignacionPendiente, consultaHabilitada, sucursales]);

  // `sucursalAsignada` es una copia del objeto de la lista. Si la sucursal se
  // edita (en esta sesión o por el evento realtime de otra), se sincroniza el
  // nombre/datos sin cambiar la asignación ni volver a pedir la lista.
  useEffect(() => {
    setSucursalAsignada((actual) => {
      if (!actual) return actual;
      const actualizada = sucursales.find(
        (s) => String(s.id) === String(actual.id)
      );
      if (!actualizada || actualizada === actual) return actual;
      return actualizada;
    });
  }, [sucursales]);

  /**
   * Asigna la sucursal óptima usando la lógica del servicio
   * (la sucursal activa con menos pedidos pendientes).
   */
  const asignarSucursalOptima = useCallback(() => {
    const optimal = asignarSucursalOptimaService(sucursales, pedidosPendientes);
    if (optimal) {
      setSucursalAsignada(optimal);
    }
    return optimal;
  }, [sucursales, pedidosPendientes]);

  /**
   * Cambia manualmente la sucursal asignada.
   * @param {number} sucursalId - ID de la sucursal a asignar.
   */
  const cambiarSucursal = useCallback(
    (sucursalId) => {
      const nueva = sucursales.find((s) => s.id === sucursalId);
      if (nueva) {
        setSucursalAsignada(nueva);
      }
    },
    [sucursales]
  );

  /**
   * Agrega una nueva sucursal. La respuesta del POST trae el objeto completo,
   * así que se inserta en la caché local en vez de recargar la lista entera.
   * Iteración 1-geo: un 409 devuelve `opciones` (identidades territoriales
   * de Georef) para que el formulario las muestre y el usuario elija.
   * @param {object} sucursal - Datos de la nueva sucursal.
   * @returns {Promise<{ok: boolean, data?: object, error?: string, opciones?: Array}>} Sucursal creada o el motivo del rechazo.
   */
  const agregarSucursal = useCallback(
    async (sucursal) => {
      const result = await crearSucursal(sucursal);
      if (result.success) {
        if (result.data) {
          actualizarSucursalEnCache(queryClient, {
            accion: 'creado',
            data: result.data,
          });
        } else {
          // Sin datos para actualizar la vista: recién acá se revalida.
          await queryClient.invalidateQueries({ queryKey: CLAVE_SUCURSALES });
        }
        return { ok: true, data: result.data };
      }
      return { ok: false, error: result.error, opciones: result.opciones };
    },
    [queryClient]
  );

  /**
   * Actualiza una sucursal existente. La respuesta del PUT trae el objeto
   * completo: se reemplaza sólo ese elemento en la caché local.
   * Iteración 1-geo: un 409 devuelve `opciones` (identidades territoriales
   * de Georef) para que el formulario las muestre y el usuario elija.
   * @param {number} id - ID de la sucursal a actualizar.
   * @param {object} datos - Nuevos datos de la sucursal.
   * @returns {Promise<{ok: boolean, data?: object, error?: string, opciones?: Array}>} Sucursal actualizada o el motivo del rechazo.
   */
  const actualizarSucursalFn = useCallback(
    async (id, datos) => {
      const result = await actualizarSucursal(id, datos);
      if (result.success) {
        if (result.data) {
          actualizarSucursalEnCache(queryClient, {
            accion: 'actualizado',
            data: result.data,
          });
        } else {
          await queryClient.invalidateQueries({ queryKey: CLAVE_SUCURSALES });
        }
        return { ok: true, data: result.data };
      }
      return { ok: false, error: result.error, opciones: result.opciones };
    },
    [queryClient]
  );

  /**
   * Elimina (baja lógica) una sucursal. El backend devuelve la sucursal ya
   * inactiva: se marca en la caché local sin recargar la lista.
   * @param {number} id - ID de la sucursal a eliminar.
   * @returns {Promise<boolean>} true si se eliminó correctamente.
   */
  const eliminarSucursalFn = useCallback(
    async (id) => {
      const result = await eliminarSucursal(id);
      if (result.success) {
        actualizarSucursalEnCache(queryClient, {
          accion: 'eliminado',
          data: result.data || { id, activa: false },
        });
        return true;
      }
      return false;
    },
    [queryClient]
  );

  // El superadministrador necesita la lista (incluidas inactivas) para su
  // selector de contexto operativo y sus pantallas de gestión. El resto de
  // roles la pide on-demand con `cargarSucursales`/`obtenerSucursales`.
  useEffect(() => {
    if (!hydrated || !isSuperadmin) return;
    cargarSucursales();
  }, [hydrated, isSuperadmin, cargarSucursales]);

  // El backend avisa por WebSocket cuando una sucursal abre o cierra
  // (`sucursal_estado`, emitido por el vigía de horarios y por los cambios del
  // superadmin). Cuando viene de un alta/edición/baja trae `sucursalId` y el
  // evento `sucursal_actualizado` ya actualiza la caché con el objeto completo:
  // no hace falta otra lectura. El resto (vigía, cambio de margen) no trae
  // datos y sí obliga a releer para refrescar `abiertaAhora`. Al reconectar
  // también se refresca, porque los cambios ocurridos sin conexión no llegaron.
  useEffect(() => {
    if (!hydrated || !emailSesion) return undefined;
    const instancia = conectarSocket();
    const alCambiarEstado = (payload) => {
      if (payload && payload.sucursalId) return;
      refrescarSucursalesEnSegundoPlano();
    };
    instancia.on('connect', alCambiarEstado);
    instancia.on(EVENTOS_SOCKET.SUCURSAL_ESTADO, alCambiarEstado);
    return () => {
      instancia.off('connect', alCambiarEstado);
      instancia.off(EVENTOS_SOCKET.SUCURSAL_ESTADO, alCambiarEstado);
    };
  }, [hydrated, emailSesion, refrescarSucursalesEnSegundoPlano]);

  // `abiertaAhora`, `cierrePedidos` y `proximaApertura` son una foto del
  // backend al momento de la consulta. Se refrescan al volver a la pestaña y
  // cada dos minutos, sin polling agresivo: el backend revalida igual al crear
  // el pedido y al confirmar el pago, y los contadores de las pantallas usan el
  // deadline (`segundosRestantes`) que ya vino en esa foto.
  useEffect(() => {
    const alVolver = () => {
      if (!document.hidden) refrescarSucursalesEnSegundoPlano();
    };
    document.addEventListener('visibilitychange', alVolver);
    const intervalo = setInterval(alVolver, 120000);
    return () => {
      document.removeEventListener('visibilitychange', alVolver);
      clearInterval(intervalo);
    };
  }, [refrescarSucursalesEnSegundoPlano]);

  // Sucursales cercanas (solo activas) calculadas para el cliente
  const sucursalesCercanas = useMemo(
    () => sucursales.filter((s) => s.activa !== false),
    [sucursales]
  );

  // Estado operativo global del catálogo: el aviso de "todas cerradas" solo
  // aplica cuando NINGUNA sucursal activa está tomando pedidos ahora.
  const sucursalesAbiertas = useMemo(
    () => sucursalesCercanas.filter((s) => s.abiertaAhora),
    [sucursalesCercanas]
  );
  const todasCerradas =
    sucursalesCercanas.length > 0 && sucursalesAbiertas.length === 0;
  const proximaApertura = useMemo(
    () => proximaAperturaEntre(sucursalesCercanas),
    [sucursalesCercanas]
  );

  // Valor del contexto
  const value = useMemo(
    () => ({
      sucursales,
      sucursalesCercanas,
      sucursalesAbiertas,
      todasCerradas,
      proximaApertura,
      pedidosPendientes,
      sucursalAsignada,
      loading,
      obtenerSucursales: obtenerSucursalesFn,
      cargarSucursales,
      asignarSucursalOptima,
      cambiarSucursal,
      agregarSucursal,
      actualizarSucursal: actualizarSucursalFn,
      eliminarSucursal: eliminarSucursalFn,
    }),
    [
      sucursales,
      sucursalesCercanas,
      sucursalesAbiertas,
      todasCerradas,
      proximaApertura,
      pedidosPendientes,
      sucursalAsignada,
      loading,
      obtenerSucursalesFn,
      cargarSucursales,
      asignarSucursalOptima,
      cambiarSucursal,
      agregarSucursal,
      actualizarSucursalFn,
      eliminarSucursalFn,
    ]
  );

  return <SucursalContext.Provider value={value}>{children}</SucursalContext.Provider>;
};

SucursalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
