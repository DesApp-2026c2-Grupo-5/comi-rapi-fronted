/**
 * Propósito: Resumen del pedido antes de confirmar usando Card y ListGroup de Bootstrap.
 * Contenido: Componente ResumenPedido con items, total y botón confirmar.
 * Dependencias: react-bootstrap (Card, ListGroup, Button), useCarrito hook, formatters.js.
 * Uso: <ResumenPedido onConfirmar={handler} />
 */

import React from 'react';
import { Card, ListGroup, Button } from 'react-bootstrap';
import { useCarrito } from '../../hooks/useCarrito';
import { formatPrice } from '../../utils/formatters';

const ResumenPedido = ({ onConfirmar }) => {
  const { items, total } = useCarrito();

  if (items.length === 0) return null;

  return (
    <Card className="mt-4 shadow-sm">
      <Card.Header as="h5">Resumen del Pedido</Card.Header>
      <ListGroup variant="flush">
        {items.map((item) => (
          <ListGroup.Item key={item.producto.id} className="d-flex justify-content-between">
            <span>{item.producto.nombre} x{item.cantidad}</span>
            <strong>{formatPrice(item.producto.precio * item.cantidad)}</strong>
          </ListGroup.Item>
        ))}
        <ListGroup.Item className="d-flex justify-content-between fs-5 fw-bold">
          <span>Total:</span>
          <span className="text-danger">{formatPrice(total)}</span>
        </ListGroup.Item>
      </ListGroup>
      <Card.Body>
        <Button variant="danger" size="lg" className="w-100" onClick={onConfirmar}>
          Confirmar pedido
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ResumenPedido;
