/**
 * Propósito: hooks de TanStack Query para la gestión de quejas (reclamos).
 *
 * Siguen la misma política que el resto de hooks/queries:
 * - El `queryFn` usa `apiGet` + `desenvolver` con `AbortSignal`.
 * - La caché y deduplicación son de TanStack Query.
 * - Las claves están namespaced en `queryKeys.private.quejas`.
 * - La invalidación por WebSocket se hace en `RealtimeBridge` y
 *   `useIndicadoresNav` mediante `queryClient.invalidateQueries`.
 *
 * Dependencias: @tanstack/react-query, queryKeys, fetchers.
 * Uso: import { useQuejasQuery, useMisQuejasQuery, useQuejaQuery } from '../hooks/queries';
 */

import { useQuery } from '@tanstack/react-query';
import { TIEMPO_CACHE_QUERY_MS } from '../../utils/constants';
import { queryKeys } from './queryKeys';
import {
  fetchQuejas,
  fetchMisQuejas,
  fetchQueja,
} from './fetchers';

/**
 * Bandeja paginada de quejas para ADMINISTRADOR (su sucursal) o
 * SUPERADMINISTRADOR (todas o filtradas).
 *
 * @param {{
 *   estado?: string,
 *   q?: string,
 *   sucursalId?: number|string,
 *   pagina?: number,
 *   limite?: number,
 *   enabled?: boolean
 * }} [opciones]
 */
export const useQuejasQuery = ({
  estado = '',
  q = '',
  sucursalId = '',
  pagina = 1,
  limite = 20,
  enabled = true,
} = {}) =>
  useQuery({
    queryKey: queryKeys.private.quejas({ estado, q, sucursalId, pagina, limite }),
    queryFn: ({ signal }) =>
      fetchQuejas({ estado, q, sucursalId, pagina, limite, signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
    // Mantener datos previos mientras se carga la siguiente página/filtro
    placeholderData: (previousData) => previousData,
  });

/**
 * Mis quejas (CLIENTE), opcionalmente acotadas a un pedido.
 *
 * @param {{ pedidoId?: number|string, enabled?: boolean }} [opciones]
 */
export const useMisQuejasQuery = ({
  pedidoId = null,
  enabled = true,
} = {}) =>
  useQuery({
    queryKey: queryKeys.private.misQuejas(pedidoId),
    queryFn: ({ signal }) => fetchMisQuejas({ pedidoId, signal }),
    enabled: enabled && Boolean(pedidoId) === false, // Solo sin pedidoId para lista completa; con pedidoId se usa fetchMisQuejas directo
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

/**
 * Detalle de una queja por ID (para el hilo de conversación).
 *
 * @param {{ id: number|string, enabled?: boolean }} [opciones]
 */
export const useQuejaQuery = ({
  id,
  enabled = true,
} = {}) =>
  useQuery({
    queryKey: queryKeys.private.queja(id),
    queryFn: ({ signal }) => fetchQueja({ id, signal }),
    enabled: enabled && Boolean(id),
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });