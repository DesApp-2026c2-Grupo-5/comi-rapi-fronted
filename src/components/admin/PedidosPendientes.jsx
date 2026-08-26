/**
 * Propósito: Lista de pedidos pendientes usando Card y Badge de Bootstrap.
 * Contenido: Componente PedidosPendientes con cards de pedidos y botón confirmar.
 * Dependencias: react-bootstrap (Card, Badge, Button, Container, ListGroup), seedData.js.
 * Uso: <PedidosPendientes /> - Se renderiza en GestionPedidos.
 */

import React from 'react';
import { Card, Badge, Button, Container, ListGroup } from 'react-bootstrap';
import { pedidosMock } from '../../services/seedData';

const PedidosPendientes = () => {
  const handleConfirmar = (pedidoId) => {
    alert(`Pedido #${pedidoId} confirmado (simulado).`);
  };

  const getBadgeVariant = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'warning';
      case 'Confirmado': return 'success';
      case 'Entregado': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <Container>
      <h2 className="mb-4">Gestión de Pedidos</h2>
      {pedidosMock.map((pedido) => (
        <Card key={pedido.id} className="mb-3 shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <strong>Pedido #{pedido.id}</strong>
            <Badge bg={getBadgeVariant(pedido.estado)}>{pedido.estado}</Badge>
          </Card.Header>
          <Card.Body>
            <p className="mb-1"><strong>Cliente:</strong> {pedido.cliente.nombre} ({pedido.cliente.email})</p>
            <p className="mb-1"><strong>Sucursal:</strong> {pedido.sucursal}</p>
            <p className="mb-2"><strong>Productos:</strong></p>
            <ListGroup variant="flush" className="mb-2">
              {pedido.productos.map((prod, idx) => (
                <ListGroup.Item key={idx} className="px-0 py-1">
                  {prod.nombre} x{prod.cantidad} - ${prod.precio}
                </ListGroup.Item>
              ))}
            </ListGroup>
            <p className="fw-bold text-danger mb-2">Total: ${pedido.total.toLocaleString('es-AR')}</p>
            <Button variant="danger" onClick={() => handleConfirmar(pedido.id)}>
              Confirmar pedido
            </Button>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default PedidosPendientes;
