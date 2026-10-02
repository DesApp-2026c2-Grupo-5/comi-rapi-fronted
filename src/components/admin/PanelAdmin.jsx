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
import { Link } from 'react-router-dom';
import { usePedidos } from '../../hooks/usePedidos';
import {
  ESTADOS_PEDIDO,
  ESTADOS_ACTIVOS_PEDIDO,
  ETIQUETAS_ESTADO_PEDIDO,
  VARIANTE_ESTADO_PEDIDO,
} from '../../utils/constants';

// Tarjetas por estado, en el mismo orden que los filtros de "Pedidos".
const ESTADOS_ADMIN = [
  ...ESTADOS_ACTIVOS_PEDIDO,
  ESTADOS_PEDIDO.ENTREGADO,
  ESTADOS_PEDIDO.CANCELADO,
];

const PanelAdmin = () => {
  const { pedidos } = usePedidos();

  const contar = (estado) => pedidos.filter((p) => p.estado === estado).length;
  const enCurso = ESTADOS_ACTIVOS_PEDIDO.reduce(
    (total, estado) => total + contar(estado),
    0
  );
  const entregados = contar(ESTADOS_PEDIDO.ENTREGADO);
  const cancelados = contar(ESTADOS_PEDIDO.CANCELADO);

  // Cada resumen lleva a "Pedidos" con su filtro ya aplicado: en curso abre la
  // vista de Activos (sin ?estado), los otros dos filtran por su estado.
  const resumen = [
    {
      titulo: 'Pedidos en curso',
      valor: enCurso,
      variante: 'warning',
      destino: '/admin/pedidos',
    },
    {
      titulo: 'Pedidos entregados',
      valor: entregados,
      variante: 'success',
      destino: `/admin/pedidos?estado=${ESTADOS_PEDIDO.ENTREGADO}`,
    },
    {
      titulo: 'Pedidos cancelados',
      valor: cancelados,
      variante: 'danger',
      destino: `/admin/pedidos?estado=${ESTADOS_PEDIDO.CANCELADO}`,
    },
  ];

  return (
    <Container>
      {/* h1 y no h2: el Dashboard no aporta ningún encabezado propio, así que
          esta es la etiqueta principal de la página. */}
      <h1 className="mb-4">Panel de Administración</h1>

      <Row>
        {resumen.map((tarjeta) => (
          <Col md={4} key={tarjeta.titulo} className="mb-3">
            {/* Las tarjetas navegaban con `role="button"` + onClick + onKeyDown
                sobre un <div>:Eso obliga a reimplementar a mano lo que un <a>
                ya hace (Enter, Espacio, foco, menú contextual, abrir en pestaña
                nueva) y deja el destino invisible para el lector de pantalla.
                Ahora son enlaces reales con la apariencia de tarjeta. */}
            <Card as={Link} to={tarjeta.destino} className="text-center shadow-sm h-100 panel-admin-estado">
              <Card.Body>
                <Card.Title as="h2" className="h6 text-muted">
                  {tarjeta.titulo}
                </Card.Title>
                <Card.Text className={`display-6 fw-bold text-${tarjeta.variante}`}>
                  {tarjeta.valor}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 my-4">
        <h2 className="h4 mb-0">Pedidos por estado</h2>
        {/* Antes era <a href="#" onClick={preventDefault}>: un enlace que no
            lleva a ningún lado y que al abrirlo en otra pestaña no hacía nada. */}
        <Link to="/admin/pedidos" className="small text-decoration-none fw-semibold">
          Ver todos
        </Link>
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
                  as={Link}
                  to={`/admin/pedidos?estado=${estado}`}
                  className="panel-admin-estado shadow-sm h-100"
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