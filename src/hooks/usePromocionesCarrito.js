/**
 * Propósito: Preview de promociones aplicables al carrito actual.
 * Carga las promociones activas con sus productos y estima el descuento
 * con utils/calculoPromociones (espejo del backend; el backend revalida).
 * Uso: const { descuentoTotal, promocionIds, promosAplicadas, cargandoPromos } = usePromocionesCarrito(items);
 */

import { useState, useEffect, useMemo } from 'react';
import {
  obtenerPromociones,
  obtenerProductosDePromocion,
} from '../api/promociones';
import { calcularDescuentoCarrito } from '../utils/calculoPromociones';

export const usePromocionesCarrito = (items) => {
  const [promos, setPromos] = useState([]);
  const [cargandoPromos, setCargandoPromos] = useState(true);

  useEffect(() => {
    let vivo = true;
    (async () => {
      setCargandoPromos(true);
      try {
        const res = await obtenerPromociones();
        if (!vivo || !res.success) return;
        const activas = (res.data || []).filter((p) => p.activa !== false);
        const conProductos = await Promise.all(
          activas.map(async (promo) => {
            const r = await obtenerProductosDePromocion(promo.id);
            return {
              id: promo.id,
              nombre: promo.nombre,
              tipo: promo.tipo,
              valor: Number(promo.valor),
              productoIds: r.success
                ? (r.data || []).map((producto) => producto.id)
                : [],
            };
          })
        );
        if (vivo) setPromos(conProductos);
      } finally {
        if (vivo) setCargandoPromos(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

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
    cargandoPromos,
  };
};
