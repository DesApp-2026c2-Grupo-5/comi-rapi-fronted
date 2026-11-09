/**
 * Propósito: Campanita del header con el contador de notificaciones sin leer.
 * Contenido: Componente CampanaNotificaciones; abre el drawer del centro.
 * Dependencias: react-icons/fa, useNotificacionesCentro, CentroNotificaciones.css.
 * Uso: <CampanaNotificaciones /> — sólo para el rol CLIENTE.
 *
 * El badge muestra "9+" a partir de diez para no romper el círculo, pero el
 * aria-label lleva el total real, así que el número exacto no se pierde para
 * quien usa lector de pantalla.
 */

import PropTypes from 'prop-types';
import { FaBell } from 'react-icons/fa';
import { useNotificacionesCentro } from '../../hooks/useNotificacionesCentro';
import './CentroNotificaciones.css';

const CampanaNotificaciones = ({ className = '' }) => {
  const { noLeidas, abierto, pulso, abrir } = useNotificacionesCentro();

  const etiqueta =
    noLeidas > 0
      ? `Notificaciones: ${noLeidas} sin leer`
      : 'Notificaciones: no hay novedades';

  return (
    <button
      type="button"
      className={`campana-notificaciones${className ? ` ${className}` : ''}`}
      onClick={abrir}
      aria-label={etiqueta}
      aria-haspopup="dialog"
      aria-expanded={abierto}
      title="Notificaciones"
    >
      <FaBell aria-hidden="true" />
      {noLeidas > 0 && (
        <span
          className={`campana-badge${pulso ? ' campana-badge-pulso' : ''}`}
          aria-hidden="true"
        >
          {noLeidas > 9 ? '9+' : noLeidas}
        </span>
      )}
    </button>
  );
};

export default CampanaNotificaciones;

CampanaNotificaciones.propTypes = {
  className: PropTypes.string,
};
