/**
 * Propósito: hooks de lectura del catálogo público y parámetros de negocio.
 *
 * Todos comparten la misma política: datos públicos con el staleTime común de
 * la caché (20 min), cancelación por AbortSignal y claves namespaced bajo
 * ['public', ...].
 * Los componentes ya no necesitan listeners de socket propios: RealtimeBridge
 * invalida el árbol ['public', ...] cuando el backend avisa un cambio.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TIEMPO_CACHE_QUERY_MS } from '../../utils/constants';
import { queryKeys } from './queryKeys';
import {
  fetchCategoria,
  fetchCategorias,
  fetchMasVendidos,
  fetchParametros,
  fetchPersonalizacion,
  fetchProducto,
  fetchProductos,
  fetchProductosDePromocion,
  fetchPromocion,
  fetchPromociones,
  fetchSucursales,
} from './fetchers';

export const useProductos = (
  {
    incluirPersonalizacion = false,
    incluirResenas = false,
    enabled = true,
    staleTime = TIEMPO_CACHE_QUERY_MS,
  } = {}
) => {
  const queryClient = useQueryClient();
  const clave = queryKeys.public.productos({
    incluirPersonalizacion,
    incluirResenas,
  });
  const datosBootstrap = queryClient.getQueryData(queryKeys.public.bootstrap);
  // El bootstrap solo siembra productos base (sin personalización ni reseñas).
  const datosExistentes =
    !incluirPersonalizacion && !incluirResenas
      ? datosBootstrap?.productos || queryClient.getQueryData(clave)
      : queryClient.getQueryData(clave);
  return useQuery({
    queryKey: clave,
    queryFn: ({ signal }) =>
      fetchProductos({ incluirPersonalizacion, incluirResenas, signal }),
    enabled: enabled && !datosExistentes,
    placeholderData: datosExistentes,
    staleTime,
  });
}

export const useProducto = (id, { enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}) =>
  useQuery({
    queryKey: queryKeys.public.producto(id),
    queryFn: ({ signal }) => fetchProducto({ id, signal }),
    enabled: enabled && id !== undefined && id !== null && id !== '',
    staleTime,
  });

export const useMasVendidos = ({ enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}) => {
  const queryClient = useQueryClient();
  const datosBootstrap = queryClient.getQueryData(queryKeys.public.bootstrap);
  return useQuery({
    queryKey: queryKeys.public.masVendidos,
    queryFn: ({ signal }) => fetchMasVendidos({ signal }),
    enabled: enabled && !datosBootstrap?.masVendidos,
    placeholderData: datosBootstrap?.masVendidos,
    staleTime,
  });
}

export const useCategorias = (
  { incluirInactivas = false, enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}
) => {
  const queryClient = useQueryClient();
  const clave = queryKeys.public.categorias(incluirInactivas);
  const datosBootstrap = queryClient.getQueryData(queryKeys.public.bootstrap);
  const datosExistentes =
    datosBootstrap?.categorias || queryClient.getQueryData(clave);
  return useQuery({
    queryKey: clave,
    queryFn: ({ signal }) => fetchCategorias({ incluirInactivas, signal }),
    enabled: enabled && !datosExistentes,
    placeholderData: datosExistentes,
    staleTime,
  });
}

export const useCategoria = (id, { enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}) =>
  useQuery({
    queryKey: queryKeys.public.categoria(id),
    queryFn: ({ signal }) => fetchCategoria({ id, signal }),
    enabled: enabled && id !== undefined && id !== null && id !== '',
    staleTime,
  });

export const usePromociones = (
  {
    incluirInactivas = false,
    incluirProductos = false,
    enabled = true,
    staleTime = TIEMPO_CACHE_QUERY_MS,
  } = {}
) => {
  const queryClient = useQueryClient();
  const clave = queryKeys.public.promociones({
    incluirInactivas,
    incluirProductos,
  });
  const datosBootstrap = queryClient.getQueryData(queryKeys.public.bootstrap);
  const datosExistentes =
    datosBootstrap?.promociones || queryClient.getQueryData(clave);
  return useQuery({
    queryKey: clave,
    queryFn: ({ signal }) =>
      fetchPromociones({ incluirInactivas, incluirProductos, signal }),
    enabled: enabled && !datosExistentes,
    placeholderData: datosExistentes,
    staleTime,
  });
}

export const usePromocion = (id, { enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}) =>
  useQuery({
    queryKey: queryKeys.public.promocion(id),
    queryFn: ({ signal }) => fetchPromocion({ id, signal }),
    enabled: enabled && id !== undefined && id !== null && id !== '',
    staleTime,
  });

export const useProductosDePromocion = (
  id,
  { enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}
) =>
  useQuery({
    queryKey: queryKeys.public.productosDePromocion(id),
    queryFn: ({ signal }) => fetchProductosDePromocion({ id, signal }),
    enabled: enabled && id !== undefined && id !== null && id !== '',
    staleTime,
  });

export const usePersonalizacionProducto = (
  productoId = null,
  { enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}
) =>
  useQuery({
    queryKey: queryKeys.public.personalizacion(productoId),
    queryFn: ({ signal }) => fetchPersonalizacion({ productoId, signal }),
    enabled,
    staleTime,
  });

export const useParametrosQuery = ({ staleTime = TIEMPO_CACHE_QUERY_MS } = {}) =>
  useQuery({
    queryKey: queryKeys.public.parametros,
    queryFn: ({ signal }) => fetchParametros({ signal }),
    staleTime,
  });

export const useSucursalesQuery = (
  { incluirInactivas = false, enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}
) =>
  useQuery({
    queryKey: queryKeys.public.sucursales(incluirInactivas),
    queryFn: ({ signal }) => fetchSucursales({ incluirInactivas, signal }),
    enabled,
    staleTime,
  });
