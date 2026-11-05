/**
 * Propósito: punto de entrada único de los hooks de TanStack Query.
 * Uso: import { useProductos, usePedidosQuery } from '../hooks/queries';
 */

export { queryKeys } from './queryKeys';
export { ApiError, desenvolver, esCancelacion } from './helpers';
export { useBootstrap } from './useBootstrap';
export {
  useCategoria,
  useCategorias,
  useMasVendidos,
  useParametrosQuery,
  usePersonalizacionProducto,
  useProducto,
  useProductos,
  useProductosDePromocion,
  usePromocion,
  usePromociones,
  useSucursalesQuery,
} from './useCatalogo';
export {
  useElegiblesParaResenar,
  useEstadoResenaProducto,
  useMisResenasQuery,
  useResenasProducto,
} from './useResenas';
export {
  usePedidosQuery,
  usePerfilQuery,
  useDireccionesQuery,
  useSucursalesCandidatasQuery,
} from './usePrivados';
export {
  useAdministradoresQuery,
  useClientesQuery,
  useElementoPersonalizacionQuery,
  useElementosPersonalizacionQuery,
  useInsumosQuery,
  usePlantillaPersonalizacionQuery,
  usePlantillasPersonalizacionQuery,
  usePlantillasTodasQuery,
  useReportesQuery,
  useResumenClienteQuery,
  useResumenSuperadminQuery,
  useStockQuery,
} from './useGestion';
