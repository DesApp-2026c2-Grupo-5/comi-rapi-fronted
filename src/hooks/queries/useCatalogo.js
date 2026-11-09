/**
 * Propósito: hooks de lectura del catálogo público y parámetros de negocio.
 *
 * Todos comparten la misma política: datos públicos con staleTime infinito
 * para evitar refetch innecesarios. La caché se actualiza vía Socket.IO
 * (RealtimeBridge → setQueryData) y los hooks se suscriben a esos cambios
 * porque permanecen habilitados (enabled: true) con initialData desde la caché.
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
    // initialData lee la caché al montar; la query queda habilitada y
    // suscrita a actualizaciones vía setQueryData/setQueriesData.
    initialData: () => datosExistentes,
    enabled,
    staleTime,
  });
};

export const useProducto = (id, { enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}) => {
  const queryClient = useQueryClient();

  // 1. Intenta obtener el producto de la lista base (useProductos con datos base).
  // La lista base ya incluye: id, nombre, precio, categoria, categoriaId, imagen,
  // descripcion, activo, tipo, componentes (para combos).
  // NO incluye: personalizacion, resenas.
  const claveListaBase = queryKeys.public.productos({});
  const listaBase = queryClient.getQueryData(claveListaBase);
  const productoDeLista = listaBase?.find((p) => String(p.id) === String(id));

  // 2. Fallback a bootstrap si no está en la lista base.
  const datosBootstrap = queryClient.getQueryData(queryKeys.public.bootstrap);
  const productoBootstrap = datosBootstrap?.productos?.find(
    (p) => String(p.id) === String(id)
  );

  // 3. Dato completo disponible sin fetch individual: lista base > bootstrap > null
  const datoCompletoCache = productoDeLista ?? productoBootstrap ?? null;

  const queryKey = queryKeys.public.producto(id);

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchProducto({ id, signal }),
    // initialData lee la caché al montar; la query queda habilitada y
    // suscrita a actualizaciones vía setQueryData.
    initialData: () => datoCompletoCache,
    enabled: enabled && id !== undefined && id !== null && id !== '',
    staleTime,
  });
};

export const useMasVendidos = ({ enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}) => {
  const queryClient = useQueryClient();
  const datosBootstrap = queryClient.getQueryData(queryKeys.public.bootstrap);
  return useQuery({
    queryKey: queryKeys.public.masVendidos,
    queryFn: ({ signal }) => fetchMasVendidos({ signal }),
    initialData: () => datosBootstrap?.masVendidos,
    enabled,
    staleTime,
  });
};

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
    initialData: () => datosExistentes,
    enabled,
    staleTime,
  });
};

export const useCategoria = (id, { enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}) => {
  const queryClient = useQueryClient();

  // 1. Intenta obtener la categoría de la lista con todas (incluyendo inactivas).
  // La lista ya incluye: id, nombre, descripcion, imagen, activa.
  const claveListaTodas = queryKeys.public.categorias(true);
  const listaTodas = queryClient.getQueryData(claveListaTodas);
  const categoriaDeLista = listaTodas?.find((c) => String(c.id) === String(id));

  // 2. Fallback a bootstrap si no está en la lista.
  const datosBootstrap = queryClient.getQueryData(queryKeys.public.bootstrap);
  const categoriaBootstrap = datosBootstrap?.categorias?.find(
    (c) => String(c.id) === String(id)
  );

  // 3. Dato disponible sin fetch individual: lista > bootstrap > null
  const datoCache = categoriaDeLista ?? categoriaBootstrap ?? null;

  const queryKey = queryKeys.public.categoria(id);

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchCategoria({ id, signal }),
    initialData: () => datoCache,
    enabled: enabled && id !== undefined && id !== null && id !== '',
    staleTime,
  });
};

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
    initialData: () => datosExistentes,
    enabled,
    staleTime,
  });
};

export const usePromocion = (id, { enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}) => {
  const queryClient = useQueryClient();

  // La lista de admin usa la clave 'todas/con-productos' (incluirInactivas=true, incluirProductos=true)
  // Esa lista SÍ trae los productos asociados en el campo 'productos' (minúscula).
  const listaAdmin = queryClient.getQueryData(queryKeys.public.promociones({ incluirProductos: true, incluirInactivas: true }));
  const datoCache = listaAdmin?.find((p) => String(p.id) === String(id));

  const queryKey = queryKeys.public.promocion(id);

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      // Verifica la caché de admin en el momento de la ejecución
      const cacheAdmin = queryClient.getQueryData(queryKeys.public.promociones({ incluirProductos: true, incluirInactivas: true }));
      const datoEnCache = cacheAdmin?.find((p) => String(p.id) === String(id));
      
      // La lista usa 'productos' (minúscula), el detalle usa 'Productos' (mayúscula)
      const tieneProductos = datoEnCache?.Productos || datoEnCache?.productos;
      if (tieneProductos) {
        // Retorna el objeto promoción directamente, NO envuelto en { data: ... }
        // fetchPromocion ya retorna el objeto promoción directo (desenvolver hace eso)
        return Promise.resolve(datoEnCache);
      }
      return fetchPromocion({ id, signal });
    },
    enabled: enabled && id !== undefined && id !== null && id !== '',
    staleTime,
    placeholderData: () => datoCache,
  });
};

export const useProductosDePromocion = (
  id,
  { enabled = true, staleTime = TIEMPO_CACHE_QUERY_MS } = {}
) => {
  const queryClient = useQueryClient();

  // Busca en la caché de admin (la que usa la lista de superadmin)
  const listaAdmin = queryClient.getQueryData(queryKeys.public.promociones({ incluirProductos: true, incluirInactivas: true }));
  const promoAdmin = listaAdmin?.find((p) => String(p.id) === String(id));
  const datoCache = promoAdmin?.Productos ?? promoAdmin?.productos ?? [];

  const queryKey = queryKeys.public.productosDePromocion(id);

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      const cacheAdmin = queryClient.getQueryData(queryKeys.public.promociones({ incluirProductos: true, incluirInactivas: true }));
      const promoEnCache = cacheAdmin?.find((p) => String(p.id) === String(id));
      
      // La lista usa 'productos' (minúscula), el detalle usa 'Productos' (mayúscula)
      const tieneProductos = promoEnCache?.Productos || promoEnCache?.productos;
      if (tieneProductos) {
        return Promise.resolve(tieneProductos);
      }
      return fetchProductosDePromocion({ id, signal });
    },
    enabled: enabled && id !== undefined && id !== null && id !== '',
    staleTime,
    placeholderData: () => datoCache,
  });
};

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
