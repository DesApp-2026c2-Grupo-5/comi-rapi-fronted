/**
 * Propósito: instancia única de TanStack Query para toda la aplicación.
 *
 * Contenido: QueryClient con la configuración base de la aplicación. Todas las
 * lecturas remotas pasan por los hooks de src/hooks/queries; este archivo sólo
 * define las políticas comunes (staleTime, gcTime, reintentos).
 *
 * Dependencias: @tanstack/react-query.
 * Uso: import { queryClient } from './queryClient';
 *
 * Notas:
 * - Se crea a nivel de módulo para que React StrictMode no genere dos
 *   instancias en desarrollo.
 * - Las claves de datos públicos deben empezar con ['public', ...] y las
 *   dependientes de la sesión con ['private', ...]. El logout sólo debe
 *   remover las segundas.
 * - Los queryFn deben lanzar un error cuando la capa api/ devuelva
 *   { success: false }; si no, TanStack Query lo interpreta como éxito.
 */

import { QueryClient } from '@tanstack/react-query';
import { TIEMPO_CACHE_QUERY_MS } from './utils/constants';

const MINUTO = 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Las consultas se consideran frescas 20 minutos: no se repiten al
      // navegar ni al volver a la pestaña. Los cambios reales invalidan la
      // caché por socket o por mutación. Las consultas que necesitan datos
      // siempre actuales sobreescriben este valor con staleTime 0.
      staleTime: TIEMPO_CACHE_QUERY_MS,
      // Tiempo que una query sin observadores se conserva en memoria.
      gcTime: 30 * MINUTO,
      // No reintentar errores de cliente (4xx); sí los de red o 5xx.
      retry: (failureCount, error) => {
        const status = error?.status;
        if (status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: (intento) => Math.min(1000 * 2 ** intento, 10 * 1000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Las mutaciones no se reintentan automáticamente: un POST/PATCH puede
      // haberse aplicado aunque la respuesta se pierda.
      retry: false,
    },
  },
});
