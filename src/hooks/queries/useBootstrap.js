/**
 * Propósito: precarga del snapshot público (GET /api/public/bootstrap).
 *
 * El backend devuelve en una sola respuesta los parámetros, las categorías
 * activas, los productos base, los más vendidos del día y las promociones
 * activas con sus productos.
 *
 * `main.jsx` intenta esta misma consulta antes del primer render. Cuando lo
 * logra, las pantallas encuentran la caché sembrada y no repiten los GET de
 * catálogo. Este hook queda como respaldo: si la precarga falla, tarda más que
 * la espera máxima o la app entra por una ruta de administración (donde el
 * snapshot está deshabilitado), sigue alimentando la caché cuando el snapshot
 * llegue.
 *
 * Es una optimización opcional: no bloquea el render y, si la petición falla,
 * cada pantalla sigue haciendo su propio GET como siempre.
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { opcionesBootstrap, sembrarBootstrap } from './bootstrap';

export const useBootstrap = ({ enabled = true } = {}) => {
  const queryClient = useQueryClient();
  const query = useQuery({ ...opcionesBootstrap, enabled });

  const { data } = query;

  useEffect(() => {
    if (!data) return;
    sembrarBootstrap(queryClient, data);
  }, [data, queryClient]);

  return query;
};

export default useBootstrap;
