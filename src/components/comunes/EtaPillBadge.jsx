import PropTypes from 'prop-types';
import './EtaPillBadge.css';

// Clock SVG for arrival time
const clockSvg = `<svg font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-weight="430" fill="currentColor" height="150px" viewBox="0 0 100 100" width="150px" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" stroke-width="3.5"/><g stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M50 12 V17 M50 83 V88 M12 50 H17 M83 50 H88"/></g><g fill="currentColor"><circle cx="50" cy="12" r="1.8"/><circle cx="88" cy="50" r="1.8"/><circle cx="50" cy="88" r="1.8"/><circle cx="12" cy="50" r="1.8"/></g><g stroke="currentColor" stroke-width="3.5" stroke-linecap="round"><path d="M50 50 V25 M50 50 L69 61"/></g><circle cx="50" cy="50" r="3.5" fill="currentColor"/></svg>`;

// Moto SVG - simplified scooter icon
const motoSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.5 14.5c.5.5.5 1.3 0 1.8l-3.5 3.5c-.5.5-1.3.5-1.8 0l-4.5-4.5c-.5-.5-.5-1.3 0-1.8l3.5-3.5c.5-.5 1.3-.5 1.8 0l4.5 4.5c.5.5.5 1.3 0 1.8z"/><path d="M18.5 5.5c-.5-.5-1.3-.5-1.8 0l-4.5 4.5c-.5.5-.5 1.3 0 1.8l3.5 3.5c.5.5 1.3.5 1.8 0l4.5-4.5c.5.5.5 1.3 0 1.8z"/></svg>`;

/**
 * ETA Badge - Componente visual para tiempo estimado de entrega
 * Variantes: 'map' (compacto para popups) | 'detail' (completo para detalle de pedido)
 */
const EtaPillBadge = ({ 
  minutes, 
  storeName = 'Comi-Rapi', 
  variant = 'detail', // 'map' | 'detail'
  className = '',
  arrivalTime, // ISO string o Date para "Llega a las XX:XX"
}) => {
  if (!minutes && !arrivalTime) return null;

  const formatArrivalTime = (time) => {
    if (!time) return null;
    const date = new Date(time);
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const arrivalFormatted = arrivalTime ? formatArrivalTime(arrivalTime) : null;
  const displayMinutes = minutes || (arrivalFormatted ? null : 0);

  return (
    <div 
      className={`comi-eta-badge ${variant === 'map' ? 'variant-map' : ''} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`Tiempo estimado de entrega: ${displayMinutes ? `${displayMinutes} minutos` : `llega a las ${arrivalFormatted}`}`}
    >
      <div className="comi-eta-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: motoSvg }} />
      
      <div className="comi-eta-text">
        {variant === 'detail' && (
          <span className="comi-eta-label">Tiempo estimado</span>
        )}
        <span className="comi-eta-time">
          {displayMinutes ? `${displayMinutes} min` : arrivalFormatted ? `Llega ${arrivalFormatted}` : '—'}
        </span>
        {variant === 'detail' && storeName && (
          <span className="comi-eta-store">{storeName}</span>
        )}
        {arrivalFormatted && variant === 'detail' && (
          <span className="comi-eta-arrival">Llega ~{arrivalFormatted}</span>
        )}
        {arrivalFormatted && (
          <div className="comi-eta-clock" aria-hidden="true" dangerouslySetInnerHTML={{ __html: clockSvg }} />
        )}
      </div>
    </div>
  );
};

EtaPillBadge.propTypes = {
  minutes: PropTypes.number,
  storeName: PropTypes.string,
  variant: PropTypes.oneOf(['map', 'detail']),
  className: PropTypes.string,
  arrivalTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

EtaPillBadge.defaultProps = {
  minutes: null,
  storeName: 'Comi-Rapi',
  variant: 'detail',
  className: '',
  arrivalTime: null,
};

export default EtaPillBadge;