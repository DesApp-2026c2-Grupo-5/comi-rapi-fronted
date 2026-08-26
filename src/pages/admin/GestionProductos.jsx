/**
 * Propósito: Página de gestión de productos que renderiza ListaProductos.
 * Contenido: Componente GestionProductos con Container de Bootstrap.
 * Dependencias: react-bootstrap (Container), ListaProductos.
 * Uso: Ruta "/admin/productos" → <GestionProductos />
 */

import React from 'react';
import { Container } from 'react-bootstrap';
import ListaProductos from '../../components/admin/ListaProductos';

const GestionProductos = () => {
  return (
    <Container fluid className="py-4">
      <ListaProductos />
    </Container>
  );
};

export default GestionProductos;
