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
 * - Las mutaciones invalidan el prefijo para que cualquier consumidor vuelva a
 *   leer. La lógica de asignación de sucursal no cambia: sigue siendo el
 *   servicio `asignarSucursalOptima`.
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
import { useAuth } from '../hooks/useAuth';
import { useSucursalesQuery } from '../hooks/queries';

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
  const { hydrated, isSuperadmin } = useAuth();

  const consultaHabilitada = hydrated && (isSuperadmin || consultaSolicitada);

  const {
    data: sucursales = LISTA_VACIA,
    isPending,
    isFetching,
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

  /**
   * Carga las sucursales desde el backend (a través de TanStack Query) y
   * devuelve la lista. Si la consulta todavía no estaba habilitada, la
   * habilita: el fetch arranca y el resultado llega al estado del hook. Si ya
   * hay una lectura en curso se reutiliza en vez de cancelarla y repetirla.
   */
  const obtenerSucursalesFn = useCallback(async () => {
    setConsultaSolicitada(true);
    if (!habilitadaRef.current) return sucursalesRef.current;
    if (fetchingRef.current) return sucursalesRef.current;
    const resultado = await refetch();
    return resultado.data || LISTA_VACIA;
  }, [refetch]);

  // Se dispara cuando `cargarSucursales` pidió asignar la óptima y la lista
  // recién llega (primer fetch del cliente, que antes era una promesa directa).
  const [asignacionPendiente, setAsignacionPendiente] = useState(false);

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

  const refrescarSucursales = useCallback(
    () => queryClient.invalidateQueries({ queryKey: CLAVE_SUCURSALES }),
    [queryClient]
  );

  /**
   * Agrega una nueva sucursal (la persiste en el backend e invalida la lista).
   * Iteración 1-geo: un 409 devuelve `opciones` (identidades territoriales
   * de Georef) para que el formulario las muestre y el usuario elija.
   * @param {object} sucursal - Datos de la nueva sucursal.
   * @returns {Promise<{ok: boolean, data?: object, error?: string, opciones?: Array}>} Sucursal creada o el motivo del rechazo.
   */
  const agregarSucursal = useCallback(
    async (sucursal) => {
      const result = await crearSucursal(sucursal);
      if (result.success) {
        await refrescarSucursales();
        return { ok: true, data: result.data };
      }
      return { ok: false, error: result.error, opciones: result.opciones };
    },
    [refrescarSucursales]
  );

  /**
   * Actualiza una sucursal existente e invalida la lista compartida.
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
        await refrescarSucursales();
        return { ok: true, data: result.data };
      }
      return { ok: false, error: result.error, opciones: result.opciones };
    },
    [refrescarSucursales]
  );

  /**
   * Elimina (baja lógica) una sucursal e invalida la lista compartida.
   * @param {number} id - ID de la sucursal a eliminar.
   * @returns {Promise<boolean>} true si se eliminó correctamente.
   */
  const eliminarSucursalFn = useCallback(
    async (id) => {
      const result = await eliminarSucursal(id);
      if (result.success) {
        await refrescarSucursales();
        return true;
      }
      return false;
    },
    [refrescarSucursales]
  );

  // El superadministrador necesita la lista (incluidas inactivas) para su
  // selector de contexto operativo y sus pantallas de gestión. El resto de
  // roles la pide on-demand con `cargarSucursales`/`obtenerSucursales`.
  useEffect(() => {
    if (!hydrated || !isSuperadmin) return;
    cargarSucursales();
  }, [hydrated, isSuperadmin, cargarSucursales]);

  // Sucursales cercanas (solo activas) calculadas para el cliente
  const sucursalesCercanas = useMemo(
    () => sucursales.filter((s) => s.activa !== false),
    [sucursales]
  );

  // Valor del contexto
  const value = useMemo(
    () => ({
      sucursales,
      sucursalesCercanas,
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
