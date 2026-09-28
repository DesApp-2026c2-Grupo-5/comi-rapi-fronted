/**
 * Propósito: Página de gestión de promociones que renderiza ListaPromociones.
 * Contenido: Componente GestionPromociones con Container de Bootstrap.
 * Dependencias: react-bootstrap (Container), ListaPromociones.
 * Uso: Ruta "/admin/promociones" → <GestionPromociones />
 */

import React from 'react';
import { Container } from 'react-bootstrap';
import ListaPromociones from '../../components/admin/ListaPromociones';

const GestionPromociones = () => {
  return (
    <Container fluid className="py-4">
      <ListaPromociones />
    </Container>
  );
};

export default GestionPromociones;
