/**
 * Propósito: Página de parámetros de negocio del superadministrador.
 * Contenido: Componente Parametros con Container de Bootstrap y el formulario.
 * Dependencias: react-bootstrap (Container), FormularioParametros.
 * Uso: Ruta "/superadmin/parametros" → <Parametros />
 */

import { Container } from 'react-bootstrap';
import FormularioParametros from '../../components/superadmin/FormularioParametros';

const Parametros = () => {
  return (
    <Container fluid className="py-4">
      <h1 className="h3 mb-1">Parámetros</h1>
      <p className="text-muted mb-4">
        Reglas de negocio que valen para toda la aplicación: envío, cobertura,
        límites del carrito y de pedidos, y promociones. Los valores los aplica
        el backend.
      </p>
      <FormularioParametros />
    </Container>
  );
};

export default Parametros;