/**
 * Propósito: Página de dashboard del admin con los reportes de su sucursal.
 * Contenido: Componente Dashboard con Container de Bootstrap y ReporteNegocio.
 * Dependencias: react-bootstrap (Container), components/reportes/ReporteNegocio.
 * Uso: Ruta "/admin/dashboard" → <Dashboard />
 */

import { Container } from 'react-bootstrap';
import ReporteNegocio from '../../components/reportes/ReporteNegocio';

const Dashboard = () => {
  return (
    <Container fluid className="py-4">
      <ReporteNegocio />
    </Container>
  );
};

export default Dashboard;
