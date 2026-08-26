/**
 * Propósito: Página de historial de pedidos usando Card y Badge de Bootstrap.
 * Contenido: Componente MisPedidos con lista de pedidos mock.
 * Dependencias: react-bootstrap (Container, Card, Badge, Button), seedData.js, react-router-dom.
 * Uso: Ruta "/cliente/mis-pedidos" → <MisPedidos />
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Badge, Button } from 'react-bootstrap';
import { pedidosMock } from '../../services/seedData';

const getBadgeVariant = (estado) => {
  switch (estado) {
    case 'Pendiente': return 'warning';
    case 'Confirmado': return 'success';
    case 'Entregado': return 'info';
    default: return 'secondary';
  }
};

const MisPedidos = () => {
  return (
    <Container className="py-4">
      <h1 className="mb-4">Mis Pedidos</h1>
      {pedidosMock.map((pedido) => (
        <Card key={pedido.id} className="mb-3 shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <strong>Pedido #{pedido.id}</strong>
            <Badge bg={getBadgeVariant(pedido.estado)}>{pedido.estado}</Badge>
          </Card.Header>
          <Card.Body>
            <p className="mb-1"><strong>Productos:</strong> {pedido.productos.map((p) => p.nombre).join(', ')}</p>
            <p className="mb-1"><strong>Total:</strong> ${pedido.total.toLocaleString('es-AR')}</p>
            <p className="mb-2"><strong>Sucursal:</strong> {pedido.sucursal}</p>
            <Link to={`/cliente/pedido/${pedido.id}`}>
              <Button variant="outline-secondary" size="sm">Ver detalle</Button>
            </Link>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default MisPedidos;
