/**
 * Propósito: Resumen del pedido con subtotal, envío, total, botón confirmar
 *            y (opcional) la sucursal asignada al pedido.
 * Contenido: Componente ResumenPedido usando Card y Button de Bootstrap.
 * Dependencias: react-bootstrap (Card, Button), useCarrito hook, formatters.js, ResumenPedido.css.
 * Uso:
 *   En el carrito: <ResumenPedido onConfirmar={handler} />
 *   En la confirmación: <ResumenPedido items={productos} total={total} sucursal={sucursal} />
 *
 * CAMBIOS REALIZADOS:
 *  - El componente ahora acepta props opcionales (items, total, sucursal). Si no se pasan,
 *    usa los datos del carrito (comportamiento original del carrito).
 *  - Si se recibe 'sucursal', muestra un bloque destacado con la sucursal asignada.
 *  - Si no se pasa 'onConfirmar', no se renderiza el botón (modo solo lectura).
 *  - Envío simulado (MOCK): gratis a partir de $10.000, $350 en caso contrario.
 */

import { Card, Button } from 'react-bootstrap';
import { FaCheckCircle } from 'react-icons/fa';
import { useCarrito } from '../../hooks/useCarrito';
import { formatPrice } from '../../utils/formatters';
import './ResumenPedido.css';

const ResumenPedido = ({ onConfirmar, items: itemsProp, total: totalProp, sucursal }) => {
  const { items, total } = useCarrito();

  // Prioriza los datos recibidos por props (modo confirmación/lectura) sobre los del carrito.
  const productos = itemsProp || items;
  const montoTotal = totalProp ?? total;

  if (productos.length === 0) return null;

  // MOCK - reemplazar por el cálculo real del envío cuando exista el backend.
  const costoEnvio = montoTotal >= 10000 ? 0 : 350;

  return (
    <Card className="resumen-card">
      <Card.Header as="h5" className="resumen-titulo">
        Resumen del Pedido
      </Card.Header>
      <Card.Body className="py-3">
        {/* Subtotal */}
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Subtotal</span>
          <strong>{formatPrice(montoTotal)}</strong>
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
          <strong className="resumen-total">{formatPrice(montoTotal + costoEnvio)}</strong>
        </div>

        {/* Sucursal asignada (visible al confirmar el pedido) */}
        {sucursal && (
          <div className="mt-3 p-3" style={{ backgroundColor: '#fff8ef', border: '2px solid #ffe9c9', borderRadius: '12px' }}>
            <span className="d-block text-uppercase fw-bold text-warning" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>
              Sucursal asignada
            </span>
            <strong className="d-block">{sucursal.nombre}</strong>
            <span className="text-muted">{sucursal.direccion}</span>
          </div>
        )}
      </Card.Body>

      {onConfirmar && (
        <Card.Body className="pt-0">
          <Button className="resumen-boton w-100" size="lg" onClick={onConfirmar}>
            <FaCheckCircle aria-hidden="true" />
            Confirmar Pedido
          </Button>
        </Card.Body>
      )}
    </Card>
  );
};

export default ResumenPedido;