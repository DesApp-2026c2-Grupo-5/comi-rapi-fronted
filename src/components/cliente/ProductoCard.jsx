/**
 * Propósito: Tarjeta de producto para el catálogo usando Card de Bootstrap.
 * Contenido: Componente ProductoCard con Card, Card.Img, Card.Body, Button.
 * Dependencias: react-bootstrap (Card, Button), useCarrito hook, formatters.js.
 * Uso: <ProductoCard producto={producto} />
 */

import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useCarrito } from '../../hooks/useCarrito';
import { formatPrice } from '../../utils/formatters';

const ProductoCard = ({ producto }) => {
  const { agregarAlCarrito } = useCarrito();

  const handleAgregar = () => {
    agregarAlCarrito(producto, 1);
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Img variant="top" src={producto.imagen} alt={producto.nombre} style={{ height: '180px', objectFit: 'cover' }} />
      <Card.Body className="d-flex flex-column">
        <Card.Title>{producto.nombre}</Card.Title>
        <Card.Text className="text-muted flex-grow-1">{producto.descripcion}</Card.Text>
        <Card.Text className="fw-bold text-danger fs-5">{formatPrice(producto.precio)}</Card.Text>
        <Button variant="danger" onClick={handleAgregar} className="w-100">
          Agregar al carrito
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ProductoCard;
