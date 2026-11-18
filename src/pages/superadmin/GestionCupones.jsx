/**
 * Propósito: Página de gestión de cupones para el SUPERADMINISTRADOR.
 * Contenido: Contenedor que renderiza GestionCupones.
 * Dependencias: react-bootstrap, GestionCupones.
 * Uso: Ruta "/superadmin/cupones".
 */

import { Container } from 'react-bootstrap';
import GestionCupones from '../../components/superadmin/GestionCupones';

const GestionCuponesPage = () => (
  <Container fluid className="py-4">
    <GestionCupones />
  </Container>
);

export default GestionCuponesPage;
