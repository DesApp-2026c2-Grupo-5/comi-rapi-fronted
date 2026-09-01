/**
 * Propósito: Página de detalle de un pedido con datos, sucursal asignada y línea de tiempo
 *            de estados (historial completo).
 * Contenido: Componente DetallePedido con Card, Table, Badge y timeline vertical de estados.
 * Dependencias: react-bootstrap (Container, Card, Table, Badge, Button, Row, Col),
 *               react-router-dom, hooks/usePedidos, utils/constants.js, utils/formatters.js,
 *               DetallePedido.css.
 * Uso: Ruta "/cliente/pedido/:id" → <DetallePedido />
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, Row, Col } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import {
  ETIQUETAS_ESTADO_PEDIDO,
  VARIANTE_ESTADO_PEDIDO,
  COLOR_ESTADO_PEDIDO,
} from '../../utils/constants';
import { formatPrice, formatDate } from '../../utils/formatters';
import IconoEstado from '../../components/comunes/IconoEstado';
import './DetallePedido.css';

// Formatea fecha y hora (dd/mm/aaaa hh:mm)
const formatFechaHora = (fecha) => {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha));
};

const DetallePedido = () => {
  const { id } = useParams();
  const { pedidos } = usePedidos();
  const pedido = pedidos.find((p) => p.id === Number(id));

  if (!pedido) {
    return (
      <Container className="py-5 text-center">
        <h2 className="detalle-no-encontrado">Pedido no encontrado</h2>
        <p className="text-muted mb-4">No se encontró el pedido con ID #{id}</p>
        <Link to="/cliente/mis-pedidos">
          <Button className="boton-volver-btn">
          <FaArrowLeft className="me-1" aria-hidden="true" />
          Volver a Mis Pedidos
        </Button>
        </Link>
      </Container>
    );
  }

  const estadoLabel = ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado;

  return (
    <Container className="py-5">
      <Link to="/cliente/mis-pedidos" className="boton-volver mb-4">
        <span className="boton-volver-arrow" aria-hidden="true">←</span>
        Volver a Mis Pedidos
      </Link>

      <Card className="detalle-card">
        <Card.Header className="detalle-card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Pedido #{pedido.id}</h4>
          <Badge
            bg={VARIANTE_ESTADO_PEDIDO[pedido.estado] || 'secondary'}
            className="badge-estado fs-6 d-inline-flex align-items-center gap-1"
          >
            <IconoEstado estado={pedido.estado} size={16} />
            {estadoLabel}
          </Badge>
        </Card.Header>

        <Card.Body className="p-4">
          {/* Información del cliente y sucursal asignada */}
          <Row className="g-3 mb-4">
            <Col md={6}>
              <div className="detalle-info">
                <span className="detalle-etiqueta">Cliente</span>
                <p className="detalle-valor mb-0">{pedido.cliente}</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="detalle-info">
                <span className="detalle-etiqueta">Sucursal asignada</span>
                <p className="detalle-valor mb-0">{pedido.sucursal?.nombre || pedido.sucursal}</p>
                {pedido.sucursal?.direccion && (
                  <p className="detalle-valor-secundario mb-0">{pedido.sucursal.direccion}</p>
                )}
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
                  <td>{formatPrice(prod.precio)}</td>
                  <td>{formatPrice(prod.precio * prod.cantidad)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Total destacado */}
          <div className="detalle-total mt-4 mb-4">
            <span>Total</span>
            <span className="text-danger">{formatPrice(pedido.total)}</span>
          </div>

          {/* Línea de tiempo de estados */}
          <h5 className="detalle-tabla-titulo mb-3">Historial del pedido</h5>
          <div className="timeline">
            {(pedido.historialEstados || []).map((hist, idx) => (
              <div key={idx} className="timeline-item">
                <span className="timeline-punto">
                  <IconoEstado
                    estado={hist.estado}
                    size={18}
                    color={COLOR_ESTADO_PEDIDO[hist.estado]}
                  />
                </span>
                <div className="timeline-contenido">
                  <strong>{ETIQUETAS_ESTADO_PEDIDO[hist.estado] || hist.estado}</strong>
                  <span className="text-muted ms-2">{formatFechaHora(hist.fecha)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DetallePedido;