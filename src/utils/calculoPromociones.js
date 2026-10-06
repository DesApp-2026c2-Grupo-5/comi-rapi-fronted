/**
 * Propósito: Preview de descuentos en el carrito (espejo del backend
 * lib/services/promociones.js). Ambos deben aplicar las mismas reglas
 * (docs/promociones.md): el backend es fuente de verdad, esto es solo
 * estimación para mostrar antes de confirmar.
 *
 * - DESCUENTO_PORCENTUAL: `valor`% sobre el subtotal de las líneas alcanzadas.
 * - DOS_POR_UNO: por producto alcanzado, floor(cantidad / 2) unidades gratis
 *   al precio unitario personalizado. `valor` se ignora.
 * - Si varias promociones alcanzan la misma línea, gana la de mayor descuento.
 * - Un combo (producto.tipo === 'COMBO') nunca se descuenta: su precio ya es la
 *   promoción respecto de sus componentes.
 *
 * Entrada:
 *   lineas: líneas del carrito [{ producto: { id, tipo? }, cantidad,
 *             precioUnitarioPersonalizado?, producto.precio? }]
 *   promos: [{ id, tipo, valor, productoIds: [ids alcanzados] }]
 * Salida:
 *   { descuentoTotal, porPromocion: [{ promocionId, descuento }],
 *     promocionIds: [ids con descuento > 0] }
 */

function precioUnitarioDe(linea) {
  const personalizado = Number(linea?.precioUnitarioPersonalizado);
  if (!Number.isNaN(personalizado) && personalizado >= 0) return personalizado;
  return Number(linea?.producto?.precio ?? 0);
}

function descuentoLinea(linea, promo, precioUnitario, cantidad) {
  // El combo es la promoción: nunca baja de precio, aunque una promoción
  // alcance a su producto o a alguno de sus componentes.
  if (linea?.producto?.tipo === 'COMBO') return 0;
  const alcanzada = (promo.productoIds || []).some(
    (id) => String(id) === String(linea?.producto?.id)
  );
  if (!alcanzada) return 0;
  const tope = precioUnitario * cantidad;
  if (promo.tipo === 'DOS_POR_UNO') {
    return Math.min(Math.floor(cantidad / 2) * precioUnitario, tope);
  }
  if (promo.tipo === 'DESCUENTO_PORCENTUAL') {
    const tasa = Number(promo.valor);
    if (Number.isNaN(tasa) || tasa <= 0) return 0;
    return Math.min(precioUnitario * cantidad * (tasa / 100), tope);
  }
  return 0;
}

export function calcularDescuentoCarrito(lineas, promos) {
  const lista = Array.isArray(lineas) ? lineas : [];
  const promociones = Array.isArray(promos) ? promos : [];
  const mejorPorLinea = new Map();

  lista.forEach((linea, indice) => {
    const cantidad = Number(linea?.cantidad);
    const precioUnitario = precioUnitarioDe(linea);
    if (!Number.isInteger(cantidad) || cantidad <= 0) return;
    if (Number.isNaN(precioUnitario) || precioUnitario < 0) return;
    let mejor = null;
    for (const promo of promociones) {
      const descuento = descuentoLinea(linea, promo, precioUnitario, cantidad);
      if (descuento > 0 && (!mejor || descuento > mejor.descuento)) {
        mejor = { promocionId: promo.id, descuento };
      }
    }
    if (mejor) mejorPorLinea.set(indice, mejor);
  });

  const porPromo = new Map();
  for (const { promocionId, descuento } of mejorPorLinea.values()) {
    porPromo.set(promocionId, (porPromo.get(promocionId) || 0) + descuento);
  }
  const porPromocion = [...porPromo.entries()].map(([promocionId, descuento]) => ({
    promocionId,
    descuento,
  }));
  return {
    descuentoTotal: porPromocion.reduce((acc, item) => acc + item.descuento, 0),
    porPromocion,
    promocionIds: porPromocion.map((item) => item.promocionId),
  };
}
