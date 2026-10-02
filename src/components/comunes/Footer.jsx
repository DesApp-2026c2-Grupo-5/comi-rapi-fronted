/**
 * Propósito: Componente de pie de página con información de copyright.
 * Contenido: Componente Footer con texto de copyright usando Bootstrap.
 * Dependencias: react-bootstrap (Container).
 * Uso: <Footer /> - Se renderiza al final de todas las páginas.
 */

import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  // El año se calcula: escrito a mano envejece solo y queda desactualizado.
  const anio = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light text-center py-3 mt-auto">
      <Container>
        {/* `&nbsp;` evita que el año se caiga de línea; raya, no guion, y nombre
            de marca marcado como no traducible. */}
        <p className="mb-0">
          <span translate="no">
            &copy;&nbsp;{anio}&nbsp;Comi-Rapi
          </span>{' '}
          &mdash; Todos los derechos reservados
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
