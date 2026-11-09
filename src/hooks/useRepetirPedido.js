/**
 * Propósito: Lógica compartida para Repetir pedido (80) con repetición exacta.
 * - Bloquea (todo o nada) si falta un producto o una personalización dada de baja.
 * - Si todo existe, deja repetir con precios vigentes y avisa cambios de precio.
 * - Suma al carrito existente (no reemplaza); el storage se actualiza solo.
 *
 * Catálogo y personalización se leen con queryClient.fetchQuery: comparten la
 * caché de las pantallas y se deduplican. La personalización se pide UNA vez
 * (sin productoId) y se agrupa por producto, en vez de una llamada por ítem.
 *
 * Uso: const { repitiendoId, pedidoARepetir, vistaPrevia, noRepetible, ... } = useRepetirPedido();
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCarrito } from './useCarrito';
import { useNotificaciones } from './useNotificaciones';
import { TIEMPO_CACHE_QUERY_MS } from '../utils/constants';
import { queryKeys } from './queries/queryKeys';
import { fetchPersonalizacion, fetchProductos } from './queries/fetchers';
import { mapearPedidoACarrito } from '../utils/repetirPedidoMapper.js';

async function cargarCatalogoVigente(queryClient) {
  return queryClient.fetchQuery({
    queryKey: queryKeys.public.productos({}),
    queryFn: ({ signal }) => fetchProductos({ signal }),
    staleTime: TIEMPO_CACHE_QUERY_MS,
  });
}

async function cargarPersonalizacionVigente(queryClient, productoIds) {
  const ids = new Set(productoIds.map((id) => String(id)));
  if (ids.size === 0) return null;
  try {
    const elementos = await queryClient.fetchQuery({
      queryKey: queryKeys.public.personalizacion(null),
      queryFn: ({ signal }) => fetchPersonalizacion({ signal }),
      staleTime: TIEMPO_CACHE_QUERY_MS,
    });
    const mapa = new Map();
    (elementos || []).forEach((elemento) => {
      const clave = String(elemento.productoId);
      if (!ids.has(clave)) return;
      const lista = mapa.get(clave) || [];
      lista.push(elemento);
      mapa.set(clave, lista);
    });
    return mapa.size > 0 ? mapa : null;
  } catch {
    // fail-open: sin datos vigentes no se bloquea por personalización
    return null;
  }
}

export const useRepetirPedido = () => {
  const { agregarAlCarrito } = useCarrito();
  const { notificar } = useNotificaciones();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [repitiendoId, setRepitiendoId] = useState(null);
  const [pedidoARepetir, setPedidoARepetir] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState({
    cargando: false,
    cambiosPrecio: [],
    totalAntes: 0,
    totalAhora: 0,
  });
  const [noRepetible, setNoRepetible] = useState(null);

  const pedirRepeticion = useCallback(
    async (pedido) => {
      setPedidoARepetir(pedido);
      setNoRepetible(null);
      setVistaPrevia({ cargando: true, cambiosPrecio: [], totalAntes: 0, totalAhora: 0 });
      try {
        const catalogo = await cargarCatalogoVigente(queryClient);
        const ids = (pedido?.productos || [])
          .map((p) => p?.productoId)
          .filter((v) => v !== undefined && v !== null);
        const mapaPers = await cargarPersonalizacionVigente(queryClient, ids);
        const preview = mapearPedidoACarrito(pedido, catalogo, mapaPers);
        if (!preview.puedeRepetir) {
          setNoRepetible({ pedido, faltantes: preview.faltantes });
          setPedidoARepetir(null);
          setVistaPrevia({ cargando: false, cambiosPrecio: [], totalAntes: 0, totalAhora: 0 });
          return;
        }
        setVistaPrevia({
          cargando: false,
          cambiosPrecio: preview.cambiosPrecio,
          totalAntes: preview.totalAntes,
          totalAhora: preview.totalAhora,
        });
      } catch {
        setVistaPrevia({ cargando: false, cambiosPrecio: [], totalAntes: 0, totalAhora: 0 });
      }
    },
    [queryClient]
  );

  const cancelarRepeticion = useCallback(() => {
    setPedidoARepetir(null);
    setVistaPrevia({ cargando: false, cambiosPrecio: [], totalAntes: 0, totalAhora: 0 });
  }, []);

  const cerrarAviso = useCallback(() => {
    setNoRepetible(null);
  }, []);

  const confirmarRepeticion = useCallback(async () => {
    if (!pedidoARepetir) return;
    setRepitiendoId(pedidoARepetir.id);
    try {
      const catalogo = await cargarCatalogoVigente(queryClient);
      const ids = (pedidoARepetir?.productos || [])
        .map((p) => p?.productoId)
        .filter((v) => v !== undefined && v !== null);
      const mapaPers = await cargarPersonalizacionVigente(queryClient, ids);
      const { puedeRepetir, lineas, faltantes } = mapearPedidoACarrito(
        pedidoARepetir,
        catalogo,
        mapaPers
      );
      if (!puedeRepetir) {
        setNoRepetible({ pedido: pedidoARepetir, faltantes });
        setPedidoARepetir(null);
        return;
      }
      lineas.forEach((linea) => {
        agregarAlCarrito(linea.producto, linea.cantidad, linea.personalizacion, linea.nota);
      });
      setPedidoARepetir(null);
      setVistaPrevia({ cargando: false, cambiosPrecio: [], totalAntes: 0, totalAhora: 0 });
      navigate('/cliente/carrito');
    } catch {
      notificar('No se pudo verificar la disponibilidad actual.', 'danger');
    } finally {
      setRepitiendoId(null);
    }
  }, [pedidoARepetir, agregarAlCarrito, notificar, navigate, queryClient]);

  return {
    repitiendoId,
    pedidoARepetir,
    vistaPrevia,
    noRepetible,
    pedirRepeticion,
    cancelarRepeticion,
    cerrarAviso,
    confirmarRepeticion,
  };
};
