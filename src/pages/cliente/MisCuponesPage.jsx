/**
 * Propósito: Página "Mis cupones" del CLIENTE.
 * Contenido: Contenedor que renderiza MisCupones.
 * Dependencias: react-bootstrap, MisCupones.
 * Uso: Ruta "/cliente/mis-cupones".
 */

import { Container } from 'react-bootstrap';
import MisCupones from '../../pages/cliente/MisCupones';

const MisCuponesPage = () => (
  <Container fluid className="py-4">
    <MisCupones />
  </Container>
);

export default MisCuponesPage;
