/**
 * Propósito: hooks de reseñas (públicas y propias) con TanStack Query.
 */

import { useQuery } from '@tanstack/react-query';
import { TIEMPO_CACHE_QUERY_MS } from '../../utils/constants';
import { queryKeys } from './queryKeys';
import {
  fetchElegibles,
  fetchEstadoResenaProducto,
  fetchMisResenas,
  fetchResenasProducto,
} from './fetchers';

export const useResenasProducto = (productoId, { pagina = 1, limite = 10, enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.public.resenasProducto(productoId, pagina, limite),
    queryFn: ({ signal }) => fetchResenasProducto({ productoId, pagina, limite, signal }),
    enabled: enabled && productoId !== undefined && productoId !== null && productoId !== '',
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const useElegiblesParaResenar = ({ pedidoId = null, enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.elegibles(pedidoId),
    queryFn: ({ signal }) => fetchElegibles({ pedidoId, signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const useMisResenasQuery = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.misResenas,
    queryFn: ({ signal }) => fetchMisResenas({ signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

/**
 * Estado de la reseña del cliente para un producto puntual.
 * Devuelve `{ puedeResenar, miResena }` sin pedir los listados globales.
 */
export const useEstadoResenaProducto = (productoId, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.resenaProducto(productoId),
    queryFn: ({ signal }) => fetchEstadoResenaProducto({ productoId, signal }),
    enabled: enabled && productoId !== undefined && productoId !== null && productoId !== '',
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });
