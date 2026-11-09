/**
 * Propósito: Selector de tema claro / oscuro para los encabezados y el menú de
 *            cuenta.
 * Contenido: Componente SelectorTema en dos variantes: `compacto` (interruptor
 *            suelto para la barra) y `fila` (renglón con etiqueta para el menú
 *            de cuenta, más el acceso a "seguir el tema del sistema").
 * Dependencias: react-icons/fa, useTema, utils/temaStorage (TEMAS),
 *               SelectorTema.css.
 * Uso: <SelectorTema /> en la barra; <SelectorTema variante="fila" /> dentro
 *      de MenuCuenta.
 *
 * El interruptor imita el gesto de un switch físico: un disco que se corre de
 * izquierda a derecha. En claro es un sol sobre cielo diurno; en oscuro, una
 * luna con cráteres sobre cielo nocturno con estrellas. El estado se expone con
 * `role="switch"` y `aria-checked`, así el lector de pantalla anuncia si el modo
 * oscuro está activo, y el foco de teclado se dibuja sobre la pista.
 *
 * El tema "sistema" no desaparece: el switch siempre deja una elección explícita
 * (claro u oscuro) y, mientras la preferencia no sea la del sistema, la variante
 * `fila` ofrece volver a seguirla.
 */

import { FaDesktop, FaMoon, FaSun } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useTema } from '../../hooks/useTema';
import { TEMAS } from '../../utils/temaStorage';
import './SelectorTema.css';

/**
 * Pista del interruptor: cielo, estrellas, nube y disco.
 * @param {{ oscuro: boolean }} props
 */
const PistaTema = ({ oscuro }) => (
  <span
    className={`tema-switch-pista${
      oscuro ? ' tema-switch-pista-oscura' : ''
    }`}
    aria-hidden="true"
  >
    <span className="tema-switch-estrellas" />
    <span className="tema-switch-nube" />
    <span className="tema-switch-boton">
      <span className="tema-switch-crater tema-switch-crater-1" />
      <span className="tema-switch-crater tema-switch-crater-2" />
    </span>
  </span>
);

PistaTema.propTypes = {
  oscuro: PropTypes.bool.isRequired,
};

const SelectorTema = ({ variante = 'compacto', className = '' }) => {
  const { tema, temaResuelto, definirTema } = useTema();
  const oscuro = temaResuelto === TEMAS.OSCURO;
  const alternar = () => definirTema(oscuro ? TEMAS.CLARO : TEMAS.OSCURO);
  const etiqueta = oscuro ? 'Desactivar modo oscuro' : 'Activar modo oscuro';

  if (variante === 'fila') {
    return (
      <div className="menu-cuenta-tema">
        <button
          type="button"
          role="switch"
          aria-checked={oscuro}
          className="menu-cuenta-opcion menu-cuenta-tema-fila"
          onClick={alternar}
        >
          <span className="menu-cuenta-icono" aria-hidden="true">
            {oscuro ? <FaMoon /> : <FaSun />}
          </span>
          <span className="menu-cuenta-texto">Modo oscuro</span>
          <span className="tema-switch tema-switch-fila" aria-hidden="true">
            <PistaTema oscuro={oscuro} />
          </span>
        </button>

        {tema !== TEMAS.SISTEMA && (
          <button
            type="button"
            className="menu-cuenta-sistema"
            onClick={() => definirTema(TEMAS.SISTEMA)}
          >
            <FaDesktop aria-hidden="true" />
            Seguir el tema del sistema
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={oscuro}
      aria-label={etiqueta}
      title={etiqueta}
      className={`tema-switch ${className}`.trim()}
      onClick={alternar}
    >
      <PistaTema oscuro={oscuro} />
    </button>
  );
};

SelectorTema.propTypes = {
  variante: PropTypes.oneOf(['compacto', 'fila']),
  className: PropTypes.string,
};

export default SelectorTema;
