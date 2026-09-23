/**
 * Propósito: Detalle de ítems de un pedido/carrito: nombre, cantidad, precio
 *            unitario, subtotal de línea y desglose de personalización cuando
 *            corresponda.
 * Contenido: Lista de ítems con el patrón .desglose del mockup, compartido por
 *            el resumen del cliente (ResumenPedido) y la vista admin
 *            (PedidosPendientes).
 * Dependencias: utils/formatters.js, DetalleItemsPedido.css.
 * Uso: <DetalleItemsPedido items={productos} />
 */

import { formatPrice } from '../../utils/formatters';
import './DetalleItemsPedido.css';

const DetalleItemsPedido = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={`detalle-items ${className}`.trim()}>
      {items.map((item, idx) => {
        const nombre = item.nombre || item.producto?.nombre;
        const cantidad = item.cantidad ?? 1;
        // Modo carrito: precioUnitarioPersonalizado (personalización aplicada);
        // modo lectura (pedido): precio unitario snapshot del backend.
        const precioUnitario =
          item.precioUnitarioPersonalizado ??
          item.precio ??
          item.producto?.precio ??
          0;
        const subtotalLinea = precioUnitario * cantidad;
        // Modo carrito: la personalización vive en item.personalizacion; modo
        // lectura llega aplanada en el propio ítem (extras/sin/etc.).
        const personalizacion =
          item.personalizacion ||
          (item.extras || item.sin || item.acompanamientos || item.condimentos
            ? {
                extras: item.extras || [],
                sin: item.sin || [],
                acompanamientos: item.acompanamientos || [],
                condimentos: item.condimentos || [],
              }
            : undefined);
        const tieneDesglose =
          (personalizacion?.extras?.length > 0) ||
          (personalizacion?.acompanamientos?.length > 0) ||
          (personalizacion?.sin?.length > 0) ||
          (personalizacion?.condimentos?.length > 0);
        return (
          <div key={item.idLinea || idx} className="resumen-item">
            <div className="d-flex justify-content-between align-items-baseline gap-2">
              <span className="resumen-item-nombre">
                {nombre} <span className="text-muted">x{cantidad}</span>
              </span>
              <span className="resumen-item-subtotal">
                {formatPrice(subtotalLinea)}
              </span>
            </div>
            <div className="resumen-item-precio text-muted">
              {formatPrice(precioUnitario)} c/u
            </div>
            {tieneDesglose && (
              <div className="resumen-desglose">
                {personalizacion.extras?.map((ex) => (
                  <div key={ex.id}>
                    › Extra: <strong>{ex.nombre}</strong> (+{formatPrice(ex.precio)}) x
                    {ex.cantidad}
                  </div>
                ))}
                {personalizacion.acompanamientos?.map((ac) => (
                  <div key={ac.id}>
                    › Acompañamiento: <strong>{ac.nombre}</strong> (+
                    {formatPrice(ac.precio)}) x{ac.cantidad}
                  </div>
                ))}
                {personalizacion.sin?.map((s, i) => (
                  <div key={i}>
                    › <strong>Sin {typeof s === 'string' ? s : s.nombre}</strong>
                  </div>
                ))}
                {personalizacion.condimentos?.map((c, i) => (
                  <div key={c.id || i}>
                    › {typeof c === 'string' ? c : c.nombre}
                    {c.cantidad ? ` x${c.cantidad}` : ''}{' '}
                    <span className="text-muted">(sin costo)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DetalleItemsPedido;
