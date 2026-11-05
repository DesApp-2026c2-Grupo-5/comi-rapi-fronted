/**
 * Propósito: puente único entre el canal de tiempo real y la caché de
 *            TanStack Query.
 * Contenido: componente RealtimeBridge (sin render propio) que se suscribe a
 *            los avisos de catálogo, parámetros y stock, e invalida las claves
 *            afectadas para que las pantallas vuelvan a leer por REST.
 * Dependencias: React, @tanstack/react-query, useAuth, useSucursalOperativa,
 *               hooks/queries (queryKeys), services/socket.
 * Uso: <RealtimeBridge /> dentro de AppLayout, una sola vez en la app.
 *
 * El socket es SOLO un aviso: no trae datos. Acá no se lee nada ni se guarda
 * estado; sólo se marca como viejo lo que cambió para que la próxima lectura
 * (o la que esté activa) consulte la API, que sigue siendo la fuente de verdad.
 *
 * `pedido_actualizado` NO se escucha en este componente: PedidoContext ya lo
 * maneja (refresca la lista, rearma rooms y dispara las notificaciones). Tener
 * dos listeners duplicaría lecturas y avisos.
 *
 * Los avisos de catálogo, parámetros y stock se invalidan acá; la caché
 * artesanal anterior ya no existe.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useSucursalOperativa } from '../../hooks/useSucursalOperativa';
import { queryKeys } from '../../hooks/queries';
import {
  alReconectar,
  conectarSocket,
  EVENTOS_SOCKET,
} from '../../services/socket';

/**
 * Marca como viejas las claves del catálogo. No se invalida el snapshot de
 * bootstrap: es una semilla que sólo llena claves vacías y cada clave real ya
 * quedó invalidada por su cuenta.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
const invalidarCatalogo = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ['public', 'productos'] });
  queryClient.invalidateQueries({ queryKey: ['public', 'categorias'] });
  queryClient.invalidateQueries({ queryKey: ['public', 'promociones'] });
  queryClient.invalidateQueries({ queryKey: ['public', 'personalizacion'] });
};

/**
 * Invalida todo lo que depende de los parámetros de negocio.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
const invalidarParametros = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.public.parametros });
};

/**
 * Invalida el stock de la sucursal operativa (árbol privado).
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
const invalidarStock = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.private.stock });
};

/**
 * Componente sin UI: mantiene los listeners del socket atados al ciclo de vida
 * de la sesión.
 * @returns {null} No renderiza nada.
 */
const RealtimeBridge = () => {
  const queryClient = useQueryClient();
  const { user, hydrated } = useAuth();
  const { versionSocket } = useSucursalOperativa();

  const emailSesion = user?.email;
  const haySesion = hydrated && Boolean(emailSesion);

  useEffect(() => {
    // Sin sesión el handshake del socket se rechaza: no hay canal que escuchar.
    if (!haySesion) return undefined;

    const instancia = conectarSocket();
    if (!instancia) return undefined;

    const alCambiarCatalogo = () => invalidarCatalogo(queryClient);
    const alCambiarParametros = () => invalidarParametros(queryClient);
    const alCambiarStock = () => invalidarStock(queryClient);

    instancia.on(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alCambiarCatalogo);
    instancia.on(EVENTOS_SOCKET.PARAMETROS_ACTUALIZADOS, alCambiarParametros);
    instancia.on(EVENTOS_SOCKET.STOCK_ACTUALIZADO, alCambiarStock);

    // Una reconexión pudo perder avisos mientras el canal estaba caído: se
    // invalida todo lo que este puente vigila para resincronizar por REST.
    const desregistrarReconexion = alReconectar(instancia, () => {
      invalidarCatalogo(queryClient);
      invalidarParametros(queryClient);
      invalidarStock(queryClient);
    });

    return () => {
      desregistrarReconexion();
      instancia.off(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alCambiarCatalogo);
      instancia.off(EVENTOS_SOCKET.PARAMETROS_ACTUALIZADOS, alCambiarParametros);
      instancia.off(EVENTOS_SOCKET.STOCK_ACTUALIZADO, alCambiarStock);
    };
    // `versionSocket` cambia cuando el superadmin elige/limpia su sucursal de
    // contexto: el socket se recrea con otra sesión y hay que registrar los
    // listeners sobre la instancia nueva.
  }, [haySesion, queryClient, versionSocket]);

  return null;
};

export default RealtimeBridge;
