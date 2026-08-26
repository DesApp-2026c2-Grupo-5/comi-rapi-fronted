/**
 * Propósito: Componente de pie de página con información de copyright.
 * Contenido: Componente Footer con texto de copyright usando Bootstrap.
 * Dependencias: react-bootstrap (Container).
 * Uso: <Footer /> - Se renderiza al final de todas las páginas.
 */

import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light text-center py-3 mt-auto">
      <Container>
        <p className="mb-0">© 2026 Comi-Rapi - Todos los derechos reservados</p>
      </Container>
    </footer>
  );
};

export default Footer;
