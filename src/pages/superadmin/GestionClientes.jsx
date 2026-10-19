/**
 * Propósito: Página de clientes del SUPERADMINISTRADOR: todos los clientes
 *            registrados (rol CLIENTE), incluso los que todavía no compraron
 *            ni tienen pedidos en ninguna sucursal.
 * Contenido: Reutiliza ListaClientes con la prop `todos`.
 * Dependencias: react-bootstrap (Container), ListaClientes.
 * Uso: Ruta "/superadmin/clientes" → <GestionClientesSuperadmin />
 */

import { Container } from 'react-bootstrap';
import ListaClientes from '../../components/admin/ListaClientes';

const GestionClientesSuperadmin = () => {
  return (
    <Container fluid className="py-4">
      <ListaClientes todos />
    </Container>
  );
};

export default GestionClientesSuperadmin;