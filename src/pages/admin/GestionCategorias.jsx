/**
 * Propósito: Página de gestión de categorías que renderiza ListaCategorias.
 * Contenido: Componente GestionCategorias con Container de Bootstrap.
 * Dependencias: react-bootstrap (Container), ListaCategorias.
 * Uso: Ruta "/admin/categorias" → <GestionCategorias />
 */

import React from 'react';
import { Container } from 'react-bootstrap';
import ListaCategorias from '../../components/admin/ListaCategorias';

const GestionCategorias = () => {
  return (
    <Container fluid className="py-4">
      <ListaCategorias />
    </Container>
  );
};

export default GestionCategorias;
