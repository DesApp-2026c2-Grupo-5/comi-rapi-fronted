/**
 * Propósito: Página de gestión de administradores del superadministrador.
 * Contenido: Componente GestionAdministradores con Container de Bootstrap.
 * Dependencias: react-bootstrap (Container), components/superadmin/GestionAdministradores.
 * Uso: Ruta "/superadmin/administradores" → <GestionAdministradores />
 */

import { Container } from 'react-bootstrap';
import GestionAdministradores from '../../components/superadmin/GestionAdministradores';

const GestionAdministradoresPage = () => {
  return (
    <Container fluid className="py-4">
      <GestionAdministradores />
    </Container>
  );
};

export default GestionAdministradoresPage;