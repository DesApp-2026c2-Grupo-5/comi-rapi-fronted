/**
 * Propósito: Aviso de estado vacío (sin direcciones, sin cupones, etc.) con
 *            acción opcional. Se usa en el carrito y otras pantallas de cliente.
 * Contenido: Componente AvisoEstadoVacío con icono, título, detalle y enlace
 *            de acción.
 * Dependencias: react-icons/fa.
 * Uso:
 *   <AvisoEstadoVacío
 *     titulo="No tenés direcciones guardadas."
 *     detalle="Agregá una dirección antes de confirmar tu pedido."
 *     accion={{ texto: 'Agregá una dirección', href: '/cliente/perfil#direcciones' }}
 *   />
 */

import { Link } from 'react-router-dom';
import { FaMapMarkerAlt } from 'react-icons/fa';
import PropTypes from 'prop-types';
import './AvisoEstadoVacío.css';

const AvisoEstadoVacío = ({
  titulo,
  detalle,
  accion,
  className = '',
}) => {
  return (
    <div className={`aviso-estado-vacío ${className}`} role="status" aria-live="polite">
      <div className="aviso-estado-vacío-fila">
        <div className="aviso-estado-vacío-icono">
          <FaMapMarkerAlt aria-hidden="true" />
        </div>
        <div className="aviso-estado-vacío-texto">
          <div className="aviso-estado-vacío-titulo">{titulo}</div>
          <div className="aviso-estado-vacío-detalle">
            {detalle}
            {accion && (
              <>
                {' '}
                <Link
                  to={accion.href}
                  state={accion.state}
                  className="aviso-estado-vacío-accion"
                >
                  {accion.texto}
                </Link>
                {accion.sufijo && <span>{accion.sufijo}</span>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

AvisoEstadoVacío.propTypes = {
  /** Título del aviso. */
  titulo: PropTypes.string.isRequired,
  /** Detalle del aviso. */
  detalle: PropTypes.string.isRequired,
  /** Acción opcional: texto, href y state para el enlace. */
  accion: PropTypes.shape({
    texto: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    state: PropTypes.object,
    sufijo: PropTypes.string,
  }),
  className: PropTypes.string,
};

export default AvisoEstadoVacío;
