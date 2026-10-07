/**
 * Propósito: Página del panel de superadministración que renderiza el resumen
 *            global de métricas.
 * Contenido: Componente PanelSuperadmin con Container de Bootstrap.
 * Dependencias: react-bootstrap (Container), components/superadmin/PanelSuperadmin.
 * Uso: Ruta "/superadmin/panel" → <PanelSuperadmin />
 */

import { Container } from 'react-bootstrap';
import PanelSuperadmin from '../../components/superadmin/PanelSuperadmin';

const PanelSuperadminPage = () => {
  return (
    <Container fluid className="py-4">
      <PanelSuperadmin />
    </Container>
  );
};

export default PanelSuperadminPage;