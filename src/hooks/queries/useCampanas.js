/**
 * Propósito: hooks de lectura y mutación de emisiones de cupones y cupones
 *            del SUPERADMINISTRADOR.
 * Contenido: useEmisionesQuery, useEmisionQuery, useEmisionCuponesQuery,
 *   useCuponesQuery, usePreviewDestinatariosQuery, useCuponesClienteQuery y sus
 *   mutaciones asociadas (useCrearEmision, useReenviarEmision,
 *   useCambiarActivoCupon).
 *   Tres fuentes independientes y sin solapamiento:
 *   - listado paginado de emisiones (datos básicos);
 *   - datos propios de cada emisión (configuración);
 *   - cupones complementarios de cada emisión (detalle).
 *   El listado puede sembrar la clave de datos propios de una emisión, porque
 *   contiene exactamente esa información. Los cupones sólo se piden cuando
 *   hacen falta y viven en su propia clave.
 * Dependencias: TanStack Query, api/cupones, queryKeys.
 * Uso: import { useEmisionesQuery, useCrearEmision } from '../hooks/queries';
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { desenvolver } from './helpers';
import {
  cambiarActivoCupon,
  crearEmision,
  cuponesEmiciones,
  obtenerCuponPorId,
  obtenerCupones,
  obtenerCuponesCliente,
  obtenerCuponesDeEmision,
  obtenerEmisionPorId,
  previewDestinatarios,
  reenviarEmision,
} from '../../api';

/**
 * Estas lecturas describen datos históricos: una emisión ya emitida no cambia
 * por navegar ni por enfocar la pestaña. Sólo se actualizan cuando una
 * mutación (o una invalidación explícita) lo pide. gcTime sigue liberando las
 * claves sin observadores, así que la memoria no crece sin límite.
 */
const CACHE_ESTABLE = Infinity;
const SIN_REFETCH = {
  staleTime: CACHE_ESTABLE,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};

/**
 * Busca una emisión entre las páginas del listado ya cargadas en caché.
 * El item del listado trae la configuración original (`configuracionSnapshot`)
 * y los totales: es suficiente para el detalle y para la reemisión.
 */
const buscarEmisionEnListaCache = (queryClient, id) => {
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) return null;
  const listas = queryClient.getQueriesData({
    queryKey: queryKeys.private.emisionesListaPrefix,
  });
  for (const [, datos] of listas) {
    const item = datos?.items?.find((e) => Number(e.id) === idNum);
    if (item) return item;
  }
  return null;
};

/** Devuelve los datos propios de una emisión disponibles en caché. */
export const buscarEmisionEnCache = (queryClient, id) => {
  const detalle = queryClient.getQueryData(queryKeys.private.emision(id));
  if (detalle && Number(detalle.id) === Number(id)) return detalle;
  return buscarEmisionEnListaCache(queryClient, id);
};

/** Lista de emisiones con filtros opcionales (clave normalizada por filtros/página). */
export const useEmisionesQuery = ({
  estado,
  desde,
  hasta,
  pagina = 1,
  limite = 20,
  enabled = true,
} = {}) =>
  useQuery({
    queryKey: queryKeys.private.emisionesLista({
      estado, desde, hasta, pagina, limite,
    }),
    queryFn: ({ signal }) =>
      cuponesEmiciones({ estado, desde, hasta, pagina, limite }, { signal }).then(
        desenvolver
      ),
    enabled,
    ...SIN_REFETCH,
  });

/**
 * Datos propios de una emisión (sin cupones). Si el listado ya los tiene, se
 * usan como `initialData`: la query nace fresca y no dispara su GET. Si no hay
 * nada en caché, el GET por ID es la única forma de obtenerlos.
 */
export const useEmisionQuery = ({ id, enabled = true } = {}) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.private.emision(id),
    queryFn: ({ signal }) => obtenerEmisionPorId(id, { signal }).then(desenvolver),
    enabled: enabled && Boolean(id),
    initialData: () => {
      if (!id || queryClient.getQueryData(queryKeys.private.emision(id))) {
        return undefined;
      }
      return buscarEmisionEnListaCache(queryClient, id) || undefined;
    },
    ...SIN_REFETCH,
  });
};

/**
 * Datos complementarios del detalle: cupones de la emisión, con cliente,
 * beneficio, vigencia, estado, envío, usos y nombres del alcance. Consulta
 * independiente de `useEmisionQuery` y con clave propia.
 */
export const useEmisionCuponesQuery = ({ id, enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.emisionCupones(id),
    queryFn: ({ signal }) =>
      obtenerCuponesDeEmision(id, { signal }).then(desenvolver),
    enabled: enabled && Boolean(id),
    ...SIN_REFETCH,
  });

