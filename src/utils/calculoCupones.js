/**
 * Propósito: estimar en el cliente el descuento de un cupón con el mismo
 * criterio que lib/services/cupones.js del backend (el backend es la autoridad
 * al crear y confirmar el pedido).
 *
 * Reglas que se replican (docs/emisiones-cupones.md):
 * - `alcanceSnapshot.global === true`: todo el carrito (cupones históricos).
 * - Con alcance: la compra mínima y la base se calculan sólo sobre las líneas
 *   alcanzadas (`productoIdsResueltos`, que ya incluye la expansión de
 *   categorías hecha al emitir).
 * - Las promociones se descuentan primero; el cupón aplica sobre el resto.
 * - El total se limita por `descuentoMaximo` y nunca supera la base.
 *
 * Uso:
 *   const calculo = calcularDescuentoCupon(items, descuentosPromoPorLinea, cupon);
 *   calculo.monto            // descuento total estimado
 *   calculo.porLinea.get(k)  // parte que le toca a cada línea alcanzada
 */

const redondear = (valor) => Math.round(Number(valor) * 100) / 100;

const numeroNoNegativo = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
};

const idsValidos = (valor) =>
  (Array.isArray(valor) ? valor : [])
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);

/** Clave de línea: la misma que usan el carrito y las promociones. */
export const claveLinea = (item) =>
  String(item?.idLinea ?? item?.producto?.id ?? '');

const subtotalDeLinea = (item) => {
  const unitario = Number(
    item?.precioUnitarioPersonalizado ?? item?.producto?.precio ?? 0
  );
  const cantidad = Number(item?.cantidad) || 0;
  if (!Number.isFinite(unitario) || unitario < 0) return 0;
  return redondear(unitario * cantidad);
};

/**
 * Indica si el cupón alcanza al producto, según su `alcanceSnapshot`.
 *
 * El backend considera alcanzada toda línea cuando el snapshot no resolvió
 * productos ni categorías (alcance vacío); se replica para no mostrar un
 * carrito que el backend sí aceptaría.
 */
export const cuponAlcanzaProducto = (cupon, producto) => {
  const alcance = cupon?.alcanceSnapshot;
  if (!alcance || alcance.global === true) return true;

  const resueltos = idsValidos(alcance.productoIdsResueltos);
  const categorias = idsValidos(alcance.categoriaIds);
  const explicitos = idsValidos(alcance.productoIds);
  if (resueltos.length === 0 && categorias.length === 0) return true;

  const productoId = Number(producto?.id);
  const categoriaId = Number(producto?.categoriaId);
  return (
    resueltos.includes(productoId) ||
    explicitos.includes(productoId) ||
    categorias.includes(categoriaId)
  );
};

const resultadoVacio = () => ({
  alcanza: false,
  motivo: null,
  subtotalAlcanzado: 0,
  descuentoPromocionAlcanzado: 0,
  baseCalculo: 0,
  monto: 0,
  minimo: 0,
  porLinea: new Map(),
});

/**
 * Calcula el descuento del cupón sobre el carrito y su reparto por línea.
 *
 * @param {Array<object>} items - Líneas del carrito.
 * @param {Map<string, number>} descuentosPromoPorLinea - Descuento de promoción
 *   por clave de línea (el mismo que muestra cada tarjeta).
 * @param {object} cupon - Cupón del cliente con `alcanceSnapshot`.
 * @returns {{
 *   alcanza: boolean,
 *   motivo: null|'sin_alcance'|'compra_minima'|'sin_descuento',
 *   subtotalAlcanzado: number,
 *   descuentoPromocionAlcanzado: number,
 *   baseCalculo: number,
 *   monto: number,
 *   minimo: number,
 *   porLinea: Map<string, number>
 * }}
 */
export function calcularDescuentoCupon(
  items,
  descuentosPromoPorLinea,
  cupon
) {
  const lista = Array.isArray(items) ? items : [];
  const alcanzadas = lista
    .map((item) => ({ item, clave: claveLinea(item) }))
    .filter(({ item }) => cuponAlcanzaProducto(cupon, item.producto));

  const descuentoPromoDe = (clave) =>
    numeroNoNegativo(descuentosPromoPorLinea?.get(clave));

  const subtotalAlcanzado = redondear(
    alcanzadas.reduce((suma, { item }) => suma + subtotalDeLinea(item), 0)
  );
  const descuentoPromocionAlcanzado = redondear(
    alcanzadas.reduce((suma, { clave }) => suma + descuentoPromoDe(clave), 0)
  );
  const minimo = numeroNoNegativo(cupon?.compraMinima);

  const vacio = {
    ...resultadoVacio(),
    alcanza: alcanzadas.length > 0,
    subtotalAlcanzado,
    descuentoPromocionAlcanzado,
    minimo,
  };

  if (alcanzadas.length === 0) {
    return { ...vacio, motivo: 'sin_alcance' };
  }

  const baseCalculo = redondear(
    Math.max(0, subtotalAlcanzado - descuentoPromocionAlcanzado)
  );

  // Misma comparación que el backend: la compra mínima se mide sobre el
  // subtotal alcanzado antes de promociones y del propio cupón.
  if (subtotalAlcanzado < minimo) {
    return { ...vacio, baseCalculo, motivo: 'compra_minima' };
  }

  let calculado = 0;
  if (cupon?.tipoDescuento === 'PORCENTAJE') {
    calculado = baseCalculo * (numeroNoNegativo(cupon.valorDescuento) / 100);
  } else if (cupon?.tipoDescuento === 'MONTO_FIJO') {
    calculado = numeroNoNegativo(cupon.valorDescuento);
  }

  const tope =
    cupon?.descuentoMaximo === null || cupon?.descuentoMaximo === undefined
      ? Infinity
      : numeroNoNegativo(cupon.descuentoMaximo);
  const monto = redondear(Math.min(Math.max(0, calculado), tope, baseCalculo));

  /* Reparto proporcional a la base de cada línea alcanzada (subtotal menos la
     promoción de esa línea). La suma de las partes es exactamente `monto`, así
     la tarjeta puede tachar su precio y el resumen del pedido cierra igual. */
  const porLinea = new Map();
  if (monto > 0) {
    const bases = alcanzadas.map(({ item, clave }) => ({
      clave,
      base: Math.max(0, redondear(subtotalDeLinea(item) - descuentoPromoDe(clave))),
    }));
    const totalBase = bases.reduce((suma, { base }) => suma + base, 0);

    if (totalBase > 0) {
      let asignado = 0;
      bases.forEach(({ clave, base }, indice) => {
        const restante = redondear(monto - asignado);
        const esUltima = indice === bases.length - 1;
        const parte = esUltima
          ? Math.max(0, restante)
          : Math.min(
              redondear((monto * base) / totalBase),
              Math.max(0, restante)
            );
        asignado = redondear(asignado + parte);
        if (parte > 0) porLinea.set(clave, parte);
      });
    }
  }

  return {
    ...vacio,
    baseCalculo,
    monto,
    motivo: monto > 0 ? null : 'sin_descuento',
    porLinea,
  };
}
