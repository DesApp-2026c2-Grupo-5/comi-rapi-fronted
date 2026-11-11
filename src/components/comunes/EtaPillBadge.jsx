import PropTypes from 'prop-types';
import motoSvgRaw from '../../assets/icons/moto.svg?raw';
import clockSvgRaw from '../../assets/icons/clock.svg?raw';
import './EtaPillBadge.css';

// Los assets se inyectan inline. Se limpia el prólogo XML y los comentarios de
// `moto.svg` para que el marcado sea HTML válido dentro del contenedor.
const motoSvg = motoSvgRaw
  .replace(/<\?xml[\s\S]*?\?>/, '')
  .replace(/<!--[\s\S]*?-->/, '')
  .trim();
const clockSvg = clockSvgRaw.trim();

/**
 * ETA Badge - tiempo estimado de entrega. Componente independiente del mapa:
 * fondo blanco, icono de moto, minutos estimados, separador y hora de llegada.
 * Sin círculo de color, sin etiqueta "Tiempo estimado" y sin nombre de sucursal.
 * Variantes: 'map' (compacto para popups) | 'detail' (detalle de pedido).
 */
const EtaPillBadge = ({ minutes, arrivalTime, variant = 'detail', className = '' }) => {
  if (!minutes && !arrivalTime) return null;

  const arrivalFormatted = arrivalTime
    ? new Date(arrivalTime).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : null;

  const etiqueta = [
    minutes ? `Tiempo estimado de entrega: ${minutes} minutos` : null,
    arrivalFormatted ? `hora aproximada de llegada ${arrivalFormatted}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className={`comi-eta-badge${variant === 'map' ? ' variant-map' : ''} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={etiqueta}
    >
      <span
        className="comi-eta-icon"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: motoSvg }}
      />

      {minutes ? <span className="comi-eta-time">{minutes} min</span> : null}

      {arrivalFormatted && (
        <>
          <span className="comi-eta-separator" aria-hidden="true" />
          <span
            className="comi-eta-icon comi-eta-icon-clock"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: clockSvg }}
          />
          <span className="comi-eta-arrival">{arrivalFormatted}</span>
        </>
      )}
    </div>
  );
};

EtaPillBadge.propTypes = {
  minutes: PropTypes.number,
  arrivalTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  variant: PropTypes.oneOf(['map', 'detail']),
  className: PropTypes.string,
};

EtaPillBadge.defaultProps = {
  minutes: null,
  arrivalTime: null,
  variant: 'detail',
  className: '',
};

export default EtaPillBadge;
