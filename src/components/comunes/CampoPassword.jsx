/**
 * Propósito: Campo de contraseña con un ojo que permite verla un instante.
 *            Se usa en el perfil, el login y el registro para no tener que
 *            repetir el input en cada pantalla.
 * Contenido: Componente CampoPassword con input de contraseña, botón de ojo
 *            (mostrar/ocultar) y ocultado automático al segundo.
 * Dependencias: react-bootstrap (Form), react-icons/fa, CampoPassword.css.
 * Uso: <CampoPassword id="password" etiqueta="Contraseña" value={password}
 *      onChange={handler} autoComplete="current-password" />
 *
 * Opcionales: className (el Form.Group), icono + claseIcono (ícono a la
 * izquierda, como el candado de las pantallas de acceso), placeholder,
 * requerido (agrega el asterisco), autoComplete, error (mensaje inline) y
 * ayuda (pista permanente que se anuncia junto al campo).
 */

import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './CampoPassword.css';

// Cuánto tiempo queda a la vista la contraseña antes de volver a taparse.
const MILISEGUNDOS_VISIBLE = 1000;

/* El proyecto no tiene la dependencia "prop-types" (ningún componente declara
   PropTypes), así que se desactiva esa regla en este archivo en vez de agregar
   un paquete nuevo. */
/* eslint-disable react/prop-types */
const CampoPassword = ({
  id,
  name,
  etiqueta,
  value,
  onChange,
  autoComplete = 'current-password',
  placeholder,
  requerido = true,
  className = '',
  icono = null,
  claseIcono = '',
  error = null,
  ayuda = null,
}) => {
  const [visible, setVisible] = useState(false);

  // Ver la contraseña es momentáneo: a los milisegundos se vuelve a tapar sola.
  useEffect(() => {
    if (!visible) return undefined;
    const temporizador = setTimeout(() => setVisible(false), MILISEGUNDOS_VISIBLE);
    return () => clearTimeout(temporizador);
  }, [visible]);

  return (
    <Form.Group className={className}>
      {/* `htmlFor`/`id` son los que hacen que el label sea clickeable y quede
          asociado al control para los lectores de pantalla. */}
      <Form.Label htmlFor={id}>
        {etiqueta}
        {requerido ? ' *' : ''}
      </Form.Label>
      {icono && <span className={claseIcono}>{icono}</span>}
      {/* La pista permanente va antes del input para que `aria-describedby` la
          anuncie al enfocar el campo, no solo después de que falle. */}
      {ayuda && (
        <Form.Text id={`${id}-ayuda`} className="campo-password-ayuda">
          {ayuda}
        </Form.Text>
      )}
      <div className="campo-password">
        <Form.Control
          id={id}
          name={name || id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={requerido}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
          isInvalid={Boolean(error)}
        />
        <button
          type="button"
          className="campo-password-ojo"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Ocultar ${etiqueta.toLowerCase()}` : `Ver ${etiqueta.toLowerCase()}`}
          aria-pressed={visible}
          title={visible ? 'Ocultar' : 'Ver'}
        >
          {/* El ícono refleja el estado: ojo = se ve, ojo tachado = está tapada. */}
          {visible ? <FaEye aria-hidden="true" /> : <FaEyeSlash aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <div id={`${id}-error`} className="invalid-feedback d-block">
          {error}
        </div>
      )}
    </Form.Group>
  );
};
/* eslint-enable react/prop-types */

export default CampoPassword;
