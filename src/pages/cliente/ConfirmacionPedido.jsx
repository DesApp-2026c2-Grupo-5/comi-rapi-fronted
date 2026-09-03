/**
 * Propósito: Página de confirmación de pedido exitoso que muestra la sucursal asignada
 *            automáticamente y el estado del pedido.
 * Contenido: Componente ConfirmacionPedido con check grande, número de pedido, sucursal asignada,
 *            estado actual y resumen de productos.
 * Dependencias: react-bootstrap (Container, Card, Button, Badge), react-router-dom (Link),
 *               hooks/usePedidos, components/cliente/ResumenPedido, utils/formatters.js.
 * Uso: Ruta "/cliente/confirmacion" → <ConfirmacionPedido />
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaUtensils, FaReceipt } from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import { ETIQUETAS_ESTADO_PEDIDO } from '../../utils/constants';
import { IconoCheck } from '../../components/comunes/IconoEstado';
import ResumenPedido from '../../components/cliente/ResumenPedido';
import { formatDate, formatPrice } from '../../utils/formatters';

const ConfirmacionPedido = () => {
  const { pedidoActual } = usePedidos();

  // Si no hay un pedido reciente (p. ej. al recargar la página), mostrar aviso
  if (!pedidoActual) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Card className="text-center shadow" style={{ width: '100%', maxWidth: '450px' }}>
          <Card.Body className="p-5">
            <h1 className="h4 mb-3">No hay un pedido reciente</h1>
            <Link to="/cliente/catalogo">
              <Button variant="primary" className="mt-3">
                  <FaUtensils aria-hidden="true" />
                  Ir al catálogo
                </Button>
            </Link>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const estadoLabel = ETIQUETAS_ESTADO_PEDIDO[pedidoActual.estado] || pedidoActual.estado;
  const { sucursal } = pedidoActual;

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={7}>
          {/* Mensaje de éxito */}
          <Card className="text-center shadow mb-4">
            <Card.Body className="p-5">
              <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                style={{ width: '70px', height: '70px' }}>
                <IconoCheck size={34} />
              </div>
              <h1 className="h3 mb-2">¡Pedido confirmado!</h1>
              <p className="text-muted mb-0">
                <strong>Número de pedido:</strong> #{pedidoActual.id}
              </p>
              <p className="text-muted mb-0">
                <strong>Fecha:</strong> {formatDate(pedidoActual.fecha)}
              </p>
              <p className="mb-0">
                <strong>Estado:</strong>{' '}
                <Badge bg="success">{estadoLabel}</Badge>
              </p>

              {/* Sucursal asignada automáticamente */}
              {sucursal && (
                <div className="mt-4 p-3 text-start"
                  style={{ backgroundColor: '#fff8ef', border: '2px solid #ffe9c9', borderRadius: '12px' }}>
                  <span className="d-block text-uppercase fw-bold text-warning" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>
                    Tu pedido será preparado en
                  </span>
                  <strong className="d-block fs-5">{sucursal.nombre}</strong>
                  <span className="text-muted">{sucursal.direccion}</span>
                </div>
              )}

              {/* Dirección de entrega usada */}
              {pedidoActual.direccion && (
                <div className="mt-3 p-3 text-start"
                  style={{ backgroundColor: '#fff8ef', border: '2px solid #ffe9c9', borderRadius: '12px' }}>
                  <span className="d-block text-uppercase fw-bold text-warning" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>
                    Entregamos en
                  </span>
                  <strong className="d-block fs-5">{pedidoActual.direccion.nombre}</strong>
                  <span className="text-muted d-block">{pedidoActual.direccion.direccion}</span>
                  {pedidoActual.direccion.ciudad && (
                    <span className="text-muted d-block">
                      {pedidoActual.direccion.ciudad}
                      {pedidoActual.direccion.codigoPostal ? ` - CP ${pedidoActual.direccion.codigoPostal}` : ''}
                    </span>
                  )}
                  {pedidoActual.direccion.referencia && (
                    <span className="text-muted d-block">Ref: {pedidoActual.direccion.referencia}</span>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Desglose de productos con personalización */}
          {pedidoActual.productos.some((p) => p.extras?.length || p.sin?.length || p.acompanamientos?.length || p.condimentos?.length) && (
            <div className="card shadow-sm mb-3">
              <div className="card-body">
                {pedidoActual.productos.map((p, idx) => (
                  <div key={idx} className={idx < pedidoActual.productos.length - 1 ? 'mb-3 pb-3 border-bottom' : ''}>
                    <div className="fw-bold small">{p.nombre} x{p.cantidad}</div>
                    {p.extras?.map((ex) => (
                      <div key={ex.id} className="small text-muted">› Extra: {ex.nombre} (+{formatPrice(ex.precio)}) x{ex.cantidad}</div>
                    ))}
                    {p.acompanamientos?.map((ac) => (
                      <div key={ac.id} className="small text-muted">› Acompañamiento: {ac.nombre} (+{formatPrice(ac.precio)}) x{ac.cantidad}</div>
                    ))}
                    {p.sin?.map((s) => (
                      <div key={s} className="small text-muted">› <strong>Sin {s}</strong></div>
                    ))}
                    {p.condimentos?.map((c) => (
                      <div key={c.nombre} className="small text-muted">› {c.nombre} x{c.cantidad} <span className="text-muted">(sin costo)</span></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumen de productos */}
          <ResumenPedido
            items={pedidoActual.productos}
            total={pedidoActual.total}
            sucursal={sucursal}
          />

          <div className="text-center mt-4">
            <Link to="/cliente/mis-pedidos">
              <Button variant="primary" size="lg" className="rounded-pill px-4">
                <FaReceipt aria-hidden="true" />
                Ver mis pedidos
              </Button>
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ConfirmacionPedido;