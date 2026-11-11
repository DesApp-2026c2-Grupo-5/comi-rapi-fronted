/**
 * Propósito: Página del panel de superadministración con los reportes globales.
 * Contenido: Componente PanelSuperadminPage con Container y ReporteNegocio.
 * Dependencias: react-bootstrap (Container), components/reportes/ReporteNegocio.
 * Uso: Ruta "/superadmin/panel" → <PanelSuperadminPage />
 */

import { Container } from 'react-bootstrap';
import ReporteNegocio from '../../components/reportes/ReporteNegocio';
import ErrorBoundary from '../../components/comunes/ErrorBoundary';

const PanelSuperadminPage = () => {
  return (
    <Container fluid className="py-4">
      <ErrorBoundary>
        <ReporteNegocio />
      </ErrorBoundary>
    </Container>
  );
};

export default PanelSuperadminPage;