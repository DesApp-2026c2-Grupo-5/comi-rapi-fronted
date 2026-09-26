/**
 * Propósito: Resumen del pedido con subtotal, envío, total, botón confirmar
 *            y (opcional) la sucursal asignada al pedido.
 * Contenido: Componente ResumenPedido usando Card y Button de Bootstrap.
 * Dependencias: react-bootstrap (Card, Button), useCarrito hook, formatters.js, ResumenPedido.css.
 * Uso:
 *   En el carrito: <ResumenPedido onConfirmar={handler} />
   *   En la confirmación: <ResumenPedido items={productos} total={total} costoEnvio={costoEnvio} sucursal={sucursal} />
   *
   * CAMBIOS REALIZADOS:
   *  - El componente ahora acepta props opcionales (items, total, costoEnvio, sucursal). Si no se pasan,
   *    usa los datos del carrito (comportamiento original del carrito).
   *  - Modo lectura: el total recibido del backend ya incluye el envío → usa la prop costoEnvio
   *    y muestra Subtotal = total - costoEnvio. No recalcula el envío del servicio.
   *  - Si se recibe 'sucursal', muestra un bloque destacado con la sucursal asignada.
  *  - Si no se pasa 'onConfirmar', no se renderiza el botón (modo solo lectura).
 *  - 'botonTexto' permite cambiar la etiqueta del botón (ej.: "Ir a Pagar" en el carrito).
 *  - Detalle de ítems dentro de la card: nombre, cantidad, precio unitario, subtotal
 *    de línea y desglose de personalización (patrón .desglose del mockup), en ambos modos.
 *  - Envío simulado (MOCK): gratis a partir de $10.000, $350 en caso contrario.
 */

import { Card, Button } from 'react-bootstrap';
import { FaCheckCircle } from 'react-icons/fa';
import { useCarrito } from '../../hooks/useCarrito';
import { formatPrice } from '../../utils/formatters';
import { calcularCostoEnvio } from '../../services/envio';
import { formatearDireccion } from '../../utils/direccion';
import DetalleItemsPedido from '../comunes/DetalleItemsPedido';
import './ResumenPedido.css';

const ResumenPedido = ({
  onConfirmar,
  items: itemsProp,
  total: totalProp,
  costoEnvio: costoEnvioProp,
  sucursal,
  botonTexto = 'Confirmar Pedido',
}) => {
  const { items, total } = useCarrito();

  // Prioriza los datos recibidos por props (modo confirmación/lectura) sobre los del carrito.
  const productos = itemsProp || items;
  const montoTotal = totalProp ?? total;

  if (productos.length === 0) return null;

  // Modo lectura (total del pedido): usa el costoEnvio recibido por prop; el
  // total del backend ya incluye el envío. Modo carrito: recalcula el envío
  // según las reglas del servicio (MOCK - backend lo calculará).
  const enModoLectura = totalProp !== undefined;
  const costoEnvio = enModoLectura
    ? costoEnvioProp ?? 0
    : calcularCostoEnvio(montoTotal);
  const subtotal = enModoLectura ? montoTotal - costoEnvio : montoTotal;
  const totalFinal = enModoLectura ? montoTotal : montoTotal + costoEnvio;

  return (
    <Card className="resumen-card">
      <Card.Header as="h5" className="resumen-titulo">
        Resumen del Pedido
      </Card.Header>
      <Card.Body className="py-3">
        {/* Detalle de ítems (compartido con la vista admin; válido en ambos modos) */}
        <div className="resumen-items mb-2">
          <DetalleItemsPedido items={productos} />
        </div>

        {/* Subtotal */}
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Subtotal</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>

        {/* Envío */}
        <div className="d-flex justify-content-between mb-3">
          <span className="text-muted">Envío</span>
          {costoEnvio === 0 ? (
            <strong className="text-success">Gratis</strong>
          ) : (
            <strong>{formatPrice(costoEnvio)}</strong>
          )}
        </div>

        <hr className="resumen-divisor" />

        {/* Total */}
        <div className="d-flex justify-content-between align-items-center">
          <strong>Total</strong>
          <strong className="resumen-total">{formatPrice(totalFinal)}</strong>
        </div>

        {/* Sucursal asignada (visible al confirmar el pedido) */}
        {sucursal && (
          <div className="mt-3 p-3" style={{ backgroundColor: '#fff8ef', border: '2px solid #ffe9c9', borderRadius: '12px' }}>
            <span className="d-block text-uppercase fw-bold text-warning" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>
              Sucursal asignada
            </span>
            <strong className="d-block">{sucursal.nombre}</strong>
            <span className="text-muted">{formatearDireccion(sucursal.direccion)}</span>
          </div>
        )}
      </Card.Body>

      {onConfirmar && (
        <Card.Body className="pt-0">
          <Button className="resumen-boton w-100" size="lg" onClick={onConfirmar}>
            <FaCheckCircle aria-hidden="true" />
            {botonTexto}
          </Button>
        </Card.Body>
      )}
    </Card>
  );
};

export default ResumenPedido;