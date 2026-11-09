/**
 * Propósito: hooks de lectura de las pantallas de gestión (admin y
 *            superadministrador): stock, reportes, resumen, clientes,
 *            insumos y personalización.
 *
 * Siguen la misma política que el resto de hooks/queries: el `queryFn` usa
 * `apiGet` + `desenvolver` con `AbortSignal`, la caché y deduplicación son de
 * TanStack Query y las claves están namespaced.
 *
 * El stock depende de la sesión y de la sucursal operativa, así que vive bajo
 * ['private', 'stock'] y RealtimeBridge lo invalida cuando el backend avisa un
 * cambio. Las lecturas de catálogo de gestión (productos, categorías,
 * promociones) reutilizan los hooks públicos de useCatalogo.
 */

import { useQuery } from '@tanstack/react-query';
import { TIEMPO_CACHE_QUERY_MS } from '../../utils/constants';
import { queryKeys } from './queryKeys';
import {
  fetchAdministradores,
  fetchClientes,
  fetchElementoPersonalizacion,
  fetchElementosPersonalizacion,
  fetchInsumos,
  fetchPlantillaPersonalizacion,
  fetchPlantillasPersonalizacion,
  fetchReportes,
  fetchResumenCliente,
  fetchResumenSuperadmin,
  fetchStock,
} from './fetchers';

export const useStockQuery = ({
  productoId = null,
  sucursalId = null,
  enabled = true,
} = {}) =>
  useQuery({
    queryKey: queryKeys.private.stockLista({ sucursalId, productoId }),
    queryFn: ({ signal }) => fetchStock({ productoId, signal }),
    enabled,
    // El stock cambia con cada compra o edición, pero el socket invalida por
    // evento cuando hay un cambio real. La sucursal forma parte de la clave:
    // al cambiar el contexto operativo del superadmin no se reutiliza el stock
    // de la sucursal anterior.
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const useInsumosQuery = ({ activo, tipo, enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.public.insumos({ activo, tipo }),
    queryFn: ({ signal }) => fetchInsumos({ activo, tipo, signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const useReportesQuery = ({ desde, hasta, sucursalId, enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.reportes({ desde, hasta, sucursalId }),
    queryFn: ({ signal }) =>
      fetchReportes({ filtros: { desde, hasta, sucursalId }, signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const useResumenSuperadminQuery = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.resumenSuperadmin,
    queryFn: ({ signal }) => fetchResumenSuperadmin({ signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const useClientesQuery = ({
  buscar = '',
  pagina,
  limite,
  enabled = true,
} = {}) =>
  useQuery({
    queryKey: queryKeys.private.clientes({ buscar, pagina, limite }),
    queryFn: ({ signal }) => fetchClientes({ buscar, pagina, limite, signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const useAdministradoresQuery = ({
  buscar = '',
  pagina,
  limite,
  enabled = true,
} = {}) =>
  useQuery({
    queryKey: queryKeys.private.administradores({ buscar, pagina, limite }),
    queryFn: ({ signal }) =>
      fetchAdministradores({ buscar, pagina, limite, signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const useResumenClienteQuery = ({ id, enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.resumenCliente(id),
    queryFn: ({ signal }) => fetchResumenCliente({ id, signal }),
    enabled: enabled && Boolean(id),
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const useElementosPersonalizacionQuery = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.public.personalizacion(),
    queryFn: ({ signal }) => fetchElementosPersonalizacion({ signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const useElementoPersonalizacionQuery = ({ id, enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.public.personalizacionElemento(id),
    queryFn: ({ signal }) => fetchElementoPersonalizacion({ id, signal }),
    enabled: enabled && Boolean(id),
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const usePlantillasPersonalizacionQuery = (
  categoriaId = null,
  { enabled = true } = {}
) =>
  useQuery({
    queryKey: queryKeys.public.plantillasCategoria(categoriaId),
    queryFn: ({ signal }) =>
      fetchPlantillasPersonalizacion({ categoriaId, signal }),
    enabled: enabled && categoriaId !== null && categoriaId !== undefined,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const usePlantillasTodasQuery = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.public.plantillas,
    queryFn: ({ signal }) => fetchPlantillasPersonalizacion({ signal }),
    enabled,
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });

export const usePlantillaPersonalizacionQuery = ({ id, enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.public.plantilla(id),
    queryFn: ({ signal }) => fetchPlantillaPersonalizacion({ id, signal }),
    enabled: enabled && Boolean(id),
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });
