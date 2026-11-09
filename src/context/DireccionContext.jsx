/**
 * Propósito: Contexto de direcciones del cliente con CRUD contra el backend real.
 * Contenido: DireccionProvider, DireccionContext, con funciones cargarDirecciones,
 *            agregarDireccion, editarDireccion y eliminarDireccion (baja lógica).
 * Dependencias: React (createContext, useState, useCallback, useMemo, useRef),
 *               @tanstack/react-query, hooks/queries (useDireccionesQuery,
 *               queryKeys), hooks/useAuth, api/direcciones.js.
 * Uso: <DireccionProvider> envuelve la app en App.jsx. Consumir con useDirecciones().
 *
 * El backend scopea por sesión (DER: Usuario 1:N Direccion), así que no hace falta
 * pasar el cliente: cada cliente solo ve y gestiona sus propias direcciones.
 * El DER no define una dirección "principal": eso se elige en el carrito.
 *
 * La lista vive en la caché privada ['private', 'direcciones']. La lectura sigue
 * siendo perezosa (el provider no pide nada al montar): `cargarDirecciones` la
 * habilita/refresca y las mutaciones actualizan la caché con la respuesta.
 */

import {
  createContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';
import {
  crearDireccion,
  actualizarDireccion,
  eliminarDireccion as eliminarDireccionApi,
} from '../api/direcciones';
import { queryKeys, useDireccionesQuery } from '../hooks/queries';
import { useAuth } from '../hooks/useAuth';

// Se crea el contexto
export const DireccionContext = createContext(null);

// Array estable para no cambiar la identidad del contexto antes de la primera
// lectura.
const LISTA_VACIA = [];

/**
 * Proveedor del contexto de direcciones.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const DireccionProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { hydrated } = useAuth();
  // La lectura es perezosa: hasta que una pantalla pide las direcciones la
  // consulta queda deshabilitada.
  const [consultaSolicitada, setConsultaSolicitada] = useState(false);
  const consultaHabilitada = hydrated && consultaSolicitada;

  const {
    data: direcciones = LISTA_VACIA,
    isPending,
    isFetching,
    isStale,
    error: errorQuery,
    refetch,
  } = useDireccionesQuery({ enabled: consultaHabilitada });

  const loading = consultaSolicitada && isPending;
  const [errorAccion, setErrorAccion] = useState(null);
  const error = errorAccion || errorQuery?.message || null;

  const fetchingRef = useRef(isFetching);
  fetchingRef.current = isFetching;
  const direccionesRef = useRef(direcciones);
  direccionesRef.current = direcciones;
  // `isPending` distingue "sin datos todavía" de "lista vacía": sin esto, un
  // cliente sin direcciones se vería como caché válida y no se reintentaría.
  const hayDatosRef = useRef(!isPending);
  hayDatosRef.current = !isPending;
  const staleRef = useRef(isStale);
  staleRef.current = isStale;

  /**
   * Carga las direcciones activas del cliente autenticado desde el backend
   * (a través de TanStack Query). Si ya hay una lectura en curso, la reutiliza;
   * si la caché todavía está fresca, no repite el GET.
   * @returns {Promise<Array>} Direcciones cargadas.
   */
  const cargarDirecciones = useCallback(async () => {
    setConsultaSolicitada(true);
    setErrorAccion(null);
    if (fetchingRef.current) return direccionesRef.current;
    // Carrito y Perfil llaman a esta función al montar y comparten la misma
    // clave: sin esta guarda cada visita forzaba un GET aunque los datos
    // fueran recientes. Se refresca sólo sin datos o con la caché vencida.
    if (hayDatosRef.current && !staleRef.current) return direccionesRef.current;
    const resultado = await refetch();
    return resultado.data || [];
  }, [refetch]);

  /**
   * Agrega una nueva dirección y la persiste en el backend.
   * Iteración 1-geo: un 409 devuelve `opciones` (identidades territoriales
   * de Georef) para que el formulario las muestre y el usuario elija.
   * @param {object} datosDireccion - { calle, altura, provincia, departamento?, localidad?, codigoPostal?, referencia?, alias? }.
   * @returns {Promise<{ok: boolean, data?: object, error?: string, opciones?: Array}>} Dirección creada o el motivo del rechazo.
   */
  const agregarDireccion = useCallback(
    async (datosDireccion) => {
      const result = await crearDireccion(datosDireccion);
      if (result.success) {
        queryClient.setQueryData(queryKeys.private.direcciones, (prev) => [
          ...(Array.isArray(prev) ? prev : []),
          result.data,
        ]);
        setErrorAccion(null);
        return { ok: true, data: result.data };
      }
      setErrorAccion(result.error);
      // Iteración 5: status (funcional vs técnico) y detalle de cobertura.
      return {
        ok: false,
        error: result.error,
        status: result.status,
        detalle: result.detalle,
        opciones: result.opciones,
      };
    },
    [queryClient]
  );

  /**
   * Edita una dirección existente en el backend.
   * Iteración 1-geo: un 409 devuelve `opciones` (identidades territoriales
   * de Georef) para que el formulario las muestre y el usuario elija.
   * @param {number} id - ID de la dirección.
   * @param {object} datos - Campos a actualizar.
   * @returns {Promise<{ok: boolean, data?: object, error?: string, opciones?: Array}>} Dirección actualizada o el motivo del rechazo.
   */
  const editarDireccion = useCallback(
    async (id, datos) => {
      const result = await actualizarDireccion(id, datos);
      if (result.success) {
        queryClient.setQueryData(queryKeys.private.direcciones, (prev) =>
          (Array.isArray(prev) ? prev : []).map((d) =>
            d.id === result.data.id ? result.data : d
          )
        );
        setErrorAccion(null);
        return { ok: true, data: result.data };
      }
      setErrorAccion(result.error);
      // Iteración 5: status (funcional vs técnico) y detalle de cobertura.
      return {
        ok: false,
        error: result.error,
        status: result.status,
        detalle: result.detalle,
        opciones: result.opciones,
      };
    },
    [queryClient]
  );

  /**
   * Elimina una dirección (baja lógica: el backend marca activa = false).
   * @param {number} id - ID de la dirección a eliminar.
   * @returns {Promise<{ok: boolean, error?: string}>} Resultado o el motivo del rechazo.
   */
  const eliminarDireccion = useCallback(
    async (id) => {
      const result = await eliminarDireccionApi(id);
      if (result.success) {
        queryClient.setQueryData(queryKeys.private.direcciones, (prev) =>
          (Array.isArray(prev) ? prev : []).filter(
            (d) => d.id !== Number(id)
          )
        );
        setErrorAccion(null);
        return { ok: true };
      }
      setErrorAccion(result.error);
      return { ok: false, error: result.error };
    },
    [queryClient]
  );

  // Valor del contexto
  const value = useMemo(
    () => ({
      direcciones,
      loading,
      error,
      cargarDirecciones,
      agregarDireccion,
      editarDireccion,
      eliminarDireccion,
    }),
    [
      direcciones,
      loading,
      error,
      cargarDirecciones,
      agregarDireccion,
      editarDireccion,
      eliminarDireccion,
    ]
  );

  return <DireccionContext.Provider value={value}>{children}</DireccionContext.Provider>;
};

DireccionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
