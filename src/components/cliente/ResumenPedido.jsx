/**
 * Propósito: Resumen del pedido con subtotal, envío, total y botón confirmar.
 * Contenido: Componente ResumenPedido usando Card y Button de Bootstrap.
 * Dependencias: react-bootstrap (Card, Button), useCarrito hook, formatters.js, ResumenPedido.css.
 * Uso: <ResumenPedido onConfirmar={handler} />
 *
 * CAMBIOS REALIZADOS:
 *  - Estilo alineado a Comi-Rapi: card redondeada con sombra suave, header naranja,
 *    filas de Subtotal/Envío/Total y botón rojo grande y redondeado "Confirmar Pedido".
 *  - Envío simulado (MOCK): gratis a partir de $10.000, $350 en caso contrario.
 */

import { Card, Button } from 'react-bootstrap';
import { useCarrito } from '../../hooks/useCarrito';
import { formatPrice } from '../../utils/formatters';
import './ResumenPedido.css';

const ResumenPedido = ({ onConfirmar }) => {
  const { items, total } = useCarrito();

  if (items.length === 0) return null;

  // MOCK - reemplazar por el cálculo real del envío cuando exista el backend.
  const costoEnvio = total >= 10000 ? 0 : 350;

  return (
    <Card className="resumen-card">
      <Card.Header as="h5" className="resumen-titulo">
        Resumen del Pedido
      </Card.Header>
      <Card.Body className="py-3">
        {/* Subtotal */}
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Subtotal</span>
          <strong>{formatPrice(total)}</strong>
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
          <strong className="resumen-total">{formatPrice(total + costoEnvio)}</strong>
        </div>
      </Card.Body>

      <Card.Body className="pt-0">
        <Button className="resumen-boton w-100" size="lg" onClick={onConfirmar}>
          Confirmar Pedido
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ResumenPedido;