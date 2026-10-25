/**
 * Propósito: Mostrar y capturar una puntuación de 1 a 5 estrellas.
 * Contenido: Estrellas (solo lectura) y variante interactiva con onChange.
 * Dependencias: react-icons/fa, Estrellas.css.
 * Uso: <Estrellas valor={4.3} /> · <Estrellas valor={p} onChange={setP} />
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { FaStar, FaRegStar } from 'react-icons/fa';
import './Estrellas.css';

const Estrellas = ({ valor = 0, onChange, tamano = 18, etiqueta }) => {
  const [hover, setHover] = useState(0);
  const redondeado = Math.max(0, Math.min(5, Math.round(Number(valor) || 0)));

  if (!onChange) {
    return (
      <span
        className="estrellas-comi"
        role="img"
        aria-label={`${redondeado} de 5 estrellas`}
      >
        {[1, 2, 3, 4, 5].map((n) =>
          n <= redondeado ? (
            <FaStar key={n} size={tamano} aria-hidden="true" />
          ) : (
            <FaRegStar key={n} size={tamano} aria-hidden="true" />
          )
        )}
      </span>
    );
  }

  const visibles = hover || redondeado;

  return (
    <div className="estrellas-comi-input">
      <div
        className="estrellas-comi-botones"
        role="radiogroup"
        aria-label={etiqueta || 'Puntuación'}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={redondeado === n}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            className={n <= visibles ? 'activa' : ''}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
          >
            {n <= visibles ? (
              <FaStar size={tamano + 6} aria-hidden="true" />
            ) : (
              <FaRegStar size={tamano + 6} aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
      <span className="estrellas-comi-valor" aria-live="polite">
        {redondeado ? `${redondeado} de 5` : 'Elegí una puntuación'}
      </span>
    </div>
  );
};

Estrellas.propTypes = {
  valor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onChange: PropTypes.func,
  tamano: PropTypes.number,
  etiqueta: PropTypes.string,
};

export default Estrellas;
