/**
 * Propósito: Preview de promociones aplicables al carrito actual.
 * Carga las promociones activas con sus productos y estima el descuento
 * con utils/calculoPromociones (espejo del backend; el backend revalida).
 *
 * Las promociones viven en la caché pública de TanStack Query, así que abrir
 * el carrito después del catálogo no vuelve a pedirlas. Con el carrito vacío la
 * consulta queda deshabilitada (no hay descuento que calcular).
 *
 * Uso: const { descuentoTotal, promocionIds, promosAplicadas, cargandoPromos } = usePromocionesCarrito(items);
 */

import { useMemo } from 'react';
import { usePromociones } from './queries';
import { calcularDescuentoCarrito } from '../utils/calculoPromociones';

export const usePromocionesCarrito = (items) => {
  const hayItems = Array.isArray(items) && items.length > 0;
  const promocionesQuery = usePromociones({
    incluirProductos: true,
    enabled: hayItems,
  });

  // Se normaliza al shape que espera el cálculo: id/nombre/tipo/valor y la
  // lista de productos alcanzados. El backend la resuelve en la misma respuesta
  // (?include=productos), sin una llamada por promoción.
  const promos = useMemo(() => {
    if (!hayItems) return [];
    return (promocionesQuery.data || [])
      .filter((promo) => promo.activa !== false)
      .map((promo) => ({
        id: promo.id,
        nombre: promo.nombre,
        tipo: promo.tipo,
        valor: Number(promo.valor),
        productoIds: (Array.isArray(promo.productos) ? promo.productos : []).map(
          (producto) => producto.id
        ),
      }));
  }, [hayItems, promocionesQuery.data]);

  const preview = useMemo(
    () => calcularDescuentoCarrito(items, promos),
    [items, promos]
  );

  const nombresPorId = useMemo(
    () => new Map(promos.map((promo) => [promo.id, promo])),
    [promos]
  );

  const promosAplicadas = useMemo(
    () =>
      preview.porPromocion.map((item) => ({
        ...item,
        nombre: nombresPorId.get(item.promocionId)?.nombre || 'Promoción',
        tipo: nombresPorId.get(item.promocionId)?.tipo,
      })),
    [preview, nombresPorId]
  );

  return {
    descuentoTotal: preview.descuentoTotal,
    promocionIds: preview.promocionIds,
    promosAplicadas,
    cargandoPromos: hayItems && promocionesQuery.isLoading,
  };
};
