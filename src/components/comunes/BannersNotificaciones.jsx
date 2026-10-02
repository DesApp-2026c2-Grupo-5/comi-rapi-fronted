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
    // `aria-live="polite"` en el contenedor: los avisos se anuncian cuando
    // aparecen sin interrumpir lo que el usuario está leyendo. Es preferible a
    // `role="alert"`, que interrumpe con cada mensaje.
    <div className="banners-inline" role="status" aria-live="polite">
      {banners.map((banner) => {
        const config = CONFIG_TIPO[banner.tipo] || CONFIG_TIPO.info;
        const Icono = config.icono;
        const cerrar = () => quitar(banner.id);
        return (
          <div
            key={banner.id}
            className="batch-notificacion"
            style={{ borderLeftColor: config.color }}
          >
            <Icono
              className="batch-notificacion-icono"
              style={{ color: config.color }}
              aria-hidden="true"
            />
            {banner.enClick ? (
              // El mensaje accionable es su propio <button>: así es un control
              // nativo (teclado, foco y Enter/Espacio sin código a mano) y no un
              // <div role="button"> que además contenía otro <button>.
              <button
                type="button"
                className="batch-notificacion-mensaje batch-notificacion-accion"
                onClick={() => {
                  banner.enClick();
                  cerrar();
                }}
              >
                {banner.mensaje}
              </button>
            ) : (
              <span className="batch-notificacion-mensaje">{banner.mensaje}</span>
            )}
            <button
              type="button"
              className="batch-notificacion-cerrar"
              aria-label="Cerrar notificación"
              onClick={cerrar}
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