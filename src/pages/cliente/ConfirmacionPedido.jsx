/**
 * Propósito: Página de confirmación de pedido exitoso usando Card y Alert de Bootstrap.
 * Contenido: Componente ConfirmacionPedido con mensaje de éxito.
 * Dependencias: react-bootstrap (Container, Card, Button, Badge), react-router-dom (Link).
 * Uso: Ruta "/cliente/confirmacion" → <ConfirmacionPedido />
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Badge } from 'react-bootstrap';

const ConfirmacionPedido = () => {
  const numeroPedido = `#${Date.now()}`;

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <Card className="text-center shadow" style={{ width: '100%', maxWidth: '450px' }}>
        <Card.Body className="p-5">
          <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
            style={{ width: '70px', height: '70px', fontSize: '2rem' }}>
            ✓
          </div>
          <h1 className="h3 mb-3">¡Pedido confirmado!</h1>
          <p><strong>Número de pedido:</strong> {numeroPedido}</p>
          <p><strong>Estado:</strong> <Badge bg="success">Confirmado</Badge></p>
          <Link to="/cliente/inicio">
            <Button variant="danger" className="mt-3">Volver al inicio</Button>
          </Link>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ConfirmacionPedido;
