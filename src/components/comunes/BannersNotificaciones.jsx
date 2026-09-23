/**
 * Propósito: Renderiza los banners de notificación inline dentro del contenido
 *            de la página (se monta en App.jsx, dentro de <main>, antes de las rutas).
 * Contenido: Componente BannersNotificaciones que lee los banners activos del
 *            contexto y los dibuja con la estética de la página: fondo crema,
 *            borde naranja, icono según tipo y botón de cierre (X).
 * Dependencias: react-icons/fa, hooks/useNotificaciones, BannersNotificaciones.css.
 * Uso: <BannersNotificaciones /> - Se renderiza en App.jsx dentro de <main>.
 */

import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
  FaTimesCircle,
} from 'react-icons/fa';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import './BannersNotificaciones.css';

// Icono y color por tipo, alineados a la paleta de Comi-Rapi.
const CONFIG_TIPO = {
  success: { icono: FaCheckCircle, color: '#22c55e' },
  danger: { icono: FaTimesCircle, color: '#e63946' },
  warning: { icono: FaExclamationTriangle, color: '#e88900' },
  info: { icono: FaInfoCircle, color: '#f07f10' },
};

const BannersNotificaciones = () => {
  const { banners, quitar } = useNotificaciones();

  if (banners.length === 0) return null;

  return (
    <div className="banners-inline">
      {banners.map((banner) => {
        const config = CONFIG_TIPO[banner.tipo] || CONFIG_TIPO.info;
        const Icono = config.icono;
        return (
          <div
            key={banner.id}
            className={`batch-notificacion${banner.enClick ? ' banner-clickeable' : ''}`}
            style={{ borderLeftColor: config.color }}
            role={banner.enClick ? 'button' : 'alert'}
            tabIndex={banner.enClick ? 0 : undefined}
            onClick={
              banner.enClick
                ? () => {
                    banner.enClick();
                    quitar(banner.id);
                  }
                : undefined
            }
            onKeyDown={
              banner.enClick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      banner.enClick();
                      quitar(banner.id);
                    }
                  }
                : undefined
            }
          >
            <Icono
              className="batch-notificacion-icono"
              style={{ color: config.color }}
              aria-hidden="true"
            />
            <span className="batch-notificacion-mensaje">{banner.mensaje}</span>
            <button
              type="button"
              className="batch-notificacion-cerrar"
              aria-label="Cerrar notificación"
              onClick={(e) => {
                e.stopPropagation();
                quitar(banner.id);
              }}
            >
              <FaTimes aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default BannersNotificaciones;