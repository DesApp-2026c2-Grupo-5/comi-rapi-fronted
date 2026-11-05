/**
 * Propósito: hooks de datos privados del usuario autenticado.
 */

import { useQuery } from '@tanstack/react-query';
import { TIEMPO_CACHE_QUERY_MS } from '../../utils/constants';
import { queryKeys } from './queryKeys';
import {
  fetchDirecciones,
  fetchPedidos,
  fetchPerfil,
  fetchSucursalesCandidatas,
} from './fetchers';

export const useDireccionesQuery = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.direcciones,
    queryFn: ({ signal }) => fetchDirecciones({ signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const usePedidosQuery = ({ filtros = {}, enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.pedidos(filtros),
    queryFn: ({ signal }) => fetchPedidos({ filtros, signal }),
    enabled,
    // Los pedidos cambian por acciones del usuario y avisos de socket; esos
    // eventos invalidan la caché, así que puede conservarse fresca más tiempo.
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const usePerfilQuery = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.perfil,
    queryFn: ({ signal }) => fetchPerfil({ signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

/**
 * Candidatas de reasignación de un pedido. Sólo se consulta al abrir el modal
 * (enabled según pedidoId) y siempre se relee: la cobertura y el stock pueden
 * haber cambiado desde la última apertura.
 */
export const useSucursalesCandidatasQuery = ({
  pedidoId = null,
  enabled = true,
} = {}) =>
  useQuery({
    queryKey: queryKeys.private.sucursalesCandidatas(pedidoId),
    queryFn: ({ signal }) => fetchSucursalesCandidatas({ pedidoId, signal }),
    enabled: enabled && pedidoId !== null && pedidoId !== undefined,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
