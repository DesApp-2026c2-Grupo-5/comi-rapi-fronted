/**
 * Propósito: Página de reportes compartida por ADMINISTRADOR y SUPERADMINISTRADOR.
 * Contenido: Componente Reportes con el Container de Bootstrap y ReporteNegocio.
 * Dependencias: react-bootstrap (Container), components/reportes/ReporteNegocio.
 * Uso: Rutas "/admin/reportes" y "/superadmin/reportes" → <Reportes />.
 */

import { Container } from 'react-bootstrap';
import ReporteNegocio from '../../components/reportes/ReporteNegocio';

const Reportes = () => (
  <Container fluid className="py-4">
    <ReporteNegocio />
  </Container>
);

export default Reportes;
