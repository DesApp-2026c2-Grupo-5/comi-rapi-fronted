/**
 * Propósito: Aviso unificado cuando las sucursales están cerradas o no pueden
 *            tomar pedidos. Se usa en catálogo, carrito y pago.
 * Contenido: Componente AvisoCierreSucursales con variantes (catálogo, carrito,
 *            pago). Muestra el estado cerrado, el motivo y la próxima apertura.
 * Dependencias: react-icons/fa, utils/horarios.
 * Uso:
 *   <AvisoCierreSucursales variante="catalogo" />
 *   <AvisoCierreSucursales variante="carrito" mensaje="..." />
 *   <AvisoCierreSucursales variante="pago" proximaApertura={...} />
 */

import { FaStore, FaLock } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { formatearProximaApertura } from '../../utils/horarios';
import './AvisoCierreSucursales.css';

const VARIANTES = {
  catalogo: 'catalogo',
  carrito: 'carrito',
  pago: 'pago',
};

const ICONOS = {
  catalogo: <FaStore aria-hidden="true" />,
  carrito: <FaLock aria-hidden="true" />,
  pago: <FaLock aria-hidden="true" />,
};

const TITULOS = {
  catalogo: 'Estamos cerrados.',
  carrito: 'No podemos tomar tu pedido ahora.',
  pago: 'La sucursal cerró.',
};

const AvisoCierreSucursales = ({
  variante = 'catalogo',
  proximaApertura,
  mensaje,
  className = '',
}) => {
  const tipo = VARIANTES[variante] || 'catalogo';
  const icono = ICONOS[tipo];
  const titulo = TITULOS[tipo];

  const cuando = proximaApertura ? formatearProximaApertura(proximaApertura) : null;

  const detalle =
    mensaje ||
    (cuando
      ? `Lo sentimos, las sucursales cercanas ya están cerradas. Volvemos a abrir ${cuando}.`
      : 'Lo sentimos, no hay sucursales disponibles en este momento.');

  return (
    <div className={`aviso-cierre aviso-cierre--${tipo} ${className}`} role="status" aria-live="polite">
      <div className="aviso-cierre-fila">
        <div className="aviso-cierre-icono">{icono}</div>
        <div className="aviso-cierre-texto">
          <div className="aviso-cierre-titulo">{titulo}</div>
          <div className="aviso-cierre-detalle">{detalle}</div>
        </div>
      </div>
    </div>
  );
};

AvisoCierreSucursales.propTypes = {
  /** Tipo de aviso: 'catalogo', 'carrito' o 'pago'. */
  variante: PropTypes.oneOf(['catalogo', 'carrito', 'pago']),
  /** Datos de la próxima apertura (proximaApertura del backend). */
  proximaApertura: PropTypes.object,
  /** Mensaje personalizado (opcional). */
  mensaje: PropTypes.string,
  className: PropTypes.string,
};

export default AvisoCierreSucursales;
