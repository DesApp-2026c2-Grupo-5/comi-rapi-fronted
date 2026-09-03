/**
 * Propósito: Página de detalle de un pedido con datos, sucursal asignada y stepper de
 *            estados (el mismo visual que usa el admin: iconos que se encienden/apagan).
 * Contenido: Componente DetallePedido con Card, Table, Badge y stepper horizontal de estados.
 * Dependencias: react-bootstrap (Container, Card, Table, Badge, Button, Row, Col),
 *               react-router-dom, hooks/usePedidos, utils/constants.js, utils/formatters.js,
 *               componentes/comunes/HistorialStepper, DetallePedido.css.
 * Uso: Ruta "/cliente/pedido/:id" → <DetallePedido />
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, Row, Col } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import { ETIQUETAS_ESTADO_PEDIDO, VARIANTE_ESTADO_PEDIDO } from '../../utils/constants';
import { formatPrice } from '../../utils/formatters';
import IconoEstado from '../../components/comunes/IconoEstado';
import HistorialStepper from '../../components/comunes/HistorialStepper';
import './DetallePedido.css';

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
              {pedido.productos.map((prod, idx) => {
                const tieneDesglose = (prod.extras && prod.extras.length > 0) || (prod.sin && prod.sin.length > 0) || (prod.acompanamientos && prod.acompanamientos.length > 0) || (prod.condimentos && prod.condimentos.length > 0);
                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td>{prod.nombre}</td>
                      <td>{prod.cantidad}</td>
                      <td>{formatPrice(prod.precio)}</td>
                      <td>{formatPrice(prod.precio * prod.cantidad)}</td>
                    </tr>
                    {tieneDesglose && (
                      <tr>
                        <td colSpan={4} className="small text-muted" style={{ background: '#fff8ef' }}>
                          {prod.extras?.map((ex) => (
                            <div key={ex.id}>› Extra: {ex.nombre} (+{formatPrice(ex.precio)}) x{ex.cantidad}</div>
                          ))}
                          {prod.acompanamientos?.map((ac) => (
                            <div key={ac.id}>› Acompañamiento: {ac.nombre} (+{formatPrice(ac.precio)}) x{ac.cantidad}</div>
                          ))}
                          {prod.sin?.map((s) => (
                            <div key={s}>› <strong>Sin {s}</strong></div>
                          ))}
                          {prod.condimentos?.map((c) => (
                            <div key={c.nombre}>› {c.nombre} x{c.cantidad} <span className="text-muted">(sin costo)</span></div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>

          {/* Total destacado */}
          <div className="detalle-total mt-4 mb-4">
            <span>Total</span>
            <span className="text-danger">{formatPrice(pedido.total)}</span>
          </div>

          {/* Stepper de estados (mismo visual que el admin) */}
          <div className="historial-box">
            <span className="historial-titulo">Progreso del pedido</span>
            <HistorialStepper pedido={pedido} />
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DetallePedido;