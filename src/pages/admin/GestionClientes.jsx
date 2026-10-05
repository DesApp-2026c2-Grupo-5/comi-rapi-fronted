/**
 * Propósito: Página de gestión de clientes que renderiza ListaClientes.
 * Contenido: Componente GestionClientes con Container de Bootstrap.
 * Dependencias: react-bootstrap (Container), ListaClientes.
 * Uso: Ruta "/admin/clientes" → <GestionClientes />
 */

import { Container } from 'react-bootstrap';
import ListaClientes from '../../components/admin/ListaClientes';

const GestionClientes = () => {
  return (
    <Container fluid className="py-4">
      <ListaClientes />
    </Container>
  );
};

export default GestionClientes;
