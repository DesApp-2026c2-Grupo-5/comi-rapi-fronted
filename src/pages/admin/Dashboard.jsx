/**
 * Propósito: Página de dashboard del admin que renderiza PanelAdmin.
 * Contenido: Componente Dashboard con Container de Bootstrap.
 * Dependencias: react-bootstrap (Container), PanelAdmin.
 * Uso: Ruta "/admin/dashboard" → <Dashboard />
 */

import React from 'react';
import { Container } from 'react-bootstrap';
import PanelAdmin from '../../components/admin/PanelAdmin';

const Dashboard = () => {
  return (
    <Container fluid className="py-4">
      <PanelAdmin />
    </Container>
  );
};

export default Dashboard;