/** Detalle individual de un cupón (cliente, estado envío, uso). */
export const useCuponQuery = ({ id, enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.cupon(id),
    queryFn: ({ signal }) => obtenerCuponPorId(id, { signal }).then(desenvolver),
    enabled: enabled && Boolean(id),
    ...SIN_REFETCH,
  });

/** Preview de destinatarios elegibles (sin emitir). Siempre se recalcula. */
export const usePreviewDestinatariosQuery = ({
  datos, enabled = true,
} = {}) =>
  useQuery({
    queryKey: ['private', 'cupones', 'preview', JSON.stringify(datos)],
    queryFn: ({ signal }) =>
      previewDestinatarios({ ...datos, signal }).then(desenvolver),
    enabled: enabled && Boolean(datos),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

/** Lista de cupones con filtros opcionales (emisionId, estado, activo, pagina, limite). */
export const useCuponesQuery = ({
  emisionId, estado, activo, pagina, limite, enabled = true,
} = {}) =>
  useQuery({
    queryKey: queryKeys.private.cupones({
      emisionId, estado, activo, pagina, limite,
    }),
    queryFn: ({ signal }) =>
      obtenerCupones(
        { emisionId, estado, activo, pagina, limite },
        { signal }
      ).then(desenvolver),
    enabled,
    ...SIN_REFETCH,
  });

/** Cupones del cliente autenticado (para "Mis cupones"). */
export const useCuponesClienteQuery = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.private.cuponesCliente,
    queryFn: ({ signal }) => obtenerCuponesCliente({ signal }).then(desenvolver),
    enabled,
    ...SIN_REFETCH,
  });

/* ------------------------------------------------------------------ */
/*                      Mutaciones (escritura)                        */
/* ------------------------------------------------------------------ */

export const useCrearEmision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos) => crearEmision(datos),
    // Una emisión nueva cambia la pertenencia al listado: sólo por eso se
    // invalidan las páginas del listado, no el resto de consultas.
    onSuccess: (resultado) => {
      if (resultado?.success === false) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.private.emisionesListaPrefix,
      });
    },
  });
};

export const useReenviarEmision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => reenviarEmision(id),
    onSuccess: (resultado, id) => {
      if (resultado?.success === false) return;
      const datos = resultado?.data || {};

      // Totales de ESA emisión: se escriben en el lugar, sin invalidar.
      const aplicarTotales = (actual) => {
        if (!actual || Number(actual.id) !== Number(id)) return actual;
        return {
          ...actual,
          cantidadEnviados:
            datos.emision?.cantidadEnviados ?? actual.cantidadEnviados,
          cantidadFallidos:
            datos.emision?.cantidadFallidos ?? actual.cantidadFallidos,
          cantidadCupones:
            datos.emision?.cantidadCupones ?? actual.cantidadCupones,
          estado: datos.emision?.estado ?? actual.estado,
          updatedAt: datos.emision?.updatedAt ?? actual.updatedAt,
        };
      };

      queryClient.setQueriesData(
        { queryKey: queryKeys.private.emisionesListaPrefix },
        (pagina) => {
          if (!pagina?.items) return pagina;
          return { ...pagina, items: pagina.items.map(aplicarTotales) };
        }
      );
      queryClient.setQueryData(queryKeys.private.emision(id), aplicarTotales);

      // Los estados de envío de los cupones sí cambiaron. Sólo se refresca la
      // clave de cupones de esta emisión, nunca el resto del árbol.
      queryClient.invalidateQueries({
        queryKey: queryKeys.private.emisionCupones(id),
      });
    },
  });
};

export const useCambiarActivoCupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }) => cambiarActivoCupon(id, activo),
    // Sólo cambia este cupón: se actualiza su detalle y toda copia suya que
    // viva en las listas de cupones de emisiones, sin invalidar nada más.
    onSuccess: (resultado, variables) => {
      const cupon = resultado?.data;
      if (!cupon) return;
      queryClient.setQueryData(queryKeys.private.cupon(variables.id), cupon);
      queryClient.setQueriesData(
        { queryKey: queryKeys.private.emisionesCuponesPrefix },
        (datos) => {
          if (!datos?.cupones?.some((c) => Number(c.id) === Number(cupon.id))) {
            return datos;
          }
          return {
            ...datos,
            cupones: datos.cupones.map((c) =>
              Number(c.id) === Number(cupon.id)
                ? {
                    ...c,
                    activo: cupon.activo,
                    estado: cupon.estado,
                    estadoEnvio: cupon.estadoEnvio ?? c.estadoEnvio,
                  }
                : c
            ),
          };
        }
      );
    },
  });
};
