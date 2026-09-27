/**
 * Propósito: Mensajes compartidos para Repetir pedido (80).
 * - Confirmar: incluye aviso de precios nuevos cuando cambian.
 * - No repetible: incluye productos o personalizaciones faltantes.
 */

export function mensajeConfirmarRepetir(pedidoARepetir, vistaPrevia, formatPrice) {
  if (!pedidoARepetir) return '';
  const base = `¿Repetir el pedido #${pedidoARepetir.id}? Se sumarán sus productos con personalización a tu carrito actual a precio vigente.`;
  if (!vistaPrevia || vistaPrevia.cargando) {
    return `${base} Verificando precios actuales...`;
  }
  const cambios = Array.isArray(vistaPrevia.cambiosPrecio) ? vistaPrevia.cambiosPrecio : [];
  if (cambios.length === 0) {
    return `${base} Los precios están iguales.`;
  }
  const detalle = cambios
    .map((c) => `${c.nombre}: ${formatPrice(c.antes)} → ${formatPrice(c.ahora)}`)
    .join('; ');
  return `${base} Precios nuevos: ${detalle}. Total estimado: ${formatPrice(vistaPrevia.totalAntes)} → ${formatPrice(vistaPrevia.totalAhora)}.`;
}

export function mensajeNoRepetible(noRepetible) {
  if (!noRepetible) return '';
  return `El pedido no puede ser repetido porque faltan productos o personalizaciones: ${noRepetible.faltantes.join(', ')}.`;
}
