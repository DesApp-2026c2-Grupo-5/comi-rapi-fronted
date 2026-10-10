/**
 * Propósito: Lógica compartida para Repetir pedido (80) con repetición exacta.
 * - Bloquea (todo o nada) si falta un producto o una personalización dada de baja.
 * - Si todo existe, deja repetir con precios vigentes y avisa cambios de precio.
 * - Suma al carrito existente (no reemplaza); el storage se actualiza solo.
 * Uso: const { repitiendoId, pedidoARepetir, vistaPrevia, noRepetible, ... } = useRepetirPedido();
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from './useCarrito';
import { useNotificaciones } from './useNotificaciones';
import { obtenerProductos } from '../api/productos';
import { apiGet } from '../api/client';
import { mapearPedidoACarrito } from '../utils/repetirPedidoMapper.js';

async function cargarPersonalizacionVigente(productoIds) {
  const entradas = await Promise.all(
    productoIds.map(async (id) => {
      try {
        const res = await apiGet(`/personalizacion?productoId=${id}`);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          return [String(id), res.data];
        }
      } catch {
        // fail-open: sin datos vigentes no se bloquea por personalización
      }
      return [String(id), null];
    })
  );
  const mapa = new Map();
  for (const [id, lista] of entradas) {
    if (lista) mapa.set(id, lista);
  }
  return mapa.size > 0 ? mapa : null;
}

export const useRepetirPedido = () => {
  const { agregarAlCarrito } = useCarrito();
  const { notificar } = useNotificaciones();
  const navigate = useNavigate();
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
        const resCatalogo = await obtenerProductos();
        if (!resCatalogo.success) {
          setVistaPrevia({ cargando: false, cambiosPrecio: [], totalAntes: 0, totalAhora: 0 });
          return;
        }
        const ids = (pedido?.productos || [])
          .map((p) => p?.productoId)
          .filter((v) => v !== undefined && v !== null);
        const mapaPers = await cargarPersonalizacionVigente(ids);
        const preview = mapearPedidoACarrito(pedido, resCatalogo.data, mapaPers);
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
    []
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
      const resCatalogo = await obtenerProductos();
      if (!resCatalogo.success) {
        notificar('No se pudo verificar la disponibilidad actual.', 'danger');
        return;
      }
      const ids = (pedidoARepetir?.productos || [])
        .map((p) => p?.productoId)
        .filter((v) => v !== undefined && v !== null);
      const mapaPers = await cargarPersonalizacionVigente(ids);
      const { puedeRepetir, lineas, faltantes } = mapearPedidoACarrito(
        pedidoARepetir,
        resCatalogo.data,
        mapaPers
      );
      if (!puedeRepetir) {
        setNoRepetible({ pedido: pedidoARepetir, faltantes });
        setPedidoARepetir(null);
        return;
      }
      lineas.forEach((linea) => {
        agregarAlCarrito(linea.producto, linea.cantidad, linea.personalizacion);
      });
      setPedidoARepetir(null);
      setVistaPrevia({ cargando: false, cambiosPrecio: [], totalAntes: 0, totalAhora: 0 });
      navigate('/cliente/carrito');
    } finally {
      setRepitiendoId(null);
    }
  }, [pedidoARepetir, agregarAlCarrito, notificar, navigate]);

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
