/**
 * Propósito: Aviso global del catálogo cuando NINGUNA sucursal activa está
 *            tomando pedidos.
 * Contenido: Componente AvisoSucursalesCerradas que reutiliza el aviso
 *            unificado de cierre de sucursales (variante "catalogo").
 * Dependencias: react-icons/fa, useSucursal, AvisoCierreSucursales.
 * Uso: <AvisoSucursalesCerradas className="mb-4" />
 *
 * Es un aviso de catálogo: se muestra una sola vez por pantalla y no por
 * producto. El backend rechaza igual el alta del pedido y la confirmación del
 * pago si la sucursal asignada ya cerró.
 */

import { useSucursal } from '../../hooks/useSucursal';
import AvisoCierreSucursales from './AvisoCierreSucursales';
import PropTypes from 'prop-types';

const AvisoSucursalesCerradas = ({ className = '' }) => {
  const { todasCerradas, proximaApertura } = useSucursal();
  if (!todasCerradas) return null;

  return (
    <AvisoCierreSucursales
      variante="catalogo"
      proximaApertura={proximaApertura}
      className={className}
    />
  );
};

export default AvisoSucursalesCerradas;

AvisoSucursalesCerradas.propTypes = {
  className: PropTypes.string,
};
