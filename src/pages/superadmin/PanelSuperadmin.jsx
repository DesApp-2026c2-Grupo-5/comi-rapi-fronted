/**
 * Propósito: Página del panel de superadministración con los reportes globales.
 * Contenido: Componente PanelSuperadminPage con Container y ReporteNegocio.
 * Dependencias: react-bootstrap (Container), components/reportes/ReporteNegocio.
 * Uso: Ruta "/superadmin/panel" → <PanelSuperadminPage />
 */

import { Container } from 'react-bootstrap';
import ReporteNegocio from '../../components/reportes/ReporteNegocio';

const PanelSuperadminPage = () => {
  return (
    <Container fluid className="py-4">
      <ReporteNegocio />
    </Container>
  );
};

export default PanelSuperadminPage;