/**
 * Propósito: Aviso global del catálogo cuando NINGUNA sucursal activa está
 *            tomando pedidos.
 * Contenido: Componente AvisoSucursalesCerradas, con la próxima apertura
 *            informada por el backend.
 * Dependencias: react-bootstrap (Alert), react-icons/fa, useSucursal,
 *               utils/horarios.js.
 * Uso: <AvisoSucursalesCerradas className="mb-4" />
 *
 * Es un aviso de catálogo: se muestra una sola vez por pantalla y no por
 * producto. El backend rechaza igual el alta del pedido y la confirmación del
 * pago si la sucursal asignada ya cerró.
 */

import { Alert } from 'react-bootstrap';
import { FaRegClock } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useSucursal } from '../../hooks/useSucursal';
import { formatearProximaApertura } from '../../utils/horarios';

const AvisoSucursalesCerradas = ({ className = '' }) => {
  const { todasCerradas, proximaApertura } = useSucursal();
  if (!todasCerradas) return null;

  const cuando = formatearProximaApertura(proximaApertura);
  return (
    <Alert variant="warning" role="status" className={className}>
      <FaRegClock aria-hidden="true" className="me-2" />
      <strong>Estamos cerrados.</strong>{' '}
      {cuando
        ? `Volvemos a abrir ${cuando}.`
        : 'Volvemos a abrir en el próximo horario de atención.'}
    </Alert>
  );
};

AvisoSucursalesCerradas.propTypes = {
  className: PropTypes.string,
};

export default AvisoSucursalesCerradas;
