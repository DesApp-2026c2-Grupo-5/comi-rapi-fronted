/**
 * Propósito: Panel principal del admin con resumen real de pedidos: tarjetas de
 *            totales (en curso, entregados, cancelados) y un desglose de cuántos
 *            pedidos hay en cada estado, leyendo el contexto de pedidos.
 * Contenido: Componente PanelAdmin con Card y Row/Col de Bootstrap. Los pedidos
 *            PENDIENTE no se muestran (el admin maneja CONFIRMADO en adelante).
 * Dependencias: react-bootstrap (Container, Row, Col, Card, Badge, Alert),
 *               react-router-dom (useNavigate), hooks/usePedidos, utils/constants.
 * Uso: <PanelAdmin /> - Se renderiza en Dashboard.
 */

import React from 'react';
import { Container, Row, Col, Card, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { usePedidos } from '../../hooks/usePedidos';
import {
  ESTADOS_PEDIDO,
  ETIQUETAS_ESTADO_PEDIDO,
  VARIANTE_ESTADO_PEDIDO,
} from '../../utils/constants';

// Estados que gestiona el admin (PENDIENTE queda fuera por decisión de producto)
const ESTADOS_ADMIN = [
  ESTADOS_PEDIDO.CONFIRMADO,
  ESTADOS_PEDIDO.EN_PREPARACION,
  ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR,
  ESTADOS_PEDIDO.EN_CAMINO,
  ESTADOS_PEDIDO.ENTREGADO,
  ESTADOS_PEDIDO.CANCELADO,
];

const ESTADOS_FINALES = [ESTADOS_PEDIDO.ENTREGADO, ESTADOS_PEDIDO.CANCELADO];

const PanelAdmin = () => {
  const { pedidos } = usePedidos();
  const navigate = useNavigate();

  const contar = (estado) => pedidos.filter((p) => p.estado === estado).length;
  const enCurso = ESTADOS_ADMIN.filter((e) => !ESTADOS_FINALES.includes(e)).reduce(
    (total, estado) => total + contar(estado),
    0
  );
  const entregados = contar(ESTADOS_PEDIDO.ENTREGADO);
  const cancelados = contar(ESTADOS_PEDIDO.CANCELADO);

  const resumen = [
    { titulo: 'Pedidos en curso', valor: enCurso, variante: 'warning' },
    { titulo: 'Pedidos entregados', valor: entregados, variante: 'success' },
    { titulo: 'Pedidos cancelados', valor: cancelados, variante: 'danger' },
  ];

  return (
    <Container>
      <h2 className="mb-4">Panel de Administración</h2>

      <Row>
        {resumen.map((tarjeta, idx) => (
          <Col md={4} key={idx} className="mb-3">
            <Card className="text-center shadow-sm h-100">
              <Card.Body>
                <Card.Title className="text-muted">{tarjeta.titulo}</Card.Title>
                <Card.Text className={`display-6 fw-bold text-${tarjeta.variante}`}>
                  {tarjeta.valor}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 my-4">
        <h3 className="mb-0">Pedidos por estado</h3>
        <a
          href="#"
          className="small text-decoration-none fw-semibold"
          onClick={(e) => {
            e.preventDefault();
            navigate('/admin/pedidos');
          }}
        >
          Ver todos
        </a>
      </div>

      {pedidos.length === 0 ? (
        <Alert variant="light">No hay pedidos todavía.</Alert>
      ) : (
        <Row>
          {ESTADOS_ADMIN.map((estado) => {
            const cantidad = contar(estado);
            return (
              <Col xs={6} md={4} lg={2} key={estado} className="mb-3">
                <Card
                  className="panel-admin-estado shadow-sm h-100"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/admin/pedidos?estado=${estado}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/admin/pedidos?estado=${estado}`);
                    }
                  }}
                >
                  <Card.Body className="text-center d-flex flex-column align-items-center justify-content-center">
                    <span className="display-6 fw-bold">{cantidad}</span>
                    <Badge
                      bg={VARIANTE_ESTADO_PEDIDO[estado] || 'secondary'}
                      className="mt-1 text-uppercase"
                    >
                      {ETIQUETAS_ESTADO_PEDIDO[estado] || estado}
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
};

export default PanelAdmin;