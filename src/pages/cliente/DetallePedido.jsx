/**
 * Propósito: Página de detalle de un pedido usando Card, Table y Badge de Bootstrap.
 * Contenido: Componente DetallePedido con datos mock.
 * Dependencias: react-bootstrap (Container, Card, Table, Badge, Button, Row, Col),
 *               react-router-dom, seedData.js, DetallePedido.css.
 * Uso: Ruta "/cliente/pedido/:id" → <DetallePedido />
 *
 * CAMBIOS REALIZADOS (solo visuales, la lógica y los datos no se tocaron):
 *  - Card con bordes más redondeados y sombra suave, header naranja con título bold.
 *  - Badge de estado convertido en pill con estilo mejorado.
 *  - Boxes de información de Cliente y Sucursal con fondo claro y etiquetas.
 *  - Tabla más limpia (header oscuro, sin bordes pesados, hover sutil).
 *  - Botón "Volver a Mis Pedidos" más visual (pill con borde naranja y arrow).
 *  - Total destacado en rojo dentro de un box naranja claro.
 *  - Espaciado más generoso y layout responsive (Row/Col).
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, Row, Col } from 'react-bootstrap';
import { pedidosMock } from '../../services/seedData';
import './DetallePedido.css';

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
        <h2 className="detalle-no-encontrado">Pedido no encontrado</h2>
        <p className="text-muted mb-4">No se encontró el pedido con ID #{id}</p>
        <Link to="/cliente/mis-pedidos">
          <Button className="boton-volver-btn">Volver a Mis Pedidos</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Link to="/cliente/mis-pedidos" className="boton-volver mb-4">
        <span className="boton-volver-arrow" aria-hidden="true">←</span>
        Volver a Mis Pedidos
      </Link>

      <Card className="detalle-card">
        <Card.Header className="detalle-card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Pedido #{pedido.id}</h4>
          <Badge bg={getBadgeVariant(pedido.estado)} className="badge-estado fs-6">
            {pedido.estado}
          </Badge>
        </Card.Header>

        <Card.Body className="p-4">
          {/* Información del cliente y sucursal */}
          <Row className="g-3 mb-4">
            <Col md={6}>
              <div className="detalle-info">
                <span className="detalle-etiqueta">Cliente</span>
                <p className="detalle-valor mb-0">{pedido.cliente.nombre}</p>
                <p className="detalle-valor-secundario mb-0">{pedido.cliente.email}</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="detalle-info">
                <span className="detalle-etiqueta">Sucursal</span>
                <p className="detalle-valor mb-0">{pedido.sucursal}</p>
              </div>
            </Col>
          </Row>

          <h5 className="detalle-tabla-titulo mb-3">Productos</h5>

          {/* Tabla de productos */}
          <Table hover responsive className="detalle-tabla">
            <thead>
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

          {/* Total destacado */}
          <div className="detalle-total mt-4">
            <span>Total</span>
            <span className="text-danger">${pedido.total.toLocaleString('es-AR')}</span>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DetallePedido;