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
 * requerido (agrega el asterisco) y autoComplete.
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
  etiqueta,
  value,
  onChange,
  autoComplete = 'current-password',
  placeholder,
  requerido = true,
  className = '',
  icono = null,
  claseIcono = '',
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
      <Form.Label htmlFor={id}>
        {etiqueta}
        {requerido ? ' *' : ''}
      </Form.Label>
      {icono && <span className={claseIcono}>{icono}</span>}
      <div className="campo-password">
        <Form.Control
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="campo-password-ojo"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Ocultar ${etiqueta.toLowerCase()}` : `Ver ${etiqueta.toLowerCase()}`}
          title={visible ? 'Ocultar' : 'Ver'}
        >
          {/* El ícono refleja el estado: ojo = se ve, ojo tachado = está tapada. */}
          {visible ? <FaEye aria-hidden="true" /> : <FaEyeSlash aria-hidden="true" />}
        </button>
      </div>
    </Form.Group>
  );
};
/* eslint-enable react/prop-types */

export default CampoPassword;
