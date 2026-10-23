/**
 * Helpers de cálculo de precio de personalización.
 *
 * El catálogo de opciones por categoría ya no vive acá: ahora se configura
 * desde el panel (PersonalizacionCategorias) y el fallback del cliente lo
 * resuelve PersonalizacionContext contra la base de datos.
 */

export function calcularPrecioPersonalizado(
  precioBase,
  extras,
  acompanamientos,
  cantidad = 1
) {
  const extraTotal = extras.reduce((s, e) => s + e.precio * e.cantidad, 0);
  const acompTotal = acompanamientos.reduce(
    (s, e) => s + e.precio * e.cantidad,
    0
  );
  return (precioBase + extraTotal + acompTotal) * cantidad;
}

export function calcularPrecioUnitario(
  precioBase,
  extras,
  acompanamientos
) {
  const extraTotal = extras.reduce((s, e) => s + e.precio * e.cantidad, 0);
  const acompTotal = acompanamientos.reduce(
    (s, e) => s + e.precio * e.cantidad,
    0
  );
  return precioBase + extraTotal + acompTotal;
}
