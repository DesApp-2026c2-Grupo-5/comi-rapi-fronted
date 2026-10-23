/**
 * Propósito: Subnavegación del módulo de Personalización.
 * Contenido: alterna entre la configuración por producto y por categoría.
 * Dependencias: react-bootstrap, react-router-dom.
 * Uso: <SubnavPersonalizacion />
 */

import { Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const SubnavPersonalizacion = () => {
  const { pathname } = useLocation();
  const enCategorias = pathname.startsWith(
    '/superadmin/personalizacion/categorias'
  );

  return (
    <div className="d-flex gap-2 flex-wrap mb-3">
      <Button
        as={Link}
        to="/superadmin/personalizacion"
        variant={enCategorias ? 'outline-primary' : 'primary'}
        style={{ borderRadius: '50px', fontWeight: 600 }}
      >
        Por producto
      </Button>
      <Button
        as={Link}
        to="/superadmin/personalizacion/categorias"
        variant={enCategorias ? 'primary' : 'outline-primary'}
        style={{ borderRadius: '50px', fontWeight: 600 }}
      >
        Por categoría
      </Button>
    </div>
  );
};

export default SubnavPersonalizacion;
