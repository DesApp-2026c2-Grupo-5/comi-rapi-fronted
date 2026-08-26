/**
 * Propósito: Página de detalle de un pedido usando Card, Table y Badge de Bootstrap.
 * Contenido: Componente DetallePedido con datos mock.
 * Dependencias: react-bootstrap (Container, Card, Table, Badge, Button), react-router-dom, seedData.js.
 * Uso: Ruta "/cliente/pedido/:id" → <DetallePedido />
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button } from 'react-bootstrap';
import { pedidosMock } from '../../services/seedData';

const getBadgeVariant = (estado) => {
  switch (estado) {
    case 'Pendiente': return 'warning';
    case 'Confirmado': return 'success';
    case 'Entregado': return 'info';
    default: return 'secondary';
  }
};

const DetallePedido = () => {
  const { id } = useParams();
  const pedido = pedidosMock.find((p) => p.id === Number(id));

  if (!pedido) {
    return (
      <Container className="py-5 text-center">
        <h2>Pedido no encontrado</h2>
        <p className="text-muted">No se encontró el pedido con ID #{id}</p>
        <Link to="/cliente/mis-pedidos">
          <Button variant="danger">Volver a Mis Pedidos</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Link to="/cliente/mis-pedidos" className="text-danger text-decoration-none mb-3 d-inline-block">
        ← Volver a Mis Pedidos
      </Link>

      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Pedido #{pedido.id}</h4>
          <Badge bg={getBadgeVariant(pedido.estado)} className="fs-6">{pedido.estado}</Badge>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6 mb-3">
              <h5>Cliente</h5>
              <p className="mb-0">{pedido.cliente.nombre}</p>
              <p className="text-muted">{pedido.cliente.email}</p>
            </div>
            <div className="col-md-6 mb-3">
              <h5>Sucursal</h5>
              <p>{pedido.sucursal}</p>
            </div>
          </div>

          <h5>Productos</h5>
          <Table striped bordered hover size="sm" className="mb-3">
            <thead className="table-dark">
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.productos.map((prod, idx) => (
                <tr key={idx}>
                  <td>{prod.nombre}</td>
                  <td>{prod.cantidad}</td>
                  <td>${prod.precio.toLocaleString('es-AR')}</td>
                  <td>${(prod.precio * prod.cantidad).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between fs-5 fw-bold border-top pt-3">
            <span>Total:</span>
            <span className="text-danger">${pedido.total.toLocaleString('es-AR')}</span>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DetallePedido;
