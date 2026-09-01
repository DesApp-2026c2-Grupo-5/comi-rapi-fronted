/**
 * Propósito: Vista detallada de un producto usando Card y Row/Col de Bootstrap.
 * Contenido: Componente ProductoDetalle.
 * Dependencias: react-bootstrap (Card, Button, Row, Col), useCarrito hook, formatters.js.
 * Uso: <ProductoDetalle producto={producto} />
 */

import React from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { FaCartPlus } from 'react-icons/fa';
import { useCarrito } from '../../hooks/useCarrito';
import { formatPrice } from '../../utils/formatters';

const ProductoDetalle = ({ producto }) => {
  const { agregarAlCarrito } = useCarrito();

  if (!producto) return null;

  const handleAgregar = () => {
    agregarAlCarrito(producto, 1);
  };

  return (
    <Card className="shadow-sm">
      <Row className="g-0">
        <Col md={5}>
          <Card.Img src={producto.imagen} alt={producto.nombre} style={{ height: '100%', objectFit: 'cover' }} />
        </Col>
        <Col md={7}>
          <Card.Body className="d-flex flex-column h-100">
            <Card.Title as="h2">{producto.nombre}</Card.Title>
            <Card.Text className="text-muted">Categoría: {producto.categoria}</Card.Text>
            <Card.Text className="flex-grow-1">{producto.descripcion}</Card.Text>
            <Card.Text className="fw-bold text-danger fs-3">{formatPrice(producto.precio)}</Card.Text>
            <div>
              <Button variant="primary" onClick={handleAgregar}>
                <FaCartPlus aria-hidden="true" />
                Agregar al carrito
              </Button>
            </div>
          </Card.Body>
        </Col>
      </Row>
    </Card>
  );
};

export default ProductoDetalle;
