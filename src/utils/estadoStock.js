/**
 * Propósito: Clasificar una fila de stock según su disponibilidad y cantidad.
 * Contenido: ESTADOS_STOCK y estadoDeStock.
 * Dependencias: ninguna.
 * Uso: estadoDeStock(fila, parametros.stockCriticoUmbral)
 *
 * La pantalla de stock usa el mismo umbral que los reportes
 * (`stockCriticoUmbral`): un producto disponible con cantidad mayor a 0 y menor
 * o igual al umbral está en "bajo stock". Un producto apagado no es un faltante
 * de stock: es una decisión del administrador, por eso tiene su propio estado.
 */

export const ESTADOS_STOCK = Object.freeze({
  NO_DISPONIBLE: 'no-disponible',
  SIN_STOCK: 'sin-stock',
  BAJO_STOCK: 'bajo-stock',
  EN_STOCK: 'en-stock',
});

/**
 * Devuelve el estado de una fila de stock.
 *
 * Precedencia: no disponible > sin stock > bajo stock > en stock. Un umbral 0
 * (o inválido) desactiva "bajo stock", igual que en los reportes.
 *
 * @param {{cantidad?: number|string, disponible?: boolean}} fila
 * @param {number|string} umbral
 * @returns {string} Uno de ESTADOS_STOCK.
 */
export function estadoDeStock(fila, umbral) {
  if (!fila || !fila.disponible) return ESTADOS_STOCK.NO_DISPONIBLE;

  const cantidad = Number(fila.cantidad);
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return ESTADOS_STOCK.SIN_STOCK;
  }

  const limite = Number(umbral);
  if (Number.isFinite(limite) && limite > 0 && cantidad <= limite) {
    return ESTADOS_STOCK.BAJO_STOCK;
  }

  return ESTADOS_STOCK.EN_STOCK;
}
