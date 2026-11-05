/**
 * Propósito: piezas compartidas del snapshot público inicial
 *            (GET /api/public/bootstrap).
 *
 * `opcionesBootstrap` centraliza la clave y la política de la consulta para que
 * la precarga de `main.jsx` y el hook `useBootstrap` no se desincronicen.
 *
 * `sembrarBootstrap` vuelca el snapshot en las mismas claves que usan las
 * pantallas. Se llama antes del primer render (precarga) y también cuando el
 * snapshot llega por el hook (por ejemplo, si la precarga no terminó a tiempo).
 *
 * Regla de siembra: sólo se llenan claves que todavía no tienen datos. Nunca se
 * pisa una respuesta más específica (productos con reseñas o personalización) ni
 * una lectura que ya esté en curso.
 */

import { TIEMPO_CACHE_QUERY_MS } from '../../utils/constants';
import { queryKeys } from './queryKeys';
import { fetchBootstrap } from './fetchers';

/** Configuración única de la consulta del snapshot. */
export const opcionesBootstrap = {
  queryKey: queryKeys.public.bootstrap,
  queryFn: ({ signal }) => fetchBootstrap({ signal }),
  staleTime: TIEMPO_CACHE_QUERY_MS,
  // Es una precarga: si falla, cada pantalla conserva su propio GET. Reintentar
  // el snapshot sólo duplicaría lecturas y retrasaría el primer render.
  retry: false,
  // No hace falta repetirla al volver a la pestaña ni al reconectar. Los avisos
  // de RealtimeBridge invalidan las claves reales.
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};

/**
 * Siembra la caché pública con el snapshot.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {object} data Respuesta de GET /api/public/bootstrap.
 */
export const sembrarBootstrap = (queryClient, data) => {
  if (!data) return;

  const sembrar = (queryKey, valor) => {
    if (valor === undefined) return;
    const estado = queryClient.getQueryState(queryKey);
    if (estado?.data !== undefined) return;
    if (estado?.fetchStatus === 'fetching') return;
    queryClient.setQueryData(queryKey, valor);
  };

  sembrar(queryKeys.public.parametros, data.parametros);
  sembrar(queryKeys.public.categorias(false), data.categorias);
  sembrar(queryKeys.public.productos({}), data.productos);
  sembrar(queryKeys.public.masVendidos, data.masVendidos);
  // El snapshot trae las promociones con sus productos. La portada las pide sin
  // `include=productos`; el campo extra es inofensivo y evita una segunda
  // lectura sólo por la forma de la clave.
  sembrar(queryKeys.public.promociones({ incluirProductos: true }), data.promociones);
  sembrar(queryKeys.public.promociones(), data.promociones);
};

export default sembrarBootstrap;
