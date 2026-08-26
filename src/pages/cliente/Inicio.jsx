/**
 * Propósito: Página de inicio del cliente con bienvenida y botón al catálogo.
 * Contenido: Componente Inicio con Container y Button de Bootstrap.
 * Dependencias: react-bootstrap (Container, Button), react-router-dom (Link).
 * Uso: Ruta "/cliente/inicio" → <Inicio />
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';

const Inicio = () => {
  return (
    <Container className="text-center py-5">
      <h1 className="display-4 text-danger mb-4">Bienvenido a Comi-Rapi</h1>
      <p className="lead text-muted mb-4">
        Tu comida favorita, rápida y deliciosa. Explora nuestro catálogo y hacé tu pedido ahora.
      </p>
      <Link to="/cliente/catalogo">
        <Button variant="danger" size="lg">Ir al Catálogo</Button>
      </Link>
    </Container>
  );
};

export default Inicio;
