/**
 * Propósito: Panel principal del admin con tarjetas resumen usando Card y Row/Col de Bootstrap.
 * Contenido: Componente PanelAdmin con 3 tarjetas de estadísticas.
 * Dependencias: react-bootstrap (Container, Row, Col, Card).
 * Uso: <PanelAdmin /> - Se renderiza en Dashboard.
 */

import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const PanelAdmin = () => {
  const tarjetas = [
    { titulo: 'Total de productos', valor: 12, variante: 'primary' },
    { titulo: 'Pedidos pendientes', valor: 5, variante: 'warning' },
    { titulo: 'Sucursales', valor: 3, variante: 'success' },
  ];

  return (
    <Container>
      <h2 className="mb-4">Panel de Administración</h2>
      <Row>
        {tarjetas.map((tarjeta, idx) => (
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
    </Container>
  );
};

export default PanelAdmin;
